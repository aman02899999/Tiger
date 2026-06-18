import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthSystem";
import { db, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type Gender = "male" | "female";
type TabKey = "CBC" | "BloodSugar" | "Lipid" | "Kidney" | "Vitamins" | "Thyroid";
type StatusType = "low" | "normal" | "borderline" | "high" | "unknown";

interface MarkerDef {
  key: string;
  label: string;
  unit: string;
  getRange: (gender: Gender) => { low?: number; normalMin: number; normalMax: number; borderlineMax?: number; high?: number };
  getStatus: (value: number, gender: Gender) => StatusType;
  explain: (value: number, status: StatusType, gender: Gender) => string;
  recommend: (value: number, status: StatusType, gender: Gender) => string;
}

const MARKERS: Record<TabKey, MarkerDef[]> = {
  CBC: [
    {
      key: "hemoglobin",
      label: "Hemoglobin",
      unit: "g/dL",
      getRange: (g) => g === "male"
        ? { normalMin: 13, normalMax: 17 }
        : { normalMin: 12, normalMax: 16 },
      getStatus: (v, g) => {
        const min = g === "male" ? 13 : 12;
        const max = g === "male" ? 17 : 16;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your hemoglobin of ${v} g/dL is below normal. Hemoglobin carries oxygen in your blood — low levels indicate anaemia, which can cause fatigue, breathlessness and weakness.`;
        if (s === "high") return `Your hemoglobin of ${v} g/dL is above normal. Elevated levels may suggest dehydration, lung disease, or polycythaemia — a condition where the body makes too many red blood cells.`;
        return `Your hemoglobin of ${v} g/dL is within the healthy range. Your blood is carrying oxygen efficiently.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase iron-rich foods: spinach, lentils, beetroot, dates, jaggery, and lean meats. Pair with vitamin C sources (amla, lemon) to enhance absorption. Consider iron supplements after consulting your doctor.";
        if (s === "high") return "Stay well hydrated. If you smoke, quitting can help. Consult a haematologist to rule out polycythaemia vera or lung disease.";
        return "Maintain your balanced diet rich in iron, B12, and folate. Regular exercise supports healthy red blood cell production.";
      },
    },
    {
      key: "rbc",
      label: "RBC Count",
      unit: "million/µL",
      getRange: () => ({ normalMin: 4.5, normalMax: 5.5 }),
      getStatus: (v) => {
        if (v < 4.5) return "low";
        if (v > 5.5) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your RBC count of ${v} million/µL is low. Red blood cells deliver oxygen throughout the body — too few can lead to anaemia and fatigue.`;
        if (s === "high") return `Your RBC count of ${v} million/µL is high. This may indicate dehydration, high altitude adaptation, or a bone marrow disorder.`;
        return `Your RBC count of ${v} million/µL is healthy, indicating good red blood cell production.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat iron-rich and B12-rich foods. Avoid tea or coffee with meals as they inhibit iron absorption. Consult a doctor if symptoms persist.";
        if (s === "high") return "Increase daily water intake to at least 3 litres. Avoid diuretics and consult a doctor to rule out polycythaemia.";
        return "Keep up a nutrient-dense diet and stay active. Aerobic exercise supports optimal RBC levels.";
      },
    },
    {
      key: "wbc",
      label: "WBC Count",
      unit: "/µL",
      getRange: () => ({ normalMin: 4000, normalMax: 11000 }),
      getStatus: (v) => {
        if (v < 4000) return "low";
        if (v > 11000) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your WBC count of ${v}/µL is low (leucopaenia). White blood cells fight infection — low levels can weaken your immune response.`;
        if (s === "high") return `Your WBC count of ${v}/µL is elevated (leucocytosis). This typically indicates an active infection, inflammation, or in rare cases a blood disorder.`;
        return `Your WBC count of ${v}/µL is normal, indicating a healthy immune system.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Avoid crowded places to reduce infection risk. Eat zinc-rich foods (pumpkin seeds, chickpeas). Consult a doctor — certain medications or conditions cause low WBC.";
        if (s === "high") return "If you have fever or signs of infection, see a doctor promptly. Rest, stay hydrated, and avoid self-medicating with antibiotics.";
        return "A healthy lifestyle with adequate sleep (7–8 hours), stress management, and good nutrition supports immunity.";
      },
    },
    {
      key: "platelets",
      label: "Platelets",
      unit: "/µL",
      getRange: () => ({ normalMin: 150000, normalMax: 400000 }),
      getStatus: (v) => {
        if (v < 150000) return "low";
        if (v > 400000) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your platelet count of ${v}/µL is low (thrombocytopaenia). Platelets help blood clot — low counts increase risk of bleeding and bruising.`;
        if (s === "high") return `Your platelet count of ${v}/µL is high (thrombocytosis). This may raise clotting risk and can be linked to iron deficiency, inflammation, or a bone marrow issue.`;
        return `Your platelet count of ${v}/µL is normal. Your blood's ability to clot is healthy.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Avoid NSAIDs like ibuprofen. Eat papaya leaf extract, pomegranate, and folate-rich foods. Seek medical evaluation urgently if below 50,000.";
        if (s === "high") return "Stay hydrated and physically active. If persistently high, a haematologist evaluation is recommended. Address any underlying inflammatory condition.";
        return "No specific action needed. Maintain a healthy diet and avoid smoking, which can affect platelet function.";
      },
    },
    {
      key: "hematocrit",
      label: "Hematocrit",
      unit: "%",
      getRange: (g) => g === "male"
        ? { normalMin: 40, normalMax: 52 }
        : { normalMin: 36, normalMax: 48 },
      getStatus: (v, g) => {
        const min = g === "male" ? 40 : 36;
        const max = g === "male" ? 52 : 48;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your hematocrit of ${v}% is low. It measures the proportion of red blood cells in blood — low values suggest anaemia or overhydration.`;
        if (s === "high") return `Your hematocrit of ${v}% is high, suggesting dehydration, high altitude, or polycythaemia.`;
        return `Your hematocrit of ${v}% is healthy, indicating a normal red blood cell volume.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Address underlying anaemia with iron, B12, and folate. Ensure adequate caloric intake. Follow up with a doctor.";
        if (s === "high") return "Drink 3–4 litres of water daily. If you smoke, stop. Get a medical check-up to rule out polycythaemia vera.";
        return "Continue your current healthy diet and lifestyle. Regular blood tests once a year are sufficient.";
      },
    },
  ],

  BloodSugar: [
    {
      key: "fastingGlucose",
      label: "Fasting Glucose",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 70, normalMax: 100, borderlineMax: 125 }),
      getStatus: (v) => {
        if (v < 70) return "low";
        if (v <= 100) return "normal";
        if (v <= 125) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "low") return `Your fasting glucose of ${v} mg/dL is below normal (hypoglycaemia). This can cause dizziness, shakiness, and confusion.`;
        if (s === "normal") return `Your fasting glucose of ${v} mg/dL is normal. Your body is managing blood sugar well.`;
        if (s === "borderline") return `Your fasting glucose of ${v} mg/dL falls in the pre-diabetic range (100–125). You are at elevated risk of developing type 2 diabetes.`;
        return `Your fasting glucose of ${v} mg/dL is high — this indicates diabetes or severely impaired glucose regulation.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat small, frequent meals with complex carbohydrates. Avoid skipping meals. Keep glucose tablets or fruit juice handy. Consult a doctor if episodes are frequent.";
        if (s === "normal") return "Maintain your current dietary habits. Limit refined sugars, stay active, and repeat the test annually.";
        if (s === "borderline") return "Switch to a low glycaemic index diet: millets (jowar, bajra), oats, legumes. Walk 30–45 minutes daily. Reduce sugar, white rice, and maida. Consult a diabetologist.";
        return "Consult a diabetologist immediately. Strict dietary changes, blood sugar monitoring, and possibly medication are required. Avoid sugary foods and refined carbohydrates entirely.";
      },
    },
    {
      key: "postMealGlucose",
      label: "Post-Meal Glucose (2hr)",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 140, borderlineMax: 200 }),
      getStatus: (v) => {
        if (v < 140) return "normal";
        if (v <= 200) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `Your 2-hour post-meal glucose of ${v} mg/dL is normal, showing your body handles glucose effectively after eating.`;
        if (s === "borderline") return `Your post-meal glucose of ${v} mg/dL (140–200) suggests impaired glucose tolerance — an intermediate stage before diabetes.`;
        return `Your post-meal glucose of ${v} mg/dL exceeds 200 mg/dL, which is diagnostic of diabetes according to WHO criteria.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Keep meals balanced with proteins, fibre, and healthy fats to slow glucose absorption. A 10-minute walk after meals is highly effective.";
        if (s === "borderline") return "Portion control is critical. Avoid high-GI foods: white bread, fruit juice, potatoes. Eat more fibre (vegetables, legumes). Exercise after meals.";
        return "Immediate medical attention is required. Do not delay consulting a diabetologist. Monitor blood sugar regularly. Follow a strict diabetic diet plan.";
      },
    },
    {
      key: "hba1c",
      label: "HbA1c",
      unit: "%",
      getRange: () => ({ normalMin: 0, normalMax: 5.6, borderlineMax: 6.4 }),
      getStatus: (v) => {
        if (v < 5.7) return "normal";
        if (v <= 6.4) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `Your HbA1c of ${v}% is below 5.7%, indicating excellent blood sugar control over the past 3 months.`;
        if (s === "borderline") return `Your HbA1c of ${v}% (5.7–6.4%) indicates pre-diabetes. Your average blood sugar has been elevated over the past 3 months.`;
        return `Your HbA1c of ${v}% is in the diabetic range (≥6.5%). This reflects chronically high blood sugar over the past 3 months.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Excellent! Continue with a balanced diet, regular exercise, and annual monitoring. Limit sweets and processed foods.";
        if (s === "borderline") return "Lifestyle intervention is crucial now. Adopt a low-carb diet, exercise 150 minutes per week, lose 5–7% body weight if overweight. Recheck in 3 months.";
        return "Consult a diabetologist without delay. Medication, strict diet control, and regular monitoring are essential. Target HbA1c below 7% with medical guidance.";
      },
    },
  ],

  Lipid: [
    {
      key: "totalCholesterol",
      label: "Total Cholesterol",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 200, borderlineMax: 239 }),
      getStatus: (v) => {
        if (v < 200) return "normal";
        if (v <= 239) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `Your total cholesterol of ${v} mg/dL is desirable, reducing your risk of cardiovascular disease.`;
        if (s === "borderline") return `Your total cholesterol of ${v} mg/dL is borderline high (200–239). Your risk of heart disease is moderately elevated.`;
        return `Your total cholesterol of ${v} mg/dL is high (≥240). This significantly raises your risk of heart attack and stroke.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Maintain a heart-healthy diet. Use mustard or olive oil, eat plenty of vegetables, nuts, and fish. Exercise regularly.";
        if (s === "borderline") return "Reduce saturated fats: limit ghee, butter, red meat, and full-fat dairy. Increase soluble fibre (oats, barley, beans, flaxseeds). Exercise 30 min/day.";
        return "Consult a cardiologist. Dietary changes alone may be insufficient — statins or other medications may be needed. Avoid trans fats completely. Aim for weekly aerobic exercise.";
      },
    },
    {
      key: "ldl",
      label: "LDL Cholesterol",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 100, borderlineMax: 159 }),
      getStatus: (v) => {
        if (v < 100) return "normal";
        if (v <= 159) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `Your LDL (bad cholesterol) of ${v} mg/dL is optimal. Low LDL significantly reduces cardiovascular risk.`;
        if (s === "borderline") return `Your LDL of ${v} mg/dL is above optimal (100–159). Plaque can accumulate in arteries over time at this level.`;
        return `Your LDL of ${v} mg/dL is high (≥160). This level substantially increases risk of coronary artery disease and heart attack.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Excellent. Keep avoiding trans fats and processed foods. Continue regular cardiovascular exercise.";
        if (s === "borderline") return "Adopt a low-saturated-fat diet. Eat walnuts, flaxseeds, avocado, and fatty fish. Add 10g psyllium husk (isabgol) daily to reduce LDL. Exercise 5 days/week.";
        return "Seek immediate medical evaluation. A cardiologist may prescribe statins. Strict dietary compliance is essential — avoid all fried foods, bakery items, and red meat.";
      },
    },
    {
      key: "hdl",
      label: "HDL Cholesterol",
      unit: "mg/dL",
      getRange: (g) => g === "male"
        ? { normalMin: 40, normalMax: 999 }
        : { normalMin: 50, normalMax: 999 },
      getStatus: (v, g) => {
        const min = g === "male" ? 40 : 50;
        if (v < min) return "low";
        if (v >= 60) return "normal";
        return "borderline";
      },
      explain: (v, s, g) => {
        const min = g === "male" ? 40 : 50;
        if (s === "low") return `Your HDL (good cholesterol) of ${v} mg/dL is below ${min} mg/dL. Low HDL is a major cardiovascular risk factor, as HDL removes bad cholesterol from arteries.`;
        if (s === "borderline") return `Your HDL of ${v} mg/dL is acceptable but not optimal. Higher HDL (≥60) offers better heart protection.`;
        return `Your HDL of ${v} mg/dL is excellent. High HDL is protective against heart disease.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Aerobic exercise is the most effective way to raise HDL — aim for 30 min of brisk walking, cycling, or swimming daily. Eat olive oil, nuts, and fatty fish. Quit smoking if applicable.";
        if (s === "borderline") return "Increase physical activity and add omega-3 rich foods (flaxseeds, walnuts, mackerel). Avoid trans fats which lower HDL.";
        return "Excellent HDL level. Maintain your active lifestyle and heart-healthy diet.";
      },
    },
    {
      key: "triglycerides",
      label: "Triglycerides",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 0, normalMax: 150, borderlineMax: 199 }),
      getStatus: (v) => {
        if (v < 150) return "normal";
        if (v <= 199) return "borderline";
        return "high";
      },
      explain: (v, s) => {
        if (s === "normal") return `Your triglycerides of ${v} mg/dL are normal. Your body is processing dietary fats efficiently.`;
        if (s === "borderline") return `Your triglycerides of ${v} mg/dL are borderline high (150–199). This is often linked to high carbohydrate or sugar intake.`;
        return `Your triglycerides of ${v} mg/dL are high (≥200), increasing risk of pancreatitis and cardiovascular disease.`;
      },
      recommend: (_, s) => {
        if (s === "normal") return "Good. Continue limiting sugary drinks, alcohol, and refined carbohydrates. Regular exercise maintains healthy triglycerides.";
        if (s === "borderline") return "Cut down on sugar, white rice, fruit juices, and alcohol significantly. Add omega-3 fatty acids through fish or supplements. Exercise daily.";
        return "Consult a doctor. Medications may be needed if very high. Strict low-carb, low-sugar diet is essential. Avoid alcohol completely. Regular exercise is critical.";
      },
    },
  ],

  Kidney: [
    {
      key: "creatinine",
      label: "Creatinine",
      unit: "mg/dL",
      getRange: (g) => g === "male"
        ? { normalMin: 0.7, normalMax: 1.2 }
        : { normalMin: 0.5, normalMax: 1.0 },
      getStatus: (v, g) => {
        const min = g === "male" ? 0.7 : 0.5;
        const max = g === "male" ? 1.2 : 1.0;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your creatinine of ${v} mg/dL is below normal. This can occur with low muscle mass, malnutrition, or during pregnancy.`;
        if (s === "high") return `Your creatinine of ${v} mg/dL is elevated, suggesting reduced kidney filtration. This may indicate acute or chronic kidney disease.`;
        return `Your creatinine of ${v} mg/dL is normal. Your kidneys are filtering waste effectively.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase protein-rich foods and resistance training to build muscle mass. Discuss with a doctor if you suspect malnutrition.";
        if (s === "high") return "Consult a nephrologist promptly. Avoid nephrotoxic drugs (NSAIDs, certain antibiotics). Stay well hydrated. Limit protein if kidneys are compromised. Retest in 2–4 weeks.";
        return "Maintain good hydration (2–3 litres of water daily). Avoid excess protein supplementation. Annual kidney function tests are recommended.";
      },
    },
    {
      key: "uricAcid",
      label: "Uric Acid",
      unit: "mg/dL",
      getRange: (g) => g === "male"
        ? { normalMin: 3.5, normalMax: 7.2 }
        : { normalMin: 2.6, normalMax: 6.0 },
      getStatus: (v, g) => {
        const min = g === "male" ? 3.5 : 2.6;
        const max = g === "male" ? 7.2 : 6.0;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your uric acid of ${v} mg/dL is below normal (hypouricaemia), which is rare and may relate to liver issues or certain medications.`;
        if (s === "high") return `Your uric acid of ${v} mg/dL is high (hyperuricaemia). Excess uric acid can crystallise in joints causing gout, or damage the kidneys.`;
        return `Your uric acid of ${v} mg/dL is normal. Purine metabolism is working well.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Consult a doctor to rule out underlying liver disease or medication side effects.";
        if (s === "high") return "Avoid high-purine foods: red meat, organ meats, shellfish, beer, and excessive fructose. Drink 3+ litres of water daily. Limit alcohol. A doctor may prescribe allopurinol if gout episodes occur.";
        return "Maintain moderate protein intake and stay well hydrated. Limit alcohol and sugary beverages to keep uric acid in range.";
      },
    },
    {
      key: "bloodUrea",
      label: "Blood Urea",
      unit: "mg/dL",
      getRange: () => ({ normalMin: 7, normalMax: 25 }),
      getStatus: (v) => {
        if (v < 7) return "low";
        if (v > 25) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your blood urea of ${v} mg/dL is low, which can occur with very low protein intake, liver disease, or overhydration.`;
        if (s === "high") return `Your blood urea of ${v} mg/dL is elevated. This may indicate kidney insufficiency, dehydration, or high protein intake.`;
        return `Your blood urea of ${v} mg/dL is normal. Protein metabolism and kidney excretion are balanced.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Increase dietary protein intake through dal, eggs, paneer, and legumes. Consult a doctor if you suspect liver disease.";
        if (s === "high") return "Increase water intake significantly. If kidney disease is suspected, reduce high-protein foods. Consult a nephrologist for comprehensive evaluation.";
        return "Maintain balanced protein consumption (0.8–1g/kg body weight) and adequate hydration. Annual kidney function monitoring is advised.";
      },
    },
  ],

  Vitamins: [
    {
      key: "vitaminD",
      label: "Vitamin D",
      unit: "ng/mL",
      getRange: () => ({ normalMin: 30, normalMax: 100, borderlineMax: 30 }),
      getStatus: (v) => {
        if (v < 20) return "low";
        if (v < 30) return "borderline";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your Vitamin D of ${v} ng/mL is deficient (<20). Vitamin D is essential for bone health, immunity, muscle function, and mood regulation. Deficiency is extremely common in India.`;
        if (s === "borderline") return `Your Vitamin D of ${v} ng/mL is insufficient (20–30). While not severely deficient, optimising this will benefit bone density, immunity, and overall health.`;
        return `Your Vitamin D of ${v} ng/mL is sufficient. Your bones, immune system, and muscle function are well supported.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Supplement with Vitamin D3 60,000 IU weekly for 8–12 weeks (prescription dose in India), then 2,000 IU daily for maintenance. Get 20–30 minutes of sunlight exposure daily. Eat fatty fish, egg yolks, and fortified milk.";
        if (s === "borderline") return "Take Vitamin D3 2,000–4,000 IU daily. Morning sunlight exposure (10–11 AM) for 20 minutes is highly beneficial. Add fatty fish, eggs, and fortified cereals to your diet.";
        return "Maintain sunlight exposure and a Vitamin D-rich diet. A maintenance dose of 1,000–2,000 IU daily is fine. Recheck annually.";
      },
    },
    {
      key: "vitaminB12",
      label: "Vitamin B12",
      unit: "pg/mL",
      getRange: () => ({ normalMin: 200, normalMax: 900 }),
      getStatus: (v) => {
        if (v < 200) return "low";
        if (v > 900) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your Vitamin B12 of ${v} pg/mL is deficient. B12 is critical for nerve health, red blood cell formation, and brain function. Deficiency is very common in vegetarians and vegans in India.`;
        if (s === "high") return `Your Vitamin B12 of ${v} pg/mL is very high. While generally not harmful (B12 is water-soluble), extremely high levels may indicate liver disease or supplementation issues.`;
        return `Your Vitamin B12 of ${v} pg/mL is normal. Your nerve function and blood cell production are well supported.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "If vegetarian/vegan, B12 supplementation is essential: 1,000–2,000 mcg daily orally or monthly injections. Include dairy, eggs, paneer. Fortified nutritional yeast is a good plant source.";
        if (s === "high") return "If taking B12 supplements, reduce or pause dosage. Check with a doctor to rule out liver or haematological conditions if you are not supplementing.";
        return "Continue current dietary habits. If vegetarian, consider a low-dose maintenance supplement of 500 mcg daily. Recheck annually.";
      },
    },
    {
      key: "iron",
      label: "Serum Iron",
      unit: "µg/dL",
      getRange: () => ({ normalMin: 60, normalMax: 170 }),
      getStatus: (v) => {
        if (v < 60) return "low";
        if (v > 170) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your serum iron of ${v} µg/dL is low. Iron is needed to make haemoglobin — deficiency causes anaemia, fatigue, poor concentration, and brittle nails.`;
        if (s === "high") return `Your serum iron of ${v} µg/dL is high. This may indicate haemochromatosis (iron overload), excessive supplementation, or haemolytic conditions.`;
        return `Your serum iron of ${v} µg/dL is within the normal range, supporting healthy oxygen transport.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Eat iron-rich foods: lentils, kidney beans, spinach, tofu, jaggery, and lean meats. Consume with Vitamin C to maximise absorption. Avoid tea/coffee around meal times. Doctor may prescribe iron supplements.";
        if (s === "high") return "Avoid iron supplements. Reduce consumption of red meat and iron-fortified foods. Consult a doctor to rule out haemochromatosis — regular blood donation can help reduce iron stores in some cases.";
        return "Maintain a balanced diet with adequate iron-rich foods. Pair with Vitamin C sources to ensure optimal absorption.";
      },
    },
    {
      key: "ferritin",
      label: "Ferritin",
      unit: "ng/mL",
      getRange: (g) => g === "male"
        ? { normalMin: 20, normalMax: 250 }
        : { normalMin: 10, normalMax: 120 },
      getStatus: (v, g) => {
        const min = g === "male" ? 20 : 10;
        const max = g === "male" ? 250 : 120;
        if (v < min) return "low";
        if (v > max) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your ferritin of ${v} ng/mL is low. Ferritin is the storage form of iron — low levels precede iron deficiency anaemia and cause fatigue, hair loss, and poor exercise tolerance.`;
        if (s === "high") return `Your ferritin of ${v} ng/mL is high. Elevated ferritin can indicate iron overload, inflammation, liver disease, or metabolic syndrome.`;
        return `Your ferritin of ${v} ng/mL is normal. Your iron stores are adequate.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Prioritise iron-rich foods and Vitamin C intake. Supplement if directed by a doctor. Hair loss and fatigue should improve as ferritin levels rise. Recheck in 3 months.";
        if (s === "high") return "Consult a doctor to identify the cause. Avoid iron supplements. If very high (>500), urgent medical evaluation is needed to rule out haemochromatosis or liver disease.";
        return "Your iron stores are healthy. Maintain a balanced diet and recheck annually.";
      },
    },
  ],

  Thyroid: [
    {
      key: "tsh",
      label: "TSH",
      unit: "µIU/mL",
      getRange: () => ({ normalMin: 0.4, normalMax: 4.0 }),
      getStatus: (v) => {
        if (v < 0.4) return "low";
        if (v > 4.0) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your TSH of ${v} µIU/mL is low, suggesting hyperthyroidism (overactive thyroid). This can cause weight loss, palpitations, anxiety, and heat intolerance.`;
        if (s === "high") return `Your TSH of ${v} µIU/mL is elevated, suggesting hypothyroidism (underactive thyroid). This can cause fatigue, weight gain, cold intolerance, and depression.`;
        return `Your TSH of ${v} µIU/mL is normal. Your thyroid gland is functioning properly.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Consult an endocrinologist immediately. Avoid iodine supplements unless prescribed. Beta-blockers may be used for symptom control. Imaging of thyroid may be required.";
        if (s === "high") return "Consult an endocrinologist. Levothyroxine (thyroid hormone replacement) is commonly prescribed. Increase selenium-rich foods (Brazil nuts, sunflower seeds). Avoid goitrogens (raw cabbage, soy) in excess.";
        return "Your thyroid is healthy. Maintain adequate iodine intake through iodised salt. Annual thyroid check is recommended, especially for women over 30.";
      },
    },
    {
      key: "t3",
      label: "T3 (Triiodothyronine)",
      unit: "ng/dL",
      getRange: () => ({ normalMin: 80, normalMax: 200 }),
      getStatus: (v) => {
        if (v < 80) return "low";
        if (v > 200) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your T3 of ${v} ng/dL is below normal. T3 is the active thyroid hormone that regulates metabolism. Low levels cause slow metabolism, fatigue, and cognitive issues.`;
        if (s === "high") return `Your T3 of ${v} ng/dL is elevated. High T3 indicates hyperthyroidism, leading to rapid heart rate, weight loss, and anxiety.`;
        return `Your T3 of ${v} ng/dL is normal. Thyroid hormone activity is balanced.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Consult an endocrinologist. Ensure adequate selenium, zinc, and iodine intake. Medication may be required alongside dietary changes.";
        if (s === "high") return "Medical evaluation is essential. Anti-thyroid medications or radioiodine therapy may be recommended depending on the underlying cause.";
        return "Continue maintaining iodine-adequate diet and regular thyroid monitoring.";
      },
    },
    {
      key: "t4",
      label: "T4 (Thyroxine)",
      unit: "µg/dL",
      getRange: () => ({ normalMin: 5.0, normalMax: 12.0 }),
      getStatus: (v) => {
        if (v < 5.0) return "low";
        if (v > 12.0) return "high";
        return "normal";
      },
      explain: (v, s) => {
        if (s === "low") return `Your T4 of ${v} µg/dL is low. Thyroxine is produced by the thyroid gland and is a precursor to the active T3 hormone. Low T4 indicates hypothyroidism.`;
        if (s === "high") return `Your T4 of ${v} µg/dL is elevated, consistent with hyperthyroidism or excess thyroid hormone supplementation.`;
        return `Your T4 of ${v} µg/dL is normal. Your thyroid's hormone production is appropriate.`;
      },
      recommend: (_, s) => {
        if (s === "low") return "Consult an endocrinologist. Levothyroxine supplementation is typically prescribed. Ensure adequate iodine and selenium in your diet. Avoid soy products around medication time.";
        if (s === "high") return "Consult a doctor promptly. Excess T4 can strain the heart and cause bone loss over time. Medication adjustment or further testing may be needed.";
        return "Thyroid function is healthy. Maintain iodised salt usage and get annual thyroid panels done.";
      },
    },
  ],
};

