// Admin Panel Types
export type User = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Elite";
  joinDate: string;
  status: "Active" | "Suspended";
  workoutStreak: number;
};

export type Feature = {
  id: string;
  title: string;
  tag: string;
  desc: string;
  category: "ai" | "india" | "health" | "social" | "other";
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating: number;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

export type FAQItem = {
  id: string;
  q: string;
  a: string;
};

export type HowItWorksStep = {
  id: string;
  step: string;
  title: string;
  desc: string;
  icon: string;
};

export type HeroStat = {
  id: string;
  number: string;
  label: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  joinedDate: string;
  source: string;
};

export type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

// Default Data
export const defaultFeatures: Feature[] = [
  { id: "f1", title: "Energy Prediction Engine", tag: "82% energy", desc: "Every morning shows Today's Energy and adjusts workouts using sleep, recovery, stress, workload, and nutrition.", category: "ai" },
  { id: "f2", title: "Smart Indian Food Scanner", tag: "India first", desc: "Photo scan for roti, dal, rice, sabzi, paneer, and common Indian meals with calories and macros.", category: "india" },
  { id: "f3", title: "Grocery Budget Planner", tag: "Budget smart", desc: "Create monthly grocery lists for INR 3000, 5000, 8000, or 12000 budgets.", category: "india" },
  { id: "f4", title: "Cheapest Protein Finder", tag: "Cost per gram", desc: "Rank eggs, soya chunks, milk, paneer, chicken, and whey by cost per gram protein.", category: "india" },
  { id: "f5", title: "Wedding Mode", tag: "120 day plan", desc: "Select wedding in 120 days and generate a full transformation roadmap.", category: "india" },
  { id: "f6", title: "Health Risk Prediction", tag: "Disclaimer ready", desc: "Estimate obesity, diabetes, and blood pressure risk with clear medical disclaimer.", category: "health" },
  { id: "f7", title: "Accountability Partner AI", tag: "Daily coach", desc: "Daily check-ins that say what was missed and how to fix it today without guilt.", category: "social" },
];

export const defaultTestimonials: Testimonial[] = [
  { id: "t1", name: "Rahul Sharma", role: "Lost 18kg in 4 months", text: "The wedding mode changed everything. I had 90 days before my wedding and the app built a complete roadmap.", avatar: "RS", rating: 5 },
  { id: "t2", name: "Priya Mehta", role: "IT Professional, Mumbai", text: "Indian food scanner is insane. I just snap roti-sabzi-dal and it tells me exact protein, carbs, fat.", avatar: "PM", rating: 5 },
  { id: "t3", name: "Arjun Kapoor", role: "Gym Enthusiast, Delhi", text: "Gym crowd predictor actually works. I now go during low-traffic hours.", avatar: "AK", rating: 5 },
  { id: "t4", name: "Ananya Singh", role: "Homemaker, Jaipur", text: "Family health dashboard is a game changer. I track my kids nutrition, husband fitness, and parents health all in one place.", avatar: "AS", rating: 5 },
];

export const defaultPricingPlans: PricingPlan[] = [
  { id: "p1", name: "Free", price: "₹0", period: "forever", description: "Start your transformation journey", features: ["Basic workout tracking", "Simple calorie counter", "5 AI sessions/month", "Community access"], cta: "Get Started Free", popular: false },
  { id: "p2", name: "Pro", price: "₹199", period: "/month", description: "For serious transformations", features: ["Unlimited AI coaching", "Indian food scanner", "Energy prediction engine", "All 28+ Life Coach features", "Progress recognition AI", "Accountability partner"], cta: "Start Pro Trial", popular: true },
  { id: "p3", name: "Elite Family", price: "₹399", period: "/month", description: "Complete household coverage", features: ["Everything in Pro", "Up to 8 family members", "Medical report analyzer", "Voice fitness coach", "Wedding mode + Travel mode", "Priority support"], cta: "Go Elite", popular: false },
];

export const defaultFAQs: FAQItem[] = [
  { id: "fa1", q: "Is Tiger Fitness Pro free?", a: "Basic features are free forever. Premium Elite membership unlocks AI coaching, medical report analysis, family dashboard, wedding mode, voice coach, and 28+ advanced features starting at ₹199/month." },
  { id: "fa2", q: "How does Indian food scanner work?", a: "Our AI model was trained specifically on common Indian dishes — roti, dal, rice, sabzi, paneer, idli, dosa, biryani, and more. Just take a photo and get calories, protein, carbs, and fat estimates instantly." },
  { id: "fa3", q: "What is Energy Prediction Engine?", a: "Every morning, we analyze your sleep quality, stress levels, recent training load, nutrition, and recovery status. We give you a Today's Energy percentage and automatically adjust your workout intensity accordingly." },
];

export const defaultHowItWorks: HowItWorksStep[] = [
  { id: "h1", step: "01", title: "Download & Set Up", desc: "Sign up in 30 seconds. Enter your goal, current stats, and lifestyle data. The Tiger Life Coach learns you instantly.", icon: "🐅" },
  { id: "h2", step: "02", title: "Get Your AI Plan", desc: "Receive personalized workout, nutrition, sleep, hydration, and stress management plan — every morning, adjusted for today's energy.", icon: "🧠" },
  { id: "h3", step: "03", title: "Scan & Track", desc: "Snap photos of Indian food for instant macros. Log workouts, sleep, and moods. The AI adapts in real time.", icon: "📸" },
  { id: "h4", step: "04", title: "Transform Together", desc: "Watch your Tiger Score climb. Unlock achievements. Share family health dashboard. Reach your goal with an accountability partner AI.", icon: "🏆" },
];

export const defaultHeroStats: HeroStat[] = [
  { id: "hs1", number: "50K+", label: "Active Users" },
  { id: "hs2", number: "28", label: "AI Features" },
  { id: "hs3", number: "4.9★", label: "Play Store Rating" },
  { id: "hs4", number: "99%", label: "Uptime SLA" },
];

export const defaultUsers: User[] = [
  { id: "u1", name: "Aarav Patel", email: "aarav@gmail.com", plan: "Elite", joinDate: "2025-01-15", status: "Active", workoutStreak: 47 },
  { id: "u2", name: "Ishaan Reddy", email: "ishaan@gmail.com", plan: "Pro", joinDate: "2025-02-22", status: "Active", workoutStreak: 23 },
  { id: "u3", name: "Diya Sharma", email: "diya@gmail.com", plan: "Pro", joinDate: "2025-03-10", status: "Active", workoutStreak: 15 },
  { id: "u4", name: "Vihaan Kumar", email: "vihaan@gmail.com", plan: "Free", joinDate: "2025-04-05", status: "Active", workoutStreak: 8 },
  { id: "u5", name: "Ananya Gupta", email: "ananya@gmail.com", plan: "Elite", joinDate: "2025-05-12", status: "Suspended", workoutStreak: 0 },
];

export const defaultSubscribers: NewsletterSubscriber[] = [
  { id: "ns1", email: "rahul@example.com", joinedDate: "2025-06-01", source: "Blog CTA" },
  { id: "ns2", email: "priya@example.com", joinedDate: "2025-06-05", source: "Newsletter Section" },
  { id: "ns3", email: "arjun@example.com", joinedDate: "2025-06-08", source: "Blog CTA" },
];

// Storage Helpers
const STORAGE_KEYS = {
  blogs: "tfp_blogs",
  features: "tfp_features",
  testimonials: "tfp_testimonials",
  pricingPlans: "tfp_pricing_plans",
  faqs: "tfp_faqs",
  howItWorks: "tfp_how_it_works",
  heroStats: "tfp_hero_stats",
  users: "tfp_users",
  subscribers: "tfp_subscribers",
};

export function loadData<T>(key: keyof typeof STORAGE_KEYS, defaultData: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    return stored ? JSON.parse(stored) : defaultData;
  } catch {
    return defaultData;
  }
}

export function saveData<T>(key: keyof typeof STORAGE_KEYS, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
