import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthSystem";
import { db, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

type Gender = "male" | "female";
type TabKey =
  | "CBC"
  | "Lipid"
  | "Liver"
  | "Kidney"
  | "Thyroid"
  | "Hormones"
  | "Metabolic"
  | "Vitamins";
type StatusType = "low" | "normal" | "borderline" | "high" | "unknown";

interface MarkerRange {
  low?: number;
  normalMin: number;
  normalMax: number;
  borderlineMax?: number;
  high?: number;
}

interface MarkerDef {
  key: string;
  label: string;
  unit: string;
  getRange: (gender: Gender) => MarkerRange;
  getStatus: (value: number, gender: Gender) => StatusType;
  explain: (value: number, status: StatusType, gender: Gender) => string;
  recommend: (value: number, status: StatusType, gender: Gender) => string;
}

/* ================================================================== */
/* Biomarker definitions — standard adult reference ranges            */
/* ================================================================== */

const MARKERS: Record<TabKey, MarkerDef[]> = {
  CBC: [
    {
      key: "hemoglobin",
      label: "Hemoglobin",
      unit: "g/dL",
      getRange: (g) => (g === "male" ? { normalMin: 13, normalMax: 17 } : { normalMin: 12, normalMax: 15.5 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 13 : 12;
        const max = g === "male" ? 17 : 15.5;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Hemoglobin ${v} g/dL is below range. Hb carries oxygen in the blood — low levels indicate anaemia, causing fatigue, breathlessness and reduced training capacity.`;
        if (s === "high") return `Hemoglobin ${v} g/dL is above range. Elevated Hb may reflect dehydration, smoking, sleep apnoea, high altitude, or polycythaemia (excess red cells that thicken blood).`;
        return `Hemoglobin ${v} g/dL is healthy — your blood is carrying oxygen efficiently.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase iron-rich foods: spinach, lentils, beetroot, dates, jaggery and lean meats. Pair with vitamin C (amla, lemon) to boost absorption; avoid tea/coffee with meals. Confirm iron studies before supplementing.";
        if (s === "high") return "Hydrate well (3L+/day). If you smoke, quit. Persistently high Hb warrants a haematology review and a haematocrit check to rule out polycythaemia.";
        return "Maintain iron, B12 and folate intake. Regular aerobic training supports healthy red-cell turnover.";
      },
    },
    {
      key: "rbc",
      label: "RBC Count",
      unit: "million/µL",
      getRange: (g) => (g === "male" ? { normalMin: 4.5, normalMax: 5.9 } : { normalMin: 4.1, normalMax: 5.1 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 4.5 : 4.1;
        const max = g === "male" ? 5.9 : 5.1;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `RBC count ${v} million/µL is low. Too few red cells reduces oxygen delivery, driving anaemia and fatigue.`;
        if (s === "high") return `RBC count ${v} million/µL is high, often from dehydration, altitude adaptation, smoking or a bone-marrow disorder.`;
        return `RBC count ${v} million/µL is healthy, indicating good red-cell production.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Prioritise iron and B12-rich foods; avoid tea/coffee at mealtimes. Investigate the cause if symptomatic.";
        if (s === "high") return "Raise water intake, avoid diuretics, and get a haematocrit + EPO review to rule out polycythaemia.";
        return "Keep a nutrient-dense diet and stay active.";
      },
    },
    {
      key: "wbc",
      label: "WBC Count",
      unit: "/µL",
      getRange: () => ({ normalMin: 4000, normalMax: 11000 }),
      getStatus: (v) => (v < 4000 ? "low" : v > 11000 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `WBC ${v}/µL is low (leucopaenia). White cells fight infection — low counts weaken immune defence.`;
        if (s === "high") return `WBC ${v}/µL is elevated (leucocytosis), usually signalling active infection, inflammation, stress, or rarely a blood disorder.`;
        return `WBC ${v}/µL is normal, indicating a healthy immune baseline.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat zinc-rich foods (pumpkin seeds, chickpeas), prioritise sleep, and review any medications with a doctor.";
        if (s === "high") return "If you have fever or infection signs, see a doctor promptly. Never self-prescribe antibiotics.";
        return "Adequate sleep, stress control and good nutrition keep immunity strong.";
      },
    },
    {
      key: "platelets",
      label: "Platelets",
      unit: "/µL",
      getRange: () => ({ normalMin: 150000, normalMax: 410000 }),
      getStatus: (v) => (v < 150000 ? "low" : v > 410000 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Platelet count ${v}/µL is low (thrombocytopaenia). Platelets clot blood — low counts raise bleeding and bruising risk.`;
        if (s === "high") return `Platelet count ${v}/µL is high (thrombocytosis), which can raise clotting risk and often links to iron deficiency or inflammation.`;
        return `Platelet count ${v}/µL is normal — healthy clotting capacity.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Avoid NSAIDs (ibuprofen). Seek urgent review if below 50,000. Eat folate-rich foods and papaya.";
        if (s === "high") return "Hydrate, stay active, and treat any underlying iron deficiency or inflammation. Persistent elevation needs a haematology review.";
        return "No action needed. Avoid smoking, which impairs platelet function.";
      },
    },
    {
      key: "hematocrit",
      label: "Hematocrit",
      unit: "%",
      getRange: (g) => (g === "male" ? { normalMin: 40, normalMax: 52 } : { normalMin: 36, normalMax: 48 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 40 : 36;
        const max = g === "male" ? 52 : 48;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Hematocrit ${v}% is low — the proportion of red cells is reduced, suggesting anaemia or overhydration.`;
        if (s === "high") return `Hematocrit ${v}% is high, indicating thicker blood from dehydration, altitude or polycythaemia. Above 54% raises clotting/stroke risk.`;
        return `Hematocrit ${v}% is healthy, indicating normal red-cell volume.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Address underlying anaemia with iron, B12 and folate, and adequate calories.";
        if (s === "high") return "Hydrate aggressively (3–4L/day) and stop smoking. If sustained >54%, therapeutic blood donation may be advised medically.";
        return "Continue your current healthy diet and lifestyle; annual testing is sufficient.";
      },
    },
  ],

  Lipid: [
    {
      key: "totalCholesterol",
      label: "Total Cholesterol",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 200, borderlineMax: 239 }),
      getStatus: (v) => (v < 200 ? "normal" : v <= 239 ? "borderline" : "high"),
      explain: (v, s) => {
        if (s === "normal") return `Total cholesterol ${v} mg/dL is desirable, lowering cardiovascular risk.`;
        if (s === "borderline") return `Total cholesterol ${v} mg/dL is borderline high (200–239), moderately raising heart-disease risk.`;
        return `Total cholesterol ${v} mg/dL is high (≥240), significantly raising heart-attack and stroke risk.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Keep a heart-healthy diet — olive/mustard oil, vegetables, nuts, fish — and train regularly.";
        if (s === "borderline") return "Cut saturated fat (ghee, butter, red meat, full-fat dairy). Add soluble fibre (oats, barley, flaxseed) and 30 min daily cardio.";
        return "See a cardiologist; statins may be needed. Eliminate trans fats and prioritise weekly aerobic work.";
      },
    },
    {
      key: "ldl",
      label: "LDL Cholesterol",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 100, borderlineMax: 159 }),
      getStatus: (v) => (v < 100 ? "normal" : v <= 159 ? "borderline" : "high"),
      explain: (v, s) => {
        if (s === "normal") return `LDL ("bad" cholesterol) ${v} mg/dL is optimal, sharply reducing plaque and cardiovascular risk.`;
        if (s === "borderline") return `LDL ${v} mg/dL is above optimal (100–159); arterial plaque can accumulate over time at this level.`;
        return `LDL ${v} mg/dL is high (≥160), substantially increasing coronary-artery-disease risk.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Keep avoiding trans fats and processed food; continue cardio.";
        if (s === "borderline") return "Add walnuts, flaxseed, avocado and fatty fish; take 10g psyllium (isabgol) daily; train 5 days/week.";
        return "Seek medical evaluation — statins may be prescribed. Avoid all fried/bakery foods and red meat.";
      },
    },
    {
      key: "hdl",
      label: "HDL Cholesterol",
      unit: "mg/dL",
      getRange: (g) => (g === "male" ? { low: 40, normalMin: 40, normalMax: 100 } : { low: 50, normalMin: 50, normalMax: 100 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 40 : 50;
        if (v < min) return "low";
        if (v >= 60) return "normal";
        return "borderline";
      },
      explain: (v, s, g) => {
        const min = g === "male" ? 40 : 50;
        if (s === "low") return `HDL ("good" cholesterol) ${v} mg/dL is below ${min} mg/dL — a major cardiac risk factor, as HDL clears cholesterol from arteries.`;
        if (s === "borderline") return `HDL ${v} mg/dL is acceptable but not optimal; ≥60 offers stronger heart protection.`;
        return `HDL ${v} mg/dL is excellent and protective against heart disease.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Aerobic exercise is the strongest lever — 30 min brisk cardio daily. Add olive oil, nuts and fatty fish; quit smoking.";
        if (s === "borderline") return "Raise activity and omega-3 intake (flaxseed, walnuts, mackerel); avoid trans fats.";
        return "Maintain your active lifestyle and heart-healthy diet.";
      },
    },
    {
      key: "triglycerides",
      label: "Triglycerides",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 150, borderlineMax: 199 }),
      getStatus: (v) => (v < 150 ? "normal" : v <= 199 ? "borderline" : "high"),
      explain: (v, s) => {
        if (s === "normal") return `Triglycerides ${v} mg/dL are normal — dietary fats are being handled efficiently.`;
        if (s === "borderline") return `Triglycerides ${v} mg/dL are borderline high (150–199), usually from excess carbs, sugar or alcohol.`;
        return `Triglycerides ${v} mg/dL are high (≥200), raising cardiovascular and pancreatitis risk.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Keep limiting sugary drinks, alcohol and refined carbs.";
        if (s === "borderline") return "Cut sugar, white rice, juices and alcohol; add omega-3s and daily exercise.";
        return "Strict low-carb, low-sugar diet and no alcohol. Very high levels may need medication — consult a doctor.";
      },
    },
  ],

  Liver: [
    {
      key: "alt",
      label: "ALT (SGPT)",
      unit: "U/L",
      getRange: (g) => (g === "male" ? { normalMin: 7, normalMax: 55 } : { normalMin: 7, normalMax: 45 }),
      getStatus: (v, g) => {
        const max = g === "male" ? 55 : 45;
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "high") return `ALT ${v} U/L is elevated. ALT is a liver enzyme — a rise flags liver stress from fatty liver, alcohol, viral hepatitis, medications, or (in enhanced athletes) oral anabolic use.`;
        return `ALT ${v} U/L is within range, indicating healthy liver-cell integrity.`;
      },
      recommend: (_, s) => {
        if (s === "high") return "Stop alcohol, review hepatotoxic supplements/medications, and address fatty liver with weight loss and reduced sugar. Recheck in 4–6 weeks; persistent elevation needs a hepatology review.";
        return "Maintain low alcohol intake and a healthy weight to protect the liver.";
      },
    },
    {
      key: "ast",
      label: "AST (SGOT)",
      unit: "U/L",
      getRange: () => ({ normalMin: 8, normalMax: 48 }),
      getStatus: (v) => (v > 48 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "high") return `AST ${v} U/L is elevated. AST rises with liver stress but also after intense exercise or muscle damage, so interpret alongside ALT.`;
        return `AST ${v} U/L is normal. Note that hard training can transiently raise AST — test rested.`;
      },
      recommend: (_, s) => {
        if (s === "high") return "Avoid heavy lifting for 48–72h before retesting to exclude a muscle-related rise. If AST and ALT are both high, evaluate liver health and alcohol use.";
        return "No action needed. Test after a rest day for the most accurate reading.";
      },
    },
    {
      key: "alp",
      label: "ALP",
      unit: "U/L",
      getRange: () => ({ normalMin: 40, normalMax: 129 }),
      getStatus: (v) => (v < 40 ? "low" : v > 129 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "high") return `ALP ${v} U/L is elevated, which can reflect bile-duct issues, bone turnover, or vitamin D deficiency.`;
        if (s === "low") return `ALP ${v} U/L is low, occasionally seen with malnutrition, zinc deficiency or low thyroid.`;
        return `ALP ${v} U/L is within the normal range.`;
      },
      recommend: (_, s) => {
        if (s === "high") return "Check vitamin D and a liver/bone workup with your doctor to localise the source.";
        if (s === "low") return "Ensure adequate zinc and protein; review thyroid status.";
        return "No action required.";
      },
    },
    {
      key: "bilirubin",
      label: "Total Bilirubin",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0.1, normalMax: 1.2 }),
      getStatus: (v) => (v > 1.2 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "high") return `Total bilirubin ${v} mg/dL is elevated, which can cause jaundice. Mild rises are often benign (Gilbert's syndrome); higher values need liver evaluation.`;
        return `Total bilirubin ${v} mg/dL is normal — the liver is clearing this pigment well.`;
      },
      recommend: (_, s) => {
        if (s === "high") return "Stay hydrated, avoid alcohol, and if jaundiced (yellow eyes/skin) see a doctor promptly.";
        return "No action needed.";
      },
    },
    {
      key: "albumin",
      label: "Albumin",
      unit: "g/dL",
      getRange: () => ({ normalMin: 3.5, normalMax: 5.2 }),
      getStatus: (v) => (v < 3.5 ? "low" : v > 5.2 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Albumin ${v} g/dL is low, which can reflect poor protein intake, inflammation, or liver/kidney issues.`;
        if (s === "high") return `Albumin ${v} g/dL is high, most often simply dehydration.`;
        return `Albumin ${v} g/dL is normal — good protein status and liver synthesis.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase quality protein (eggs, dal, paneer, whey) and investigate any inflammation or organ dysfunction.";
        if (s === "high") return "Rehydrate and retest.";
        return "Maintain adequate protein intake.";
      },
    },
  ],

  Kidney: [
    {
      key: "creatinine",
      label: "Creatinine",
      unit: "mg/dL",
      getRange: (g) => (g === "male" ? { normalMin: 0.7, normalMax: 1.3 } : { normalMin: 0.5, normalMax: 1.1 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 0.7 : 0.5;
        const max = g === "male" ? 1.3 : 1.1;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Creatinine ${v} mg/dL is low, often from low muscle mass or pregnancy — rarely a concern.`;
        if (s === "high") return `Creatinine ${v} mg/dL is elevated, suggesting reduced kidney filtration. Note: high muscle mass and creatine supplements can modestly raise it.`;
        return `Creatinine ${v} mg/dL is normal — kidneys are filtering waste effectively.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Build muscle with resistance training and adequate protein.";
        if (s === "high") return "Hydrate well, avoid NSAIDs, and pause creatine for 1–2 weeks before retesting. Persistent elevation needs a nephrology review and eGFR.";
        return "Stay hydrated (2–3L/day) and avoid chronic NSAID use.";
      },
    },
    {
      key: "egfr",
      label: "eGFR",
      unit: "mL/min/1.73m²",
      getRange: () => ({ low: 60, normalMin: 90, normalMax: 120 }),
      getStatus: (v) => {
        if (v >= 90) return "normal";
        if (v >= 60) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `eGFR ${v} indicates normal kidney filtration (Stage 1). Kidneys are working well.`;
        if (s === "borderline") return `eGFR ${v} (60–89) is mildly reduced. Alone this can be age-related, but pair it with creatinine and urine protein.`;
        return `eGFR ${v} is below 60, indicating meaningfully reduced kidney function — this needs medical evaluation.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Maintain hydration and blood-pressure control.";
        if (s === "borderline") return "Control BP and blood sugar, hydrate, and limit NSAIDs. Retest in 3 months.";
        return "Consult a nephrologist. Manage blood pressure, diabetes and avoid nephrotoxic drugs.";
      },
    },
    {
      key: "bloodUrea",
      label: "Blood Urea",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 7, normalMax: 25 }),
      getStatus: (v) => (v < 7 ? "low" : v > 25 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Blood urea ${v} mg/dL is low, seen with very low protein intake, liver disease or overhydration.`;
        if (s === "high") return `Blood urea ${v} mg/dL is elevated, often from dehydration, high protein intake or reduced kidney function.`;
        return `Blood urea ${v} mg/dL is normal — balanced protein metabolism and excretion.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase dietary protein (dal, eggs, paneer, legumes).";
        if (s === "high") return "Hydrate and moderate very high protein intake. If kidney disease is suspected, get a nephrology review.";
        return "Keep protein at 0.8–2g/kg with good hydration.";
      },
    },
    {
      key: "uricAcid",
      label: "Uric Acid",
      unit: "mg/dL",
      getRange: (g) => (g === "male" ? { normalMin: 3.5, normalMax: 7.2 } : { normalMin: 2.6, normalMax: 6.0 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 3.5 : 2.6;
        const max = g === "male" ? 7.2 : 6.0;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Uric acid ${v} mg/dL is low (uncommon), sometimes linked to liver issues or medications.`;
        if (s === "high") return `Uric acid ${v} mg/dL is high (hyperuricaemia). Excess can crystallise in joints causing gout and may harm the kidneys.`;
        return `Uric acid ${v} mg/dL is normal — healthy purine metabolism.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Usually benign; review medications with your doctor.";
        if (s === "high") return "Cut red/organ meats, shellfish, beer and high-fructose foods. Hydrate 3L+/day. Recurrent gout may need medication.";
        return "Keep protein moderate, hydrate, and limit alcohol and sugary drinks.";
      },
    },
  ],

  Thyroid: [
    {
      key: "tsh",
      label: "TSH",
      unit: "µIU/mL",
      getRange: () => ({ normalMin: 0.4, normalMax: 4.0 }),
      getStatus: (v) => (v < 0.4 ? "low" : v > 4.0 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `TSH ${v} µIU/mL is low, suggesting hyperthyroidism (overactive thyroid) — weight loss, palpitations, anxiety and heat intolerance.`;
        if (s === "high") return `TSH ${v} µIU/mL is elevated, suggesting hypothyroidism (underactive thyroid) — fatigue, weight gain, cold intolerance and low mood.`;
        return `TSH ${v} µIU/mL is normal — the thyroid is well regulated.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "See an endocrinologist. Avoid unprescribed iodine; symptom control and further thyroid testing may be needed.";
        if (s === "high") return "See an endocrinologist — levothyroxine is commonly prescribed. Add selenium (Brazil nuts) and use iodised salt; don't over-restrict.";
        return "Use iodised salt. Women over 30 benefit from an annual thyroid check.";
      },
    },
    {
      key: "ft3",
      label: "Free T3",
      unit: "pg/mL",
      getRange: () => ({ normalMin: 2.3, normalMax: 4.2 }),
      getStatus: (v) => (v < 2.3 ? "low" : v > 4.2 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Free T3 ${v} pg/mL is low. T3 is the active thyroid hormone driving metabolism — low levels slow metabolism and energy.`;
        if (s === "high") return `Free T3 ${v} pg/mL is high, consistent with hyperthyroidism — rapid heart rate, weight loss and anxiety.`;
        return `Free T3 ${v} pg/mL is normal — balanced active thyroid hormone.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Ensure adequate selenium, zinc and iodine; avoid extreme calorie restriction, which suppresses T3. Endocrinology review if symptomatic.";
        if (s === "high") return "Get an endocrinology evaluation for the underlying cause.";
        return "Maintain an iodine-adequate diet.";
      },
    },
    {
      key: "ft4",
      label: "Free T4",
      unit: "ng/dL",
      getRange: () => ({ normalMin: 0.8, normalMax: 1.8 }),
      getStatus: (v) => (v < 0.8 ? "low" : v > 1.8 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Free T4 ${v} ng/dL is low, indicating hypothyroidism. T4 is the precursor converted to active T3.`;
        if (s === "high") return `Free T4 ${v} ng/dL is elevated, consistent with hyperthyroidism or over-replacement.`;
        return `Free T4 ${v} ng/dL is normal — appropriate thyroid hormone output.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Endocrinology review; levothyroxine is typical. Ensure iodine/selenium and take medication away from soy and calcium.";
        if (s === "high") return "See a doctor promptly — excess thyroid hormone strains the heart and bones.";
        return "Healthy thyroid function; annual panels are sufficient.";
      },
    },
  ],

  Hormones: [
    {
      key: "totalTestosterone",
      label: "Total Testosterone",
      unit: "ng/dL",
      getRange: (g) => (g === "male" ? { normalMin: 300, normalMax: 1000 } : { normalMin: 15, normalMax: 70 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 300 : 15;
        const max = g === "male" ? 1000 : 70;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s, g) => {
        if (g === "female") {
          if (s === "high") return `Total testosterone ${v} ng/dL is high for a female, which can relate to PCOS or adrenal causes and may cause acne or hirsutism.`;
          return `Total testosterone ${v} ng/dL is within the female range.`;
        }
        if (s === "low") return `Total testosterone ${v} ng/dL is low. Low T reduces muscle, libido, energy and mood, and slows recovery.`;
        if (s === "high") return `Total testosterone ${v} ng/dL is above the natural range, typically from exogenous testosterone/anabolic use.`;
        return `Total testosterone ${v} ng/dL is within the healthy male range.`;
      },
      recommend: (_, s, g) => {
        if (g === "female" && s === "high") return "Evaluate for PCOS/adrenal causes with an endocrinologist.";
        if (s === "low") return "Optimise sleep (7–9h), resistance train, keep body fat healthy, and correct vitamin D and zinc. Persistent low T with symptoms warrants an endocrinology/andrology review before considering TRT.";
        if (s === "high") return "If not on prescribed therapy, investigate the source. If enhanced, monitor haematocrit, lipids, E2 and liver markers closely and work with a knowledgeable physician.";
        return "Maintain sleep, training and healthy body fat to protect natural production.";
      },
    },
    {
      key: "freeTestosterone",
      label: "Free Testosterone",
      unit: "pg/mL",
      getRange: (g) => (g === "male" ? { normalMin: 46, normalMax: 224 } : { normalMin: 0.5, normalMax: 5 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 46 : 0.5;
        const max = g === "male" ? 224 : 5;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Free testosterone ${v} pg/mL is low. Free T is the bioavailable fraction — symptoms track this more closely than total T.`;
        if (s === "high") return `Free testosterone ${v} pg/mL is high, often reflecting low SHBG or exogenous androgen use.`;
        return `Free testosterone ${v} pg/mL is within range — good bioavailable androgen levels.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Check SHBG (high SHBG lowers free T). Improve sleep, insulin sensitivity and vitamin D; review with a doctor if symptomatic.";
        if (s === "high") return "Interpret with SHBG and total T; if enhanced, monitor related markers.";
        return "Maintain healthy lifestyle factors.";
      },
    },
    {
      key: "estradiol",
      label: "Estradiol (E2)",
      unit: "pg/mL",
      getRange: (g) => (g === "male" ? { normalMin: 10, normalMax: 40 } : { normalMin: 30, normalMax: 400 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 10 : 30;
        const max = g === "male" ? 40 : 400;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s, g) => {
        if (g === "female") return `Estradiol ${v} pg/mL — female E2 varies widely across the menstrual cycle, so interpret against your cycle phase with a doctor.`;
        if (s === "low") return `Estradiol ${v} pg/mL is low for a male. Men need some estrogen for bone density, joints, libido and mood — over-suppression (e.g. excess aromatase inhibitor) causes joint pain and low libido.`;
        if (s === "high") return `Estradiol ${v} pg/mL is high for a male, often rising with high testosterone/aromatisation, and can cause water retention, moodiness or gynecomastia.`;
        return `Estradiol ${v} pg/mL is within a healthy male range — good balance for bone, joint and libido health.`;
      },
      recommend: (_, s, g) => {
        if (g === "female") return "Interpret against cycle phase with your gynaecologist.";
        if (s === "low") return "If using an aromatase inhibitor, you are likely over-suppressed — do not crush E2. Reassess dosing with a physician; low E2 harms bones and joints.";
        if (s === "high") return "Manage the driver (body fat, testosterone dose). Any aromatase-inhibitor use must be physician-guided — never self-dose.";
        return "No action needed; keep body fat healthy to control aromatisation.";
      },
    },
    {
      key: "prolactin",
      label: "Prolactin",
      unit: "ng/mL",
      getRange: (g) => (g === "male" ? { normalMin: 2, normalMax: 18 } : { normalMin: 2, normalMax: 29 }),
      getStatus: (v, g) => {
        const max = g === "male" ? 18 : 29;
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "high") return `Prolactin ${v} ng/mL is elevated. High prolactin suppresses testosterone and libido and can cause erectile issues; markedly high levels may indicate a pituitary adenoma. Some compounds (e.g. 19-nor anabolics) raise it.`;
        return `Prolactin ${v} ng/mL is within range.`;
      },
      recommend: (_, s) => {
        if (s === "high") return "Recheck fasted and rested (stress/exercise/nipple stimulation raise it). Persistent elevation needs an endocrinology review and possibly a pituitary MRI; do not self-medicate dopamine agonists.";
        return "No action needed.";
      },
    },
    {
      key: "cortisol",
      label: "Cortisol (AM)",
      unit: "µg/dL",
      getRange: () => ({ normalMin: 6, normalMax: 23 }),
      getStatus: (v) => (v < 6 ? "low" : v > 23 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Morning cortisol ${v} µg/dL is low, which can cause fatigue and low blood pressure; adrenal insufficiency should be excluded.`;
        if (s === "high") return `Morning cortisol ${v} µg/dL is high, often from chronic stress, poor sleep or overtraining, and can impair recovery, sleep and body composition.`;
        return `Morning cortisol ${v} µg/dL is within a healthy range.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "See a doctor to rule out adrenal insufficiency, especially if very fatigued.";
        if (s === "high") return "Prioritise sleep, deload from overtraining, and manage stress (breathwork, meditation). Persistent elevation needs endocrine review.";
        return "Maintain good sleep and stress management.";
      },
    },
    {
      key: "shbg",
      label: "SHBG",
      unit: "nmol/L",
      getRange: () => ({ normalMin: 18, normalMax: 54 }),
      getStatus: (v) => (v < 18 ? "low" : v > 54 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `SHBG ${v} nmol/L is low — often linked to insulin resistance, obesity or high androgen load. Low SHBG raises free testosterone but flags metabolic issues.`;
        if (s === "high") return `SHBG ${v} nmol/L is high, which binds testosterone and lowers the free (usable) fraction, sometimes seen with hyperthyroidism or aging.`;
        return `SHBG ${v} nmol/L is normal, giving a healthy balance of bound vs free testosterone.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Improve insulin sensitivity — lose visceral fat, train, and cut refined carbs.";
        if (s === "high") return "Interpret free testosterone alongside; review thyroid status if elevated.";
        return "No action needed.";
      },
    },
  ],

  Metabolic: [
    {
      key: "fastingGlucose",
      label: "Fasting Glucose",
      unit: "mg/dL",
      getRange: () => ({ low: 70, normalMin: 70, normalMax: 100, borderlineMax: 125 }),
      getStatus: (v) => {
        if (v < 70) return "low";
        if (v <= 100) return "normal";
        if (v <= 125) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "low") return `Fasting glucose ${v} mg/dL is low (hypoglycaemia), which can cause dizziness, shakiness and confusion.`;
        if (s === "normal") return `Fasting glucose ${v} mg/dL is normal — blood sugar is well controlled.`;
        if (s === "borderline") return `Fasting glucose ${v} mg/dL is pre-diabetic (100–125), signalling elevated type-2 diabetes risk.`;
        return `Fasting glucose ${v} mg/dL is in the diabetic range (≥126) — impaired glucose regulation.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat regular balanced meals with complex carbs; avoid skipping meals. Frequent episodes need medical review.";
        if (s === "normal") return "Maintain habits, limit refined sugar, and stay active.";
        if (s === "borderline") return "Adopt a low-GI diet (millets, oats, legumes), walk 30–45 min daily, and cut sugar, white rice and maida. Confirm with HbA1c.";
        return "Consult a diabetologist. Strict diet, monitoring and possibly medication are needed.";
      },
    },
    {
      key: "hba1c",
      label: "HbA1c",
      unit: "%",
      getRange: () => ({ normalMin: 4, normalMax: 5.6, borderlineMax: 6.4 }),
      getStatus: (v) => (v < 5.7 ? "normal" : v <= 6.4 ? "borderline" : "high"),
      explain: (v, s) => {
        if (s === "normal") return `HbA1c ${v}% is below 5.7%, indicating excellent 3-month average blood-sugar control.`;
        if (s === "borderline") return `HbA1c ${v}% (5.7–6.4%) indicates pre-diabetes — average blood sugar has been elevated over ~3 months.`;
        return `HbA1c ${v}% is diabetic (≥6.5%), reflecting chronically high blood sugar.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Continue balanced eating and regular exercise; recheck annually.";
        if (s === "borderline") return "Lifestyle change is critical now — low-carb diet, 150 min/week exercise, and 5–7% weight loss if overweight. Recheck in 3 months.";
        return "See a diabetologist promptly; medication and strict control are essential.";
      },
    },
    {
      key: "fastingInsulin",
      label: "Fasting Insulin",
      unit: "µIU/mL",
      getRange: () => ({ normalMin: 2, normalMax: 8, borderlineMax: 12 }),
      getStatus: (v) => {
        if (v < 2) return "low";
        if (v <= 8) return "normal";
        if (v <= 12) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "low") return `Fasting insulin ${v} µIU/mL is low, which is usually fine unless blood sugar is high.`;
        if (s === "normal") return `Fasting insulin ${v} µIU/mL is optimal, indicating good insulin sensitivity.`;
        if (s === "borderline") return `Fasting insulin ${v} µIU/mL is mildly elevated, an early sign of insulin resistance often before glucose rises.`;
        return `Fasting insulin ${v} µIU/mL is high, indicating insulin resistance — a key driver of fat gain, metabolic syndrome and future diabetes.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "No action if glucose is normal.";
        if (s === "normal") return "Excellent insulin sensitivity — maintain training and a whole-food diet.";
        if (s === "borderline") return "Reduce refined carbs and sugar, add resistance training and daily walking, and lose visceral fat.";
        return "Prioritise fat loss, low-GI eating, strength training and post-meal walks to restore insulin sensitivity. Consider a HOMA-IR review with your doctor.";
      },
    },
  ],

  Vitamins: [
    {
      key: "vitaminD",
      label: "Vitamin D (25-OH)",
      unit: "ng/mL",
      getRange: () => ({ low: 20, normalMin: 30, normalMax: 100 }),
      getStatus: (v) => {
        if (v < 20) return "low";
        if (v < 30) return "borderline";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Vitamin D ${v} ng/mL is deficient (<20). D is vital for bone health, immunity, muscle function, testosterone and mood. Deficiency is extremely common in India.`;
        if (s === "borderline") return `Vitamin D ${v} ng/mL is insufficient (20–30). Optimising it benefits bone density, immunity and strength.`;
        return `Vitamin D ${v} ng/mL is sufficient, supporting bones, immunity and muscle function.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Under medical guidance, 60,000 IU D3 weekly for 8 weeks, then 2,000 IU/day maintenance. Get 20–30 min midday sun and eat fatty fish, egg yolk and fortified milk.";
        if (s === "borderline") return "Take 2,000–4,000 IU D3 daily with morning sun exposure and dietary sources.";
        return "Maintain 1,000–2,000 IU/day and sun exposure; recheck annually.";
      },
    },
    {
      key: "vitaminB12",
      label: "Vitamin B12",
      unit: "pg/mL",
      getRange: () => ({ normalMin: 200, normalMax: 900 }),
      getStatus: (v) => (v < 200 ? "low" : v > 900 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Vitamin B12 ${v} pg/mL is deficient. B12 drives nerve health, red-cell formation and energy. Deficiency is very common in Indian vegetarians and vegans.`;
        if (s === "high") return `Vitamin B12 ${v} pg/mL is high — usually harmless from supplements, but very high levels without supplementation warrant review.`;
        return `Vitamin B12 ${v} pg/mL is normal, supporting nerves and blood-cell production.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Vegetarians/vegans should supplement 1,000–2,000 mcg/day (or monthly injections). Include dairy and eggs; fortified foods help.";
        if (s === "high") return "If supplementing, reduce the dose. Otherwise get a doctor to review liver/haematological causes.";
        return "Vegetarians benefit from a 500 mcg/day maintenance dose; recheck annually.";
      },
    },
    {
      key: "ferritin",
      label: "Ferritin",
      unit: "ng/mL",
      getRange: (g) => (g === "male" ? { normalMin: 30, normalMax: 300 } : { normalMin: 15, normalMax: 200 }),
      getStatus: (v, g) => {
        const min = g === "male" ? 30 : 15;
        const max = g === "male" ? 300 : 200;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Ferritin ${v} ng/mL is low — this is the storage form of iron, and low levels precede anaemia, causing fatigue, hair loss and poor training tolerance.`;
        if (s === "high") return `Ferritin ${v} ng/mL is high, which can reflect iron overload, inflammation, fatty liver or metabolic syndrome.`;
        return `Ferritin ${v} ng/mL is normal — adequate iron stores.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Prioritise iron-rich foods with vitamin C; supplement if a doctor advises. Fatigue and hair loss improve as stores rebuild — recheck in 3 months.";
        if (s === "high") return "Avoid iron supplements; identify the cause. Very high (>500) needs evaluation for haemochromatosis or liver disease.";
        return "Iron stores are healthy; recheck annually.";
      },
    },
    {
      key: "calcium",
      label: "Calcium",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 8.6, normalMax: 10.3 }),
      getStatus: (v) => (v < 8.6 ? "low" : v > 10.3 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Calcium ${v} mg/dL is low, which can cause cramps, tingling and weak bones; it's often tied to vitamin D deficiency.`;
        if (s === "high") return `Calcium ${v} mg/dL is high, which may relate to parathyroid issues, excess vitamin D or dehydration.`;
        return `Calcium ${v} mg/dL is normal, supporting bones, muscle contraction and nerves.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Correct vitamin D, and eat dairy, ragi, sesame and leafy greens. Persistent low calcium needs a parathyroid/PTH check.";
        if (s === "high") return "Hydrate and see a doctor for a PTH and vitamin D review; stop excess calcium/D supplements.";
        return "Maintain calcium-rich foods and adequate vitamin D.";
      },
    },
    {
      key: "magnesium",
      label: "Magnesium",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 1.7, normalMax: 2.4 }),
      getStatus: (v) => (v < 1.7 ? "low" : v > 2.4 ? "high" : "normal"),
      explain: (v, s) => {
        if (s === "low") return `Magnesium ${v} mg/dL is low, which can cause cramps, poor sleep, palpitations and reduced insulin sensitivity. Deficiency is widespread.`;
        if (s === "high") return `Magnesium ${v} mg/dL is high, uncommon and usually from supplements or reduced kidney clearance.`;
        return `Magnesium ${v} mg/dL is normal, supporting muscle, nerve and energy metabolism.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat pumpkin seeds, almonds, spinach and dark chocolate; consider magnesium glycinate 200–400 mg at night for sleep and cramps.";
        if (s === "high") return "Review supplements and kidney function with a doctor.";
        return "Maintain magnesium-rich foods.";
      },
    },
  ],
};