const TABS: TabKey[] = ["CBC", "BloodSugar", "Lipid", "Kidney", "Vitamins", "Thyroid"];
const TAB_LABELS: Record<TabKey, string> = {
  CBC: "CBC",
  BloodSugar: "Blood Sugar",
  Lipid: "Lipid Panel",
  Kidney: "Kidney",
  Vitamins: "Vitamins",
  Thyroid: "Thyroid",
};

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string }> = {
  normal: { label: "Normal", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  borderline: { label: "Borderline", color: "#eab308", bg: "rgba(234,179,8,0.15)" },
  low: { label: "Low", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  high: { label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  unknown: { label: "—", color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
};

function getAllMarkerKeys(): string[] {
  return TABS.flatMap((tab) => MARKERS[tab].map((m) => m.key));
}

export default function BloodReportPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("CBC");
  const [gender, setGender] = useState<Gender>("male");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(getAllMarkerKeys().map((k) => [k, ""]))
  );
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
  }, [gender, activeTab]);

  const analysis = useMemo(() => {
    const results: Array<{
      key: string;
      label: string;
      unit: string;
      value: number;
      status: StatusType;
      explanation: string;
      recommendation: string;
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
          tab,
        });
      }
    }
    return results;
  }, [values, gender, analyzed]); // eslint-disable-line react-hooks/exhaustive-deps

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
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setUploadProgress(pct);
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
    const anyFilled = getAllMarkerKeys().some(
      (k) => values[k] && values[k].trim() !== ""
    );
    if (!anyFilled) return;
    setAnalyzed(true);
    setTimeout(() => {
      document.getElementById("analysis-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const currentMarkers = MARKERS[activeTab];
  const analyzedForTab = analysis.filter((r) => r.tab === activeTab);
  const summaryCount = {
    normal: analysis.filter((r) => r.status === "normal").length,
    borderline: analysis.filter((r) => r.status === "borderline").length,
    abnormal: analysis.filter((r) => r.status === "low" || r.status === "high").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #07040d 0%, #0b0714 50%, #07040d 100%)",
        color: "#f7f0df",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 80px" }}>

        {/* PAGE HEADER */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>🩸</span>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 800,
                background: "linear-gradient(90deg, #a855f7, #ec4899, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.5px",
              }}
            >
              Blood Report Analyser
            </h1>
          </div>
          <p style={{ color: "rgba(247,240,223,0.6)", fontSize: 15, margin: 0 }}>
            Enter your blood test values to get personalised health insights and recommendations
          </p>
        </div>

        {/* GENDER SELECTOR */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "rgba(247,240,223,0.8)" }}>
            Biological Sex (affects reference ranges)
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: gender === g
                    ? "1.5px solid #a855f7"
                    : "1.5px solid rgba(255,255,255,0.1)",
                  background: gender === g
                    ? "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.15))"
                    : "rgba(255,255,255,0.03)",
                  color: gender === g ? "#f7f0df" : "rgba(247,240,223,0.5)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                }}
              >
                {g === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>

        {/* FILE UPLOAD */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "rgba(247,240,223,0.8)" }}>
            Upload Blood Report (optional — PDF / Image, max 10 MB)
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById("file-input")?.click()}
            style={{
              border: dragOver
                ? "2px dashed #a855f7"
                : "2px dashed rgba(168,85,247,0.3)",
              borderRadius: 12,
              padding: "28px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <p style={{ margin: 0, color: "rgba(247,240,223,0.6)", fontSize: 14 }}>
              {file ? file.name : "Drag & drop your report here, or click to browse"}
            </p>
            {file && (
              <p style={{ margin: "4px 0 0", color: "rgba(168,85,247,0.8)", fontSize: 12 }}>
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

          {uploadError && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>{uploadError}</p>
          )}

          {file && !reportUrl && (
            <button
              onClick={handleUpload}
              disabled={uploading || !user}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: uploading
                  ? "rgba(168,85,247,0.3)"
                  : "linear-gradient(90deg, #7c3aed, #db2777)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: uploading || !user ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              {uploading ? `Uploading… ${uploadProgress}%` : "Upload Report"}
            </button>
          )}

          {uploading && (
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", height: 8 }}>
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                  borderRadius: 8,
                  transition: "width 0.3s",
                }}
              />
            </div>
          )}

          {reportUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>Report uploaded successfully</span>
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: "auto", color: "#a855f7", fontSize: 12, textDecoration: "none", fontWeight: 600 }}
              >
                View ↗
              </a>
            </div>
          )}

          {saveError && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: "8px 0 0" }}>{saveError}</p>
          )}

          {!user && (
            <p style={{ color: "rgba(247,240,223,0.4)", fontSize: 12, margin: "8px 0 0" }}>
              Sign in to save your report to the cloud.
            </p>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: 24,
                border: activeTab === tab
                  ? "1.5px solid rgba(168,85,247,0.8)"
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: activeTab === tab
                  ? "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(219,39,119,0.25))"
                  : "rgba(255,255,255,0.03)",
                color: activeTab === tab ? "#f7f0df" : "rgba(247,240,223,0.45)",
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(168,85,247,0.15)",
            borderRadius: 16,
            padding: "24px",
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#f7f0df" }}>
            {TAB_LABELS[activeTab]} Values
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {currentMarkers.map((marker) => (
              <div key={marker.key}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(247,240,223,0.65)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  {marker.label}
                  <span style={{ color: "rgba(168,85,247,0.7)", marginLeft: 4, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                    ({marker.unit})
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={values[marker.key]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [marker.key]: e.target.value }))
                  }
                  placeholder="Enter value"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(168,85,247,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#f7f0df",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.7)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.2)")}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ANALYZE BUTTON */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={handleAnalyze}
            style={{
              padding: "14px 48px",
              borderRadius: 50,
              border: "none",
              background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 4px 30px rgba(168,85,247,0.4)",
              letterSpacing: "0.3px",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 40px rgba(168,85,247,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 30px rgba(168,85,247,0.4)";
            }}
          >
            🔬 Analyse Report
          </button>
          <p style={{ color: "rgba(247,240,223,0.35)", fontSize: 12, marginTop: 8 }}>
            Fill in at least one value to generate analysis
          </p>
        </div>

        {/* ANALYSIS RESULTS */}
        {analyzed && analysis.length > 0 && (
          <div id="analysis-section">
            {/* Summary bar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 24,
                padding: "16px 20px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                border: "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f7f0df", marginRight: 4 }}>
                Summary:
              </span>
              {summaryCount.normal > 0 && (
                <span
                  style={{
                    padding: "4px 14px",
                    borderRadius: 20,
                    background: "rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ✓ {summaryCount.normal} Normal
                </span>
              )}
              {summaryCount.borderline > 0 && (
                <span
                  style={{
                    padding: "4px 14px",
                    borderRadius: 20,
                    background: "rgba(234,179,8,0.15)",
                    color: "#eab308",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ⚠ {summaryCount.borderline} Borderline
                </span>
              )}
              {summaryCount.abnormal > 0 && (
                <span
                  style={{
                    padding: "4px 14px",
                    borderRadius: 20,
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ✕ {summaryCount.abnormal} Abnormal
                </span>
              )}
            </div>

            {/* Per-tab results */}
            {TABS.filter((tab) => analysis.some((r) => r.tab === tab)).map((tab) => (
              <div key={tab} style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "rgba(247,240,223,0.7)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    borderLeft: "3px solid #a855f7",
                    paddingLeft: 12,
                  }}
                >
                  {TAB_LABELS[tab]}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {analysis
                    .filter((r) => r.tab === tab)
                    .map((result) => {
                      const cfg = STATUS_CONFIG[result.status];
                      return (
                        <div
                          key={result.key}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${cfg.color}30`,
                            borderRadius: 14,
                            padding: "18px 20px",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* accent bar */}
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 4,
                              background: cfg.color,
                              borderRadius: "14px 0 0 14px",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#f7f0df" }}>
                              {result.label}
                            </span>
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: cfg.color,
                              }}
                            >
                              {result.value} {result.unit}
                            </span>
                            <span
                              style={{
                                marginLeft: "auto",
                                padding: "3px 12px",
                                borderRadius: 20,
                                background: cfg.bg,
                                color: cfg.color,
                                fontSize: 12,
                                fontWeight: 700,
                                border: `1px solid ${cfg.color}40`,
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color: "rgba(247,240,223,0.75)",
                              lineHeight: 1.6,
                              marginBottom: 10,
                            }}
                          >
                            {result.explanation}
                          </div>

                          <div
                            style={{
                              background: "rgba(168,85,247,0.08)",
                              border: "1px solid rgba(168,85,247,0.18)",
                              borderRadius: 10,
                              padding: "10px 14px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#a855f7",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              💡 Recommendation
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: "rgba(247,240,223,0.8)",
                                lineHeight: 1.6,
                              }}
                            >
                              {result.recommendation}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12,
                padding: "14px 18px",
                marginTop: 8,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(247,240,223,0.5)",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "rgba(239,68,68,0.8)" }}>Disclaimer:</strong> This analysis is for educational purposes only and does not constitute medical advice. Reference ranges may vary by laboratory and individual factors. Always consult a qualified medical professional for diagnosis and treatment.
              </p>
            </div>
          </div>
        )}

        {analyzed && analysis.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "rgba(247,240,223,0.4)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              border: "1px dashed rgba(168,85,247,0.2)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <p style={{ margin: 0, fontSize: 15 }}>No values entered yet. Fill in your blood test results above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
