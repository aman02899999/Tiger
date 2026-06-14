import { useState, useMemo } from "react";
import { useAuth } from "../auth/AuthSystem";

export default function DietCalculator() {
  const { user } = useAuth();
  if (!user) return null;

  const [goal, setGoal] = useState(user.goal || "fat-loss");
  const [dietType, setDietType] = useState<"veg" | "nonveg" | "vegan">("veg");

  const calculations = useMemo(() => {
    const { height, weight, age, gender } = user;

    // BMR (Mifflin-St Jeor)
    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    // Activity multiplier (using moderate 1.55 as default)
    const tdee = bmr * 1.55;

    // Goal adjustments
    const calorieAdjustments: any = {
      "fat-loss": -500,
      "muscle-gain": 300,
      "wedding": -400,
      "maintenance": 0,
      "general": -200,
    };
    const targetCalories = tdee + (calorieAdjustments[goal] || 0);

    // Macros
    const protein = weight * 2; // 2g per kg
    const fat = (targetCalories * 0.25) / 9; // 25% from fat
    const carbs = (targetCalories - (protein * 4) - (fat * 9)) / 4;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      proteinCal: protein * 4,
      carbsCal: Math.round(carbs * 4),
      fatCal: Math.round(fat * 9),
    };
  }, [user, goal]);

  // Indian meal plans based on diet type and goal
  const mealPlans: any = {
    veg: {
      breakfast: [
        { name: "3 Egg whites + 1 toast + tea", kcal: 320, protein: 18, carbs: 45, fat: 8 },
        { name: "Oats + milk + banana + almonds", kcal: 380, protein: 15, carbs: 62, fat: 10 },
        { name: "Paneer bhurji + 2 roti", kcal: 420, protein: 24, carbs: 48, fat: 16 },
      ],
      midMorning: [
        { name: "1 apple + 10 almonds", kcal: 180, protein: 6, carbs: 20, fat: 10 },
        { name: "Sprouts chaat", kcal: 150, protein: 9, carbs: 22, fat: 3 },
        { name: "Greek yogurt + walnuts", kcal: 200, protein: 15, carbs: 12, fat: 10 },
      ],
      lunch: [
        { name: "2 roti + dal + paneer sabzi + salad", kcal: 580, protein: 28, carbs: 72, fat: 18 },
        { name: "Brown rice + rajma + curd + veggies", kcal: 520, protein: 22, carbs: 78, fat: 12 },
        { name: "Quinoa pulao + tofu + raita", kcal: 480, protein: 24, carbs: 65, fat: 14 },
      ],
      evening: [
        { name: "Green tea + roasted makhana", kcal: 120, protein: 4, carbs: 18, fat: 4 },
        { name: "Protein shake + banana", kcal: 240, protein: 25, carbs: 30, fat: 5 },
        { name: "Boiled eggs + black coffee", kcal: 160, protein: 12, carbs: 2, fat: 11 },
      ],
      dinner: [
        { name: "Grilled paneer + 1 roti + vegetables", kcal: 420, protein: 26, carbs: 38, fat: 18 },
        { name: "Chicken breast + 1 cup rice + salad", kcal: 480, protein: 38, carbs: 52, fat: 12 },
        { name: "Fish tikka + quinoa + veggies", kcal: 450, protein: 35, carbs: 42, fat: 16 },
      ],
      preBed: [
        { name: "1 cup warm milk with turmeric", kcal: 180, protein: 8, carbs: 12, fat: 10 },
        { name: "Casein protein + water", kcal: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Almonds (5) + warm water", kcal: 90, protein: 3, carbs: 3, fat: 7 },
      ],
    },
    nonveg: {
      breakfast: [
        { name: "4 egg bhurji + 1 toast + tea", kcal: 420, protein: 28, carbs: 32, fat: 18 },
        { name: "Oats + whey + banana + peanut butter", kcal: 450, protein: 32, carbs: 58, fat: 14 },
        { name: "Chicken keema + 2 roti", kcal: 480, protein: 35, carbs: 42, fat: 18 },
      ],
      midMorning: [
        { name: "Boiled eggs (3) + fruit", kcal: 240, protein: 18, carbs: 20, fat: 12 },
        { name: "Greek yogurt + berries + granola", kcal: 280, protein: 20, carbs: 32, fat: 8 },
        { name: "Protein bar + black coffee", kcal: 220, protein: 22, carbs: 24, fat: 8 },
      ],
      lunch: [
        { name: "Chicken curry + 2 roti + dal + salad", kcal: 680, protein: 42, carbs: 72, fat: 22 },
        { name: "Fish curry + brown rice + vegetables", kcal: 620, protein: 38, carbs: 68, fat: 20 },
        { name: "Egg bhurji + 3 roti + curd + salad", kcal: 580, protein: 32, carbs: 65, fat: 20 },
      ],
      evening: [
        { name: "Whey protein + banana + milk", kcal: 320, protein: 32, carbs: 38, fat: 8 },
        { name: "Chicken breast strips + veggies", kcal: 280, protein: 35, carbs: 12, fat: 10 },
        { name: "Tuna sandwich + green tea", kcal: 340, protein: 30, carbs: 35, fat: 10 },
      ],
      dinner: [
        { name: "Grilled chicken + 1 roti + vegetables", kcal: 520, protein: 42, carbs: 42, fat: 18 },
        { name: "Fish tikka + 1 cup rice + salad", kcal: 540, protein: 40, carbs: 52, fat: 16 },
        { name: "Egg curry + 2 roti + raita", kcal: 560, protein: 32, carbs: 58, fat: 22 },
      ],
      preBed: [
        { name: "Casein protein + milk", kcal: 200, protein: 30, carbs: 12, fat: 6 },
        { name: "Paneer cubes (50g) + warm water", kcal: 130, protein: 9, carbs: 2, fat: 10 },
        { name: "Almonds + walnuts + warm milk", kcal: 220, protein: 8, carbs: 8, fat: 18 },
      ],
    },
    vegan: {
      breakfast: [
        { name: "Oats + soy milk + banana + flaxseeds", kcal: 380, protein: 14, carbs: 62, fat: 10 },
        { name: "Tofu scramble + 2 roti + tea", kcal: 420, protein: 22, carbs: 48, fat: 16 },
        { name: "Smoothie: soy milk + peanut butter + dates", kcal: 440, protein: 18, carbs: 58, fat: 18 },
      ],
      midMorning: [
        { name: "Mixed nuts (30g) + fruit", kcal: 220, protein: 6, carbs: 22, fat: 14 },
        { name: "Hummus + veggie sticks", kcal: 180, protein: 6, carbs: 20, fat: 10 },
        { name: "Soy yogurt + granola", kcal: 240, protein: 12, carbs: 32, fat: 8 },
      ],
      lunch: [
        { name: "Tofu curry + brown rice + dal + salad", kcal: 580, protein: 28, carbs: 78, fat: 18 },
        { name: "Chana masala + 3 roti + curd (vegan)", kcal: 560, protein: 24, carbs: 82, fat: 14 },
        { name: "Quinoa + tempeh + vegetables + tahini", kcal: 620, protein: 30, carbs: 72, fat: 22 },
      ],
      evening: [
        { name: "Plant protein shake + banana", kcal: 260, protein: 24, carbs: 32, fat: 6 },
        { name: "Roasted chickpeas + green tea", kcal: 180, protein: 9, carbs: 24, fat: 6 },
        { name: "Edamame + sea salt", kcal: 160, protein: 14, carbs: 12, fat: 7 },
      ],
      dinner: [
        { name: "Grilled tofu + 2 roti + vegetables", kcal: 480, protein: 26, carbs: 52, fat: 18 },
        { name: "Lentil dal + brown rice + salad + chutney", kcal: 520, protein: 24, carbs: 78, fat: 12 },
        { name: "Tempeh stir-fry + quinoa", kcal: 540, protein: 28, carbs: 62, fat: 20 },
      ],
      preBed: [
        { name: "Soy milk + turmeric + dates", kcal: 180, protein: 8, carbs: 22, fat: 8 },
        { name: "Almond butter + warm water", kcal: 140, protein: 5, carbs: 6, fat: 12 },
        { name: "Mixed seeds (pumpkin, sunflower)", kcal: 160, protein: 8, carbs: 4, fat: 14 },
      ],
    },
  };

  const plan = mealPlans[dietType];
  const allMeals = [
    { time: "7:00 AM", meal: "Breakfast", items: plan.breakfast, icon: "🌅" },
    { time: "10:00 AM", meal: "Mid-Morning", items: plan.midMorning, icon: "🍎" },
    { time: "1:00 PM", meal: "Lunch", items: plan.lunch, icon: "🍛" },
    { time: "5:00 PM", meal: "Evening", items: plan.evening, icon: "☕" },
    { time: "8:00 PM", meal: "Dinner", items: plan.dinner, icon: "🌙" },
    { time: "10:00 PM", meal: "Pre-Bed", items: plan.preBed, icon: "😴" },
  ];

  // Calculate daily totals from first option of each meal
  const dailyTotals = allMeals.reduce((acc, m) => {
    const item = m.items[0];
    return {
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Auto Diet Calculator</h1>
          <p className="text-sm text-[#f7f0df]/50">Personalized Indian meal plans based on your goals</p>
        </div>
        <div className="flex gap-2">
          <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className="rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-2.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40">
            <option value="fat-loss">Fat Loss</option>
            <option value="muscle-gain">Muscle Gain</option>
            <option value="wedding">Wedding Prep</option>
            <option value="maintenance">Maintenance</option>
            <option value="general">General Fitness</option>
          </select>
          <select value={dietType} onChange={(e) => setDietType(e.target.value as any)} className="rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-2.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40">
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Daily Calories</p>
          <p className="mt-3 bg-gradient-to-r from-violet-200 to-fuchsia-400 bg-clip-text text-4xl font-black text-transparent">{calculations.targetCalories}</p>
          <p className="text-xs text-[#f7f0df]/50">kcal/day</p>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Protein</p>
          <p className="mt-3 bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">{calculations.protein}g</p>
          <p className="text-xs text-[#f7f0df]/50">{calculations.proteinCal} kcal ({Math.round((calculations.proteinCal / calculations.targetCalories) * 100)}%)</p>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Carbs</p>
          <p className="mt-3 bg-gradient-to-r from-[#d8b35a] to-orange-400 bg-clip-text text-4xl font-black text-transparent">{calculations.carbs}g</p>
          <p className="text-xs text-[#f7f0df]/50">{calculations.carbsCal} kcal ({Math.round((calculations.carbsCal / calculations.targetCalories) * 100)}%)</p>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Fat</p>
          <p className="mt-3 bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-4xl font-black text-transparent">{calculations.fat}g</p>
          <p className="text-xs text-[#f7f0df]/50">{calculations.fatCal} kcal ({Math.round((calculations.fatCal / calculations.targetCalories) * 100)}%)</p>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 text-lg font-bold">Macro Distribution</h3>
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-emerald-300">Protein</span>
              <span className="text-[#f7f0df]/60">{Math.round((calculations.proteinCal / calculations.targetCalories) * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f7f0df]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-400" style={{ width: `${(calculations.proteinCal / calculations.targetCalories) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-[#d8b35a]">Carbs</span>
              <span className="text-[#f7f0df]/60">{Math.round((calculations.carbsCal / calculations.targetCalories) * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f7f0df]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400" style={{ width: `${(calculations.carbsCal / calculations.targetCalories) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-rose-300">Fat</span>
              <span className="text-[#f7f0df]/60">{Math.round((calculations.fatCal / calculations.targetCalories) * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f7f0df]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-300 to-pink-400" style={{ width: `${(calculations.fatCal / calculations.targetCalories) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Plan */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Your Personalized Meal Plan</h3>
        {allMeals.map((mealData, i) => (
          <div key={i} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">{mealData.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">{mealData.time}</p>
                <h4 className="text-lg font-bold">{mealData.meal}</h4>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {mealData.items.map((item: any, j: number) => (
                <div key={j} className={`rounded-xl border p-4 transition hover:bg-[#f7f0df]/5 ${j === 0 ? "border-violet-200/30 bg-violet-200/10" : "border-[#f7f0df]/8"}`}>
                  {j === 0 && <span className="mb-2 inline-block rounded-full bg-violet-200/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-100">Recommended</span>}
                  <p className="text-sm font-semibold text-[#f7f0df]">{item.name}</p>
                  <div className="mt-3 space-y-1 text-xs text-[#f7f0df]/50">
                    <p>🔥 {item.kcal} kcal</p>
                    <p>💪 {item.protein}g protein</p>
                    <p>🌾 {item.carbs}g carbs</p>
                    <p>🥑 {item.fat}g fat</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Summary */}
      <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-6">
        <h3 className="text-lg font-bold">Daily Totals (Recommended Options)</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[#f7f0df]/50">Calories</p>
            <p className="text-2xl font-black text-[#f7f0df]">{dailyTotals.kcal}</p>
          </div>
          <div>
            <p className="text-xs text-[#f7f0df]/50">Protein</p>
            <p className="text-2xl font-black text-emerald-300">{dailyTotals.protein}g</p>
          </div>
          <div>
            <p className="text-xs text-[#f7f0df]/50">Carbs</p>
            <p className="text-2xl font-black text-[#d8b35a]">{dailyTotals.carbs}g</p>
          </div>
          <div>
            <p className="text-xs text-[#f7f0df]/50">Fat</p>
            <p className="text-2xl font-black text-rose-300">{dailyTotals.fat}g</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#f7f0df]/60">
          {dailyTotals.kcal > calculations.targetCalories 
            ? `⚠️ ${dailyTotals.kcal - calculations.targetCalories} kcal over target. Consider smaller portions.`
            : dailyTotals.kcal < calculations.targetCalories - 200
            ? `💡 ${calculations.targetCalories - dailyTotals.kcal} kcal under target. Add a snack.`
            : "✅ Perfect! You're right on target."}
        </p>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-6">
        <h3 className="mb-4 text-lg font-bold">💡 Pro Tips</h3>
        <ul className="space-y-2.5 text-sm text-[#f7f0df]/68">
          <li>• Eat protein within 30 minutes post-workout for optimal recovery</li>
          <li>• Drink 500ml water 30 minutes before each meal</li>
          <li>• Avoid eating 2-3 hours before bedtime</li>
          <li>• Track your meals daily for best results</li>
          <li>• Adjust portions based on hunger and energy levels</li>
          <li>• Consult a dietitian for personalized medical nutrition therapy</li>
        </ul>
      </div>
    </div>
  );
}