const TABS: TabKey[] = ["CBC", "Lipid", "Liver", "Kidney", "Thyroid", "Hormones", "Metabolic", "Vitamins"];
const TAB_LABELS: Record<TabKey, string> = {
  CBC: "CBC",
  Lipid: "Lipid Profile",
  Liver: "Liver Function",
  Kidney: "Kidney (KFT)",
  Thyroid: "Thyroid",
  Hormones: "Hormones",
  Metabolic: "Metabolic",
  Vitamins: "Vitamins & Minerals",
};
const TAB_ICON: Record<TabKey, string> = {
  CBC: "🩸",
  Lipid: "🫀",
  Liver: "🧬",
  Kidney: "🫁",
  Thyroid: "🦋",
  Hormones: "⚗️",
  Metabolic: "🍬",
  Vitamins: "💊",
};

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string }> = {
  normal: { label: "Optimal", color: "#34d399", bg: "rgba(52,211,153,0.14)" },
  borderline: { label: "Borderline", color: "#d8b35a", bg: "rgba(216,179,90,0.14)" },
  low: { label: "Low", color: "#fb7185", bg: "rgba(251,113,133,0.14)" },
  high: { label: "High", color: "#fb7185", bg: "rgba(251,113,133,0.14)" },
  unknown: { label: "—", color: "#8b8598", bg: "rgba(139,133,152,0.14)" },
};

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

