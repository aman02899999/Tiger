import { useState, useMemo } from "react";
import { useAuth } from "../auth/AuthSystem";

export default function FitnessToolbox() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState({
    height: user?.height || 175,
    weight: user?.weight || 75,
    age: user?.age || 28,
    gender: user?.gender || "male",
    activity: "moderate",
    bodyFat: 18,
    wrist: 17,
    waist: 82,
    hip: 95,
  });

  const calculations = useMemo(() => {
    const { height, weight, age, gender, activity, bodyFat, waist, hip } = measurements;
    const heightM = height / 100;
    
    // BMI
    const bmi = weight / (heightM * heightM);
    
    // Ideal Weight (Devine formula)
    const idealWeight = gender === "male" 
      ? 50 + 2.3 * ((height / 2.54) - 60)
      : 45.5 + 2.3 * ((height / 2.54) - 60);
    
    // Lean Body Mass (Boer formula)
    const lbm = gender === "male"
      ? 0.407 * weight + 0.267 * height - 19.2
      : 0.252 * weight + 0.473 * height - 48.3;
    
    // FFMI (Fat-Free Mass Index)
    const ffm = weight * (1 - bodyFat / 100);
    const ffmi = ffm / (heightM * heightM);
    
    // BMR (Mifflin-St Jeor)
    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    
    // Activity multipliers
    const activityMultipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      "very-active": 1.9,
    };
    const tdee = bmr * activityMultipliers[activity];
    
    // Protein need (2g per kg for muscle gain)
    const protein = weight * 2;
    
    // Water need (35ml per kg)
    const water = (weight * 35) / 1000;
    
    // Lean bulk (TDEE + 300)
    const leanBulk = tdee + 300;
    
    // Cutting (TDEE - 500)
    const cutting = tdee - 500;
    
    // Reverse diet (TDEE + 100)
    const reverse = tdee + 100;
    
    // Max Heart Rate
    const maxHR = 220 - age;
    
    // Body Type (Somatotype)
    const bodyType = waist > hip ? "Endomorph" : waist < hip * 0.85 ? "Ectomorph" : "Mesomorph";
    
    return {
      bmi: bmi.toFixed(1),
      idealWeight: idealWeight.toFixed(1),
      lbm: lbm.toFixed(1),
      ffmi: ffmi.toFixed(1),
      protein: protein.toFixed(0),
      water: water.toFixed(1),
      leanBulk: leanBulk.toFixed(0),
      cutting: cutting.toFixed(0),
      reverse: reverse.toFixed(0),
      maxHR: maxHR,
      bodyType,
      bmr: bmr.toFixed(0),
      tdee: tdee.toFixed(0),
    };
  }, [measurements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Fitness Toolbox</h1>
        <p className="text-sm text-[#f7f0df]/50">Advanced calculators powered by your body metrics</p>
      </div>

      {/* Input Section */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h2 className="text-lg font-bold mb-4">Your Measurements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Height (cm)</span>
            <input type="number" value={measurements.height} onChange={(e) => setMeasurements({ ...measurements, height: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Weight (kg)</span>
            <input type="number" value={measurements.weight} onChange={(e) => setMeasurements({ ...measurements, weight: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Age</span>
            <input type="number" value={measurements.age} onChange={(e) => setMeasurements({ ...measurements, age: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Body Fat %</span>
            <input type="number" value={measurements.bodyFat} onChange={(e) => setMeasurements({ ...measurements, bodyFat: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Wrist (cm)</span>
            <input type="number" value={measurements.wrist} onChange={(e) => setMeasurements({ ...measurements, wrist: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Waist (cm)</span>
            <input type="number" value={measurements.waist} onChange={(e) => setMeasurements({ ...measurements, waist: +e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
          </label>
        </div>
      </div>

      {/* Calculators Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Ideal Weight", value: `${calculations.idealWeight} kg`, sub: "Devine formula", color: "from-violet-300 to-fuchsia-400" },
          { label: "Body Type", value: calculations.bodyType, sub: "Somatotype", color: "from-[#d8b35a] to-orange-400" },
          { label: "Lean Body Mass", value: `${calculations.lbm} kg`, sub: "Muscle mass", color: "from-emerald-300 to-cyan-400" },
          { label: "FFMI", value: calculations.ffmi, sub: "Muscle index", color: "from-blue-300 to-sky-400" },
          { label: "Protein Need", value: `${calculations.protein} g/day`, sub: "For muscle gain", color: "from-orange-300 to-rose-400" },
          { label: "Water Need", value: `${calculations.water} L/day`, sub: "Daily hydration", color: "from-cyan-300 to-blue-400" },
          { label: "Lean Bulk", value: `${calculations.leanBulk} kcal`, sub: "Muscle gain", color: "from-[#d8b35a] to-orange-400" },
          { label: "Cutting", value: `${calculations.cutting} kcal`, sub: "Fat loss", color: "from-emerald-300 to-cyan-400" },
          { label: "Reverse Diet", value: `${calculations.reverse} kcal`, sub: "Metabolic repair", color: "from-blue-300 to-violet-400" },
          { label: "Max Heart Rate", value: `${calculations.maxHR} bpm`, sub: "Training zones", color: "from-rose-300 to-pink-400" },
        ].map((calc) => (
          <div key={calc.label} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f7f0df]/44">{calc.label}</p>
            <p className={`mt-3 bg-gradient-to-r ${calc.color} bg-clip-text text-3xl font-black text-transparent`}>{calc.value}</p>
            <p className="mt-1 text-xs text-[#f7f0df]/50">{calc.sub}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">BMR</p>
          <p className="mt-3 text-4xl font-black text-[#f7f0df]">{calculations.bmr}</p>
          <p className="text-xs text-[#f7f0df]/50">calories/day at rest</p>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">TDEE</p>
          <p className="mt-3 text-4xl font-black text-[#f7f0df]">{calculations.tdee}</p>
          <p className="text-xs text-[#f7f0df]/50">maintenance calories</p>
        </div>
        <div className="rounded-2xl border border-violet-200/20 bg-violet-200/10 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">BMI</p>
          <p className="mt-3 text-4xl font-black text-violet-100">{calculations.bmi}</p>
          <p className="text-xs text-violet-100/60">
            {parseFloat(calculations.bmi) < 18.5 ? "Underweight" : parseFloat(calculations.bmi) < 25 ? "Normal" : parseFloat(calculations.bmi) < 30 ? "Overweight" : "Obese"}
          </p>
        </div>
      </div>
    </div>
  );
}