function getAllMarkerKeys(): string[] {
  return TABS.flatMap((tab) => MARKERS[tab].map((m) => m.key));
}

function scaleForRange(range: MarkerRange): { min: number; max: number } {
  const hardMax = range.high ?? range.borderlineMax ?? range.normalMax;
  const max = hardMax * 1.35;
  const min = range.normalMin > 0 ? Math.max(0, range.normalMin - (range.normalMax - range.normalMin) * 0.8) : 0;
  return { min, max };
}

function pct(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return Math.max(2, Math.min(98, ((value - min) / (max - min)) * 100));
}

const CHIP: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
};

/* ================================================================== */
/* Range bar                                                          */
/* ================================================================== */

function RangeBar({ range, value, color }: { range: MarkerRange; value: number; color: string }) {
  const { min, max } = scaleForRange(range);
  const normalStart = pct(Math.max(range.normalMin, min), min, max);
  const normalEnd = pct(Math.min(range.normalMax, max), min, max);
  const valuePos = pct(value, min, max);
  return (
    <div style={{ margin: "12px 0 4px" }}>
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(251,113,133,0.35), rgba(216,179,90,0.30), rgba(52,211,153,0.30), rgba(216,179,90,0.30), rgba(251,113,133,0.35))",
        }}
      >
        {/* optimal band */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${normalStart}%`,
            width: `${Math.max(2, normalEnd - normalStart)}%`,
            background: "rgba(52,211,153,0.55)",
            borderRadius: 999,
          }}
        />
        {/* value marker */}
        <motion.div
          initial={{ left: "50%", opacity: 0 }}
          animate={{ left: `${valuePos}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: color,
            border: "2px solid #0b0714",
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "rgba(247,240,223,0.5)" }}>{min % 1 === 0 ? min : min.toFixed(1)}</span>
        <span style={{ fontSize: 10, color: "rgba(52,211,153,0.85)", fontWeight: 700 }}>
          Optimal {range.normalMin}–{range.normalMax}
        </span>
        <span style={{ fontSize: 10, color: "rgba(247,240,223,0.5)" }}>{max % 1 === 0 ? Math.round(max) : max.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Score ring                                                         */
/* ================================================================== */

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#d8b35a" : "#fb7185";
  const rating = score >= 80 ? "Strong" : score >= 60 ? "Fair" : "Needs Attention";
  return (
    <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
      <motion.div
        initial={{ ["--ring" as string]: "0deg" }}
        animate={{ ["--ring" as string]: `${(score / 100) * 360}deg` }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(${color} var(--ring), rgba(255,255,255,0.08) var(--ring))`,
          filter: `drop-shadow(0 0 8px ${color}80)`,
        }}
      />
      <div style={{ position: "absolute", inset: 11, borderRadius: "50%", background: "#0b0714" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", color }}>{score}</span>
        <span style={{ fontSize: 11, color: "rgba(247,240,223,0.62)", fontWeight: 600 }}>/ 100</span>
        <span style={{ ...CHIP, color, marginTop: 4, fontSize: 9 }}>{rating}</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Static data — cost guide & cycle bloodwork                         */
/* ================================================================== */

const COST_GUIDE: Array<{ panel: string; price: string; freq: string }> = [
  { panel: "CBC (Complete Blood Count)", price: "₹250–400", freq: "Every 6–12 months" },
  { panel: "Lipid Profile", price: "₹350–600", freq: "Yearly (6-monthly if flagged)" },
  { panel: "Thyroid (TSH/T3/T4)", price: "₹400–700", freq: "Yearly" },
  { panel: "Liver Function (LFT)", price: "₹400–700", freq: "Yearly" },
  { panel: "Kidney Function (KFT)", price: "₹400–700", freq: "Yearly" },
  { panel: "HbA1c + Fasting Glucose", price: "₹400–700", freq: "Yearly (3-monthly if high)" },
  { panel: "Total Testosterone", price: "₹500–900", freq: "As advised / on-cycle" },
  { panel: "Full Hormone Panel (T/E2/Prolactin/SHBG)", price: "₹2,500–4,500", freq: "As advised / on-cycle" },
  { panel: "Vitamin D (25-OH)", price: "₹1,000–1,500", freq: "Yearly" },
  { panel: "Vitamin B12", price: "₹600–1,000", freq: "Yearly" },
  { panel: "Full-Body Health Checkup", price: "₹1,500–3,000", freq: "Yearly" },
];

const CYCLE_MARKERS: Array<{ marker: string; why: string }> = [
  { marker: "ALT / AST (Liver)", why: "Oral 17-aa anabolics are hepatotoxic. Watch for enzyme rises; test rested since heavy lifting alone elevates AST." },
  { marker: "Hematocrit / Hemoglobin", why: "Androgens boost red-cell production. Hematocrit >54% thickens blood and raises clot/stroke risk — a leading reason to donate blood or adjust dose." },
  { marker: "HDL / LDL / Lipids", why: "Anabolics, especially orals, crush HDL and raise LDL, accelerating cardiovascular risk. Track every cycle." },
  { marker: "Estradiol (E2)", why: "Aromatisation of testosterone raises E2 (water retention, gyno, moods). Over-suppression from aromatase inhibitors causes joint pain, low libido and bone loss — both extremes are harmful." },
  { marker: "Prolactin", why: "19-nor compounds (nandrolone, trenbolone) can raise prolactin, causing libido/erectile issues. Monitor if using them." },
  { marker: "Blood Pressure & eGFR/Creatinine", why: "Fluid retention and raised BP strain the kidneys and heart. Track BP at home and kidney markers on longer cycles." },
];

const CYCLE_TIMING: Array<{ phase: string; when: string; detail: string }> = [
  { phase: "Baseline", when: "2–4 weeks before starting", detail: "Full panel — CBC, lipids, LFT, KFT, hormones, E2, prolactin — to know your natural reference point." },
  { phase: "Mid-cycle", when: "Week 4–6 on-cycle", detail: "Hematocrit, lipids, liver, E2 and BP — the fastest-moving risk markers. Adjust before problems compound." },
  { phase: "Post-cycle", when: "3–6 weeks after finishing", detail: "Re-check hormones (test/LH/FSH) to confirm HPTA recovery, plus lipids and liver to confirm they've normalised." },
];

/* ================================================================== */
/* Main component                                                     */
/* ================================================================== */

export default function BloodReportPage() {
  const { user } = useAuth();
  const isElite = user?.plan === "Elite";

  const [activeTab, setActiveTab] = useState<TabKey>("CBC");
  const [gender, setGender] = useState<Gender>((user?.gender === "female" ? "female" : "male"));
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(getAllMarkerKeys().map((k) => [k, ""]))
  );
  const [enhancedMode, setEnhancedMode] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [reportUrl, setReportUrl] = useState<string>("");
  const [analyzed, setAnalyzed] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");

  useEffect(() => {
    setAnalyzed(false);
  }, [gender]);

  const analysis = useMemo(() => {
    const results: Array<{
      key: string;
      label: string;
      unit: string;
      value: number;
      status: StatusType;
      explanation: string;
      recommendation: string;
      range: MarkerRange;
      tab: TabKey;
    }> = [];

    for (const tab of TABS) {
      for (const marker of MARKERS[tab]) {
        const raw = values[marker.key];
        if (!raw || raw.trim() === "") continue;
        const num = parseFloat(raw);
        if (isNaN(num)) continue;
        const status = marker.getStatus(num, gender);
        results.push({
          key: marker.key,
          label: marker.label,
          unit: marker.unit,
          value: num,
          status,
          explanation: marker.explain(num, status, gender),
          recommendation: marker.recommend(num, status, gender),
          range: marker.getRange(gender),
          tab,
        });
      }
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, gender, analyzed]);

  const summaryCount = {
    optimal: analysis.filter((r) => r.status === "normal").length,
    borderline: analysis.filter((r) => r.status === "borderline").length,
    flagged: analysis.filter((r) => r.status === "low" || r.status === "high").length,
  };

  const healthScore = useMemo(() => {
    if (analysis.length === 0) return 0;
    const total = analysis.reduce((sum, r) => {
      if (r.status === "normal") return sum + 100;
      if (r.status === "borderline") return sum + 62;
      return sum + 28;
    }, 0);
    return Math.round(total / analysis.length);
  }, [analysis]);

  const priorityList = useMemo(
    () =>
      [...analysis]
        .filter((r) => r.status !== "normal")
        .sort((a, b) => {
          const rank = (s: StatusType) => (s === "low" || s === "high" ? 0 : 1);
          return rank(a.status) - rank(b.status);
        }),
    [analysis]
  );

  const categoryBreakdown = useMemo(
    () =>
      TABS.map((tab) => {
        const items = analysis.filter((r) => r.tab === tab);
        if (items.length === 0) return null;
        const flagged = items.filter((r) => r.status !== "normal").length;
        return { tab, total: items.length, flagged };
      }).filter(Boolean) as Array<{ tab: TabKey; total: number; flagged: number }>,
    [analysis]
  );

  const cardiacRatios = useMemo(() => {
    const tc = parseFloat(values.totalCholesterol);
    const hdl = parseFloat(values.hdl);
    const tg = parseFloat(values.triglycerides);
    const out: Array<{ label: string; value: string; good: boolean; note: string }> = [];
    if (!isNaN(tc) && !isNaN(hdl) && hdl > 0) {
      const r = tc / hdl;
      out.push({ label: "Total : HDL", value: r.toFixed(1), good: r < 4, note: "Target < 4.0 (< 3.5 ideal)" });
    }
    if (!isNaN(tg) && !isNaN(hdl) && hdl > 0) {
      const r = tg / hdl;
      out.push({ label: "TG : HDL", value: r.toFixed(1), good: r < 2, note: "Target < 2.0 — insulin-sensitivity proxy" });
    }
    return out;
  }, [values]);

  const currentMarkers = MARKERS[activeTab];

  /* ------------------------------------------------------------------ */
  /* Upload handlers                                                     */
  /* ------------------------------------------------------------------ */

  const handleFileSelect = (selected: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setUploadError("Only PDF, JPG, PNG, or WEBP files are accepted.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError("File size must be under 10 MB.");
      return;
    }
    setUploadError("");
    setFile(selected);
    setReportUrl("");
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setUploadError("");
    setSaveError("");
    try {
      const path = `blood-reports/${user.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setUploadProgress(p);
          },
          (err) => reject(err),
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              setReportUrl(url);
              await addDoc(collection(db, "users", user.id, "bloodReports"), {
                url,
                fileName: file.name,
                fileType: file.type,
                uploadedAt: serverTimestamp(),
                storagePath: path,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(msg);
      setSaveError("Failed to save report record to database.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = () => {
    const anyFilled = getAllMarkerKeys().some((k) => values[k] && values[k].trim() !== "");
    if (!anyFilled) return;
    setAnalyzed(true);
    setTimeout(() => {
      document.getElementById("analysis-section")?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const filledInTab = currentMarkers.filter((m) => values[m.key] && values[m.key].trim() !== "").length;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const showCyclePanel = enhancedMode || isElite;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 50% -10%, rgba(167,139,250,0.10), transparent 60%), linear-gradient(135deg, #07040d 0%, #0b0714 50%, #07040d 100%)",
        color: "#f7f0df",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px 96px" }}>

        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <span style={{ ...CHIP, color: "#d8b35a" }}>Tiger Fitness Pro · Diagnostics</span>
          <h1
            style={{
              margin: "12px 0 10px",
              fontSize: "clamp(30px, 6vw, 50px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              background: "linear-gradient(100deg, #a78bfa, #e879f9 55%, #d8b35a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Blood Report Analysis
          </h1>
          <p style={{ color: "rgba(247,240,223,0.62)", fontSize: 15, margin: "0 auto", maxWidth: 560, lineHeight: 1.6 }}>
            Enter your lab values for a doctor-grade breakdown — accurate reference ranges, plain-language
            insights and personalised nutrition &amp; training actions.
          </p>
        </motion.div>

        {/* ============ CONTROLS: gender + enhanced ============ */}
        <div className="glass-card" style={{ borderRadius: 18, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 240px" }}>
              <p style={{ ...CHIP, color: "rgba(247,240,223,0.62)", margin: "0 0 10px" }}>
                Biological Sex · adjusts reference ranges
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {(["male", "female"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className="btn-gloss"
                    style={{
                      flex: 1,
                      padding: "11px 0",
                      borderRadius: 12,
                      border: gender === g ? "1.5px solid #a78bfa" : "1.5px solid rgba(255,255,255,0.1)",
                      background: gender === g
                        ? "linear-gradient(135deg, rgba(167,139,250,0.28), rgba(232,121,249,0.16))"
                        : "rgba(255,255,255,0.03)",
                      color: gender === g ? "#f7f0df" : "rgba(247,240,223,0.62)",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {g === "male" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: "1 1 240px" }}>
              <p style={{ ...CHIP, color: "rgba(247,240,223,0.62)", margin: "0 0 10px" }}>
                Enhanced Athlete Mode {isElite && "· Elite"}
              </p>
              <button
                onClick={() => setEnhancedMode((v) => !v)}
                className="btn-gloss"
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 12,
                  border: showCyclePanel ? "1.5px solid #e879f9" : "1.5px solid rgba(255,255,255,0.1)",
                  background: showCyclePanel
                    ? "linear-gradient(135deg, rgba(232,121,249,0.24), rgba(167,139,250,0.16))"
                    : "rgba(255,255,255,0.03)",
                  color: showCyclePanel ? "#f7f0df" : "rgba(247,240,223,0.62)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{showCyclePanel ? "Cycle bloodwork shown" : "Show cycle bloodwork guide"}</span>
                <span>{showCyclePanel ? "✓" : "＋"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============ FILE UPLOAD ============ */}
        <div className="glass-card" style={{ borderRadius: 18, padding: "20px 22px", marginBottom: 20 }}>
          <p style={{ ...CHIP, color: "rgba(247,240,223,0.62)", margin: "0 0 12px" }}>
            Store Report · PDF / Image · max 10 MB
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById("file-input")?.click()}
            style={{
              border: dragOver ? "2px dashed #a78bfa" : "2px dashed rgba(167,139,250,0.3)",
              borderRadius: 14,
              padding: "26px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(167,139,250,0.06)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>📄</div>
            <p style={{ margin: 0, color: "rgba(247,240,223,0.62)", fontSize: 14 }}>
              {file ? file.name : "Drag & drop your report here, or click to browse"}
            </p>
            {file && (
              <p style={{ margin: "4px 0 0", color: "rgba(167,139,250,0.85)", fontSize: 12 }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          {uploadError && <p style={{ color: "#fb7185", fontSize: 13, margin: "0 0 10px" }}>{uploadError}</p>}
          {file && !reportUrl && (
            <button
              onClick={handleUpload}
              disabled={uploading || !user}
              className="btn-gloss"
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: uploading ? "rgba(167,139,250,0.3)" : "linear-gradient(90deg, #7c3aed, #db2777)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: uploading || !user ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              {uploading ? `Uploading… ${uploadProgress}%` : "Upload & Save to Cloud"}
            </button>
          )}
          {uploading && (
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", height: 8 }}>
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: "linear-gradient(90deg, #7c3aed, #e879f9)", borderRadius: 8, transition: "width 0.3s" }} />
            </div>
          )}
          {reportUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              <span style={{ color: "#34d399", fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>Report uploaded successfully</span>
              <a href={reportUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "#a78bfa", fontSize: 12, textDecoration: "none", fontWeight: 700 }}>
                View ↗
              </a>
            </div>
          )}
          {saveError && <p style={{ color: "#fb7185", fontSize: 12, margin: "8px 0 0" }}>{saveError}</p>}
          {!user && (
            <p style={{ color: "rgba(247,240,223,0.62)", fontSize: 12, margin: "8px 0 0" }}>
              Sign in to save your report to the cloud. You can still analyse values below without an account.
            </p>
          )}
        </div>

        {/* ============ TAB NAV ============ */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {TABS.map((tab) => {
            const count = MARKERS[tab].filter((m) => values[m.key] && values[m.key].trim() !== "").length;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "9px 15px",
                  borderRadius: 999,
                  border: active ? "1.5px solid rgba(167,139,250,0.85)" : "1.5px solid rgba(255,255,255,0.08)",
                  background: active ? "linear-gradient(135deg, rgba(124,58,237,0.42), rgba(219,39,119,0.26))" : "rgba(255,255,255,0.03)",
                  color: active ? "#f7f0df" : "rgba(247,240,223,0.62)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{TAB_ICON[tab]}</span>
                {TAB_LABELS[tab]}
                {count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 999, padding: "1px 6px" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============ INPUT FORM ============ */}
        <div className="glass-card" style={{ borderRadius: 18, padding: 24, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>{TAB_ICON[activeTab]}</span>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em", color: "#f7f0df" }}>
              {TAB_LABELS[activeTab]}
            </h2>
            {filledInTab > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(52,211,153,0.85)", fontWeight: 700 }}>
                {filledInTab} entered
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {currentMarkers.map((marker) => {
              const r = marker.getRange(gender);
              return (
                <div key={marker.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(247,240,223,0.72)", marginBottom: 6 }}>
                    {marker.label}
                    <span style={{ color: "rgba(167,139,250,0.75)", marginLeft: 4, fontWeight: 500 }}>({marker.unit})</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={values[marker.key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [marker.key]: e.target.value }))}
                    placeholder={`e.g. ${r.normalMin || r.normalMax}`}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: 11,
                      border: "1.5px solid rgba(167,139,250,0.2)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#f7f0df",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.7)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.2)")}
                  />
                  <span style={{ fontSize: 10, color: "rgba(247,240,223,0.45)", display: "block", marginTop: 4 }}>
                    Ref: {r.normalMin}–{r.normalMax}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ ANALYZE BUTTON ============ */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <button
            onClick={handleAnalyze}
            className="btn-gloss"
            style={{
              padding: "15px 52px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c3aed, #a78bfa, #e879f9)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 6px 34px rgba(167,139,250,0.4)",
              letterSpacing: "0.02em",
            }}
          >
            🔬 Analyse My Report
          </button>
          <p style={{ color: "rgba(247,240,223,0.62)", fontSize: 12, marginTop: 10 }}>
            Fill any values across the panels above — you don't need them all.
          </p>
        </div>

        {/* ============ ANALYSIS ============ */}
        <AnimatePresence>
          {analyzed && analysis.length > 0 && (
            <motion.div
              id="analysis-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* DASHBOARD */}
              <div className="glass-card border-gold-glow" style={{ borderRadius: 20, padding: 26, marginBottom: 26 }}>
                <span style={{ ...CHIP, color: "#d8b35a" }}>Your Health Snapshot</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "center", marginTop: 16 }}>
                  <ScoreRing score={healthScore} />
                  <div style={{ flex: "1 1 260px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { n: summaryCount.optimal, l: "Optimal", c: "#34d399" },
                      { n: summaryCount.borderline, l: "Borderline", c: "#d8b35a" },
                      { n: summaryCount.flagged, l: "Flagged", c: "#fb7185" },
                    ].map((s) => (
                      <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.c}33`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: s.c, letterSpacing: "-0.04em" }}>{s.n}</div>
                        <div style={{ ...CHIP, color: "rgba(247,240,223,0.62)", fontSize: 10 }}>{s.l}</div>
                      </div>
                    ))}
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "rgba(247,240,223,0.62)", lineHeight: 1.6 }}>
                      Score weights each marker: optimal 100, borderline 62, out-of-range 28, then averages across the{" "}
                      <strong style={{ color: "#f7f0df" }}>{analysis.length}</strong> markers you entered.
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div style={{ marginTop: 22 }}>
                  <span style={{ ...CHIP, color: "rgba(247,240,223,0.62)" }}>Category Breakdown</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {categoryBreakdown.map((c) => (
                      <div
                        key={c.tab}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 13px",
                          borderRadius: 999,
                          background: c.flagged === 0 ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)",
                          border: c.flagged === 0 ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(251,113,133,0.3)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#f7f0df",
                        }}
                      >
                        <span>{TAB_ICON[c.tab]}</span>
                        {TAB_LABELS[c.tab]}
                        <span style={{ color: c.flagged === 0 ? "#34d399" : "#fb7185", fontWeight: 800 }}>
                          {c.flagged === 0 ? "all clear" : `${c.flagged} to watch`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cardiac ratios */}
                {cardiacRatios.length > 0 && (
                  <div style={{ marginTop: 22 }}>
                    <span style={{ ...CHIP, color: "rgba(247,240,223,0.62)" }}>Cardiac & Metabolic Ratios</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                      {cardiacRatios.map((r) => (
                        <div key={r.label} style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", border: `1px solid ${r.good ? "#34d39933" : "#fb718533"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</span>
                            <span style={{ fontSize: 22, fontWeight: 900, color: r.good ? "#34d399" : "#fb7185", letterSpacing: "-0.04em" }}>{r.value}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(247,240,223,0.62)" }}>{r.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRIORITY ACTION LIST */}
              {priorityList.length > 0 && (
                <div className="glass-card" style={{ borderRadius: 18, padding: 22, marginBottom: 26 }}>
                  <span style={{ ...CHIP, color: "#e879f9" }}>Prioritised Action List</span>
                  <p style={{ fontSize: 12, color: "rgba(247,240,223,0.62)", margin: "8px 0 16px" }}>
                    Tackle these in order — flagged markers first, then borderline.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {priorityList.map((r, i) => {
                      const cfg = STATUS_CONFIG[r.status];
                      return (
                        <div key={r.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", borderLeft: `3px solid ${cfg.color}` }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: cfg.color, minWidth: 20 }}>{i + 1}</span>
                          <div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 999 }}>{cfg.label}</span>
                            </div>
                            <span style={{ fontSize: 12.5, color: "rgba(247,240,223,0.72)", lineHeight: 1.55 }}>{r.recommendation}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PER-MARKER DETAIL */}
              {TABS.filter((tab) => analysis.some((r) => r.tab === tab)).map((tab) => (
                <div key={tab} style={{ marginBottom: 30 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: "rgba(247,240,223,0.85)", letterSpacing: "-0.02em", borderLeft: "3px solid #a78bfa", paddingLeft: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{TAB_ICON[tab]}</span> {TAB_LABELS[tab]}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {analysis.filter((r) => r.tab === tab).map((result, idx) => {
                      const cfg = STATUS_CONFIG[result.status];
                      return (
                        <motion.div
                          key={result.key}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: idx * 0.04 }}
                          className="glass-card"
                          style={{ borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", border: `1px solid ${cfg.color}33` }}
                        >
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: cfg.color }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: "#f7f0df" }}>{result.label}</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: cfg.color }}>{result.value} {result.unit}</span>
                            <span style={{ marginLeft: "auto", padding: "3px 12px", borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800, border: `1px solid ${cfg.color}44` }}>
                              {cfg.label}
                            </span>
                          </div>

                          <RangeBar range={result.range} value={result.value} color={cfg.color} />

                          <div style={{ fontSize: 13, color: "rgba(247,240,223,0.78)", lineHeight: 1.65, margin: "12px 0 10px" }}>
                            {result.explanation}
                          </div>
                          <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 12, padding: "10px 14px" }}>
                            <span style={{ ...CHIP, color: "#a78bfa", display: "block", marginBottom: 4, fontSize: 10 }}>💡 Action</span>
                            <span style={{ fontSize: 13, color: "rgba(247,240,223,0.82)", lineHeight: 1.6 }}>{result.recommendation}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {analyzed && analysis.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(247,240,223,0.62)", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px dashed rgba(167,139,250,0.2)", marginBottom: 26 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <p style={{ margin: 0, fontSize: 15 }}>No values entered yet. Fill in your blood test results above.</p>
          </div>
        )}

        {/* ============ CYCLE BLOODWORK (enhanced) ============ */}
        <AnimatePresence>
          {showCyclePanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 26 }}
            >
              <div style={{ borderRadius: 20, padding: 26, background: "linear-gradient(160deg, rgba(232,121,249,0.08), rgba(167,139,250,0.05))", border: "1px solid rgba(232,121,249,0.28)" }}>
                <span style={{ ...CHIP, color: "#e879f9" }}>Enhanced Athlete · Harm-Reduction</span>
                <h2 style={{ margin: "10px 0 6px", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>Cycle Bloodwork Guide</h2>
                <p style={{ fontSize: 13, color: "rgba(247,240,223,0.72)", lineHeight: 1.6, margin: "0 0 18px", maxWidth: 640 }}>
                  If you use anabolics/TRT, bloodwork is non-negotiable — it's how you catch problems before they
                  become permanent. This is educational harm-reduction, not encouragement or a substitute for a
                  physician who supervises your protocol.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 22 }}>
                  {CYCLE_MARKERS.map((m) => (
                    <div key={m.marker} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#e879f9", marginBottom: 6 }}>{m.marker}</div>
                      <div style={{ fontSize: 12.5, color: "rgba(247,240,223,0.72)", lineHeight: 1.55 }}>{m.why}</div>
                    </div>
                  ))}
                </div>

                <span style={{ ...CHIP, color: "rgba(247,240,223,0.62)" }}>When To Test</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {CYCLE_TIMING.map((t) => (
                    <div key={t.phase} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 16px" }}>
                      <div style={{ minWidth: 96 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#a78bfa" }}>{t.phase}</div>
                        <div style={{ fontSize: 11, color: "rgba(247,240,223,0.62)" }}>{t.when}</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: "rgba(247,240,223,0.75)", lineHeight: 1.55 }}>{t.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============ COST GUIDE ============ */}
        <div className="glass-card" style={{ borderRadius: 20, padding: 26, marginBottom: 26 }}>
          <span style={{ ...CHIP, color: "#d8b35a" }}>India Lab-Test Cost & Frequency Guide</span>
          <p style={{ fontSize: 12, color: "rgba(247,240,223,0.62)", margin: "8px 0 18px", lineHeight: 1.6 }}>
            Indicative private-lab pricing (Dr Lal PathLabs, Thyrocare, Metropolis, Redcliffe tiers). Government
            hospitals and health-camp packages are often cheaper.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
              <thead>
                <tr>
                  {["Panel", "Typical Cost", "Suggested Frequency"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", ...CHIP, color: "rgba(247,240,223,0.62)", fontSize: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COST_GUIDE.map((row) => (
                  <tr key={row.panel}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#f7f0df", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.panel}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: "#d8b35a", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.price}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12.5, color: "rgba(247,240,223,0.72)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{row.freq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ DISCLAIMER ============ */}
        <div style={{ background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.28)", borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>⚕️</span>
            <span style={{ ...CHIP, color: "#fb7185" }}>Medical Disclaimer — Read This</span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(247,240,223,0.72)", lineHeight: 1.7 }}>
            This tool is for <strong style={{ color: "#f7f0df" }}>education only and is not a medical diagnosis</strong>.
            Reference ranges vary by laboratory, age, ethnicity, assay method and clinical context — a value flagged
            here may be perfectly normal for you, and a "normal" value doesn't rule out disease. Never start, stop, or
            change medication, supplements or hormonal therapy based on this page.{" "}
            <strong style={{ color: "#f7f0df" }}>Always consult a qualified doctor</strong> to interpret your results
            and guide treatment. In an emergency, contact your nearest hospital immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
