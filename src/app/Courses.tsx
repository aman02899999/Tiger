import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthSystem';
import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

type Course = {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorBio: string;
  price: number;
  originalPrice: number;
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  emoji: string;
  category: string;
  description: string;
  outcomes: string[];
  curriculum: { week: string; topics: string[] }[];
  pdfUrl?: string;
  thumbnailUrl?: string;
  featured: boolean;
};

type Enrollment = {
  enrolledAt: string;
  courseId: string;
  pdfUrl?: string;
};

const DEFAULT_COURSES: Course[] = [
  {
    id: 'fitness-foundations',
    title: 'Fitness Foundations Certificate',
    subtitle: 'Build an unshakeable fitness base',
    emoji: '🌱',
    instructor: 'Coach Rahul Mehta',
    instructorBio: 'CSCS certified, 10 years coaching beginners to advanced athletes across India',
    price: 499,
    originalPrice: 4999,
    duration: '4 Weeks',
    lessons: 16,
    students: 2340,
    rating: 4.9,
    level: 'Beginner',
    category: 'Foundation',
    featured: false,
    description: 'Build an unshakeable base. Learn how the body moves, adapts, and grows. Master the fundamentals of exercise science, recovery, and healthy habits that every elite athlete relies on.',
    outcomes: ['Understand major muscle groups & anatomy', 'Design 3-day beginner workout plans', 'Apply progressive overload correctly', 'Master nutrition fundamentals', 'Build consistent fitness habits', 'Earn RFC Fitness Foundations Certificate'],
    curriculum: [
      { week: 'Week 1', topics: ['How the Body Works', 'Skeletal & muscular system', 'Joint mechanics'] },
      { week: 'Week 2', topics: ['Exercise Science', 'Progressive overload', 'Rep ranges & rest periods'] },
      { week: 'Week 3', topics: ['Nutrition Basics', 'Macros & micros', 'Indian diet fundamentals'] },
      { week: 'Week 4', topics: ['Habit Building', 'Sleep & recovery', 'Mock exam & certification'] },
    ],
  },
  {
    id: 'nutrition-certificate',
    title: 'Nutrition & Healthy Eating Certificate',
    subtitle: 'Master food science for Indian bodies',
    emoji: '🥗',
    instructor: 'Neha Kapoor, RD',
    instructorBio: 'Registered Dietitian with 10 years clinical experience, specializes in Indian sports nutrition',
    price: 499,
    originalPrice: 2999,
    duration: '4 Weeks',
    lessons: 20,
    students: 5120,
    rating: 4.8,
    level: 'Beginner',
    category: 'Nutrition',
    featured: false,
    description: 'Understand food at a molecular level. Build meal plans, decode labels, and learn the Indian diet science that powers elite performance. Dal, roti, paneer — optimised.',
    outcomes: ['Calculate calories & macros for any goal', 'Plan 7-day Indian meal plans', 'Understand vitamins & mineral deficiencies', 'Read food labels & marketing claims', 'Create sustainable eating habits', 'Support clients with nutrition guidance'],
    curriculum: [
      { week: 'Week 1', topics: ['Macronutrients', 'Proteins, carbs, fats', 'Indian food calorie guide'] },
      { week: 'Week 2', topics: ['Micronutrients', 'Vitamins & minerals', 'Common Indian deficiencies'] },
      { week: 'Week 3', topics: ['Meal Planning', 'Veg & non-veg plans', 'Budget nutrition India'] },
      { week: 'Week 4', topics: ['Applied Nutrition', 'Case studies', 'Certification exam'] },
    ],
  },
  {
    id: 'body-transformation',
    title: 'Body Transformation Blueprint',
    subtitle: 'Science-backed fat loss strategies',
    emoji: '🔥',
    instructor: 'Coach Rahul Mehta',
    instructorBio: 'CSCS certified, former competitive bodybuilder, helped 1000+ clients achieve transformation goals',
    price: 499,
    originalPrice: 4999,
    duration: '6 Weeks',
    lessons: 28,
    students: 7890,
    rating: 4.9,
    level: 'Beginner',
    category: 'Fat Loss',
    featured: true,
    description: 'The science behind how your body responds to training — from cellular adaptation to systemic changes. Design your own 12-week body transformation plan.',
    outcomes: ['Master fat loss physiology', 'Design 12-week transformation plans', 'Use HIIT & LISS protocols', 'Apply carb cycling techniques', 'Handle weight loss plateaus', 'Track body composition progress'],
    curriculum: [
      { week: 'Week 1-2', topics: ['Fat Loss Science', 'Metabolic rate', 'Caloric deficit math'] },
      { week: 'Week 3-4', topics: ['Training Protocols', 'HIIT vs LISS', 'Strength in deficit'] },
      { week: 'Week 5-6', topics: ['Advanced Nutrition', 'Carb cycling', 'Reverse dieting'] },
    ],
  },
  {
    id: 'cpt-cert',
    title: 'Certified Personal Trainer (CPT)',
    subtitle: 'Industry-recognized certification',
    emoji: '🏆',
    instructor: 'Dr. Amit Sharma',
    instructorBio: 'PhD in Exercise Science, 15 years experience, trained 500+ personal trainers',
    price: 2999,
    originalPrice: 7999,
    duration: '12 weeks',
    lessons: 48,
    students: 3240,
    rating: 4.9,
    level: 'Advanced',
    category: 'Certification',
    featured: true,
    description:
      'Become a certified personal trainer with our comprehensive CPT program. Covers anatomy, exercise physiology, program design, nutrition basics, and client management.',
    outcomes: [
      'Design personalized workout programs',
      'Understand human anatomy & physiology',
      'Apply progressive overload principles',
      'Handle client assessments & goal setting',
      'Build a successful PT business',
      'Pass national certification exams',
    ],
    curriculum: [
      { week: 'Week 1-2', topics: ['Anatomy & Kinesiology', 'Muscle groups and functions', 'Joint mechanics'] },
      { week: 'Week 3-4', topics: ['Exercise Physiology', 'Energy systems', 'VO2 max and training zones'] },
      { week: 'Week 5-6', topics: ['Program Design', 'Periodization models', 'Beginner to advanced programming'] },
      { week: 'Week 7-8', topics: ['Nutrition Fundamentals', 'Macronutrients', 'Meal timing for clients'] },
      { week: 'Week 9-10', topics: ['Client Assessment', 'Fitness testing', 'Goal setting frameworks'] },
      { week: 'Week 11-12', topics: ['Business & Ethics', 'Client retention', 'Mock exam preparation'] },
    ],
  },
  {
    id: 'nutrition-fundamentals',
    title: 'Nutrition Fundamentals',
    subtitle: 'Build your nutrition knowledge base',
    emoji: '🥗',
    instructor: 'Neha Kapoor, RD',
    instructorBio:
      'Registered Dietitian with 10 years clinical experience, specializes in sports nutrition and weight management',
    price: 999,
    originalPrice: 2999,
    duration: '6 weeks',
    lessons: 24,
    students: 8120,
    rating: 4.8,
    level: 'Beginner',
    category: 'Nutrition',
    featured: false,
    description:
      'Master the science of nutrition. Learn macros, micros, meal planning, and how food choices impact health and performance.',
    outcomes: [
      'Calculate calorie and macro needs',
      'Plan balanced meals for any goal',
      'Understand vitamins and minerals',
      'Read food labels effectively',
      'Create sustainable eating habits',
      'Support clients with nutrition guidance',
    ],
    curriculum: [
      { week: 'Week 1', topics: ['Macronutrients', 'Proteins, carbs, fats', 'Calorie counting basics'] },
      { week: 'Week 2', topics: ['Micronutrients', 'Vitamins & minerals', 'Deficiency signs'] },
      { week: 'Week 3', topics: ['Meal Planning', 'Portion control', 'Batch cooking'] },
      { week: 'Week 4', topics: ['Sports Nutrition', 'Pre/post workout nutrition', 'Hydration'] },
      { week: 'Week 5', topics: ['Weight Management', 'Deficit and surplus', 'Metabolic adaptation'] },
      { week: 'Week 6', topics: ['Practical Application', 'Case studies', 'Meal plan creation'] },
    ],
  },
  {
    id: 'fat-loss-specialist',
    title: 'Fat Loss Specialist Certification',
    subtitle: 'Science-backed fat loss strategies',
    emoji: '🔥',
    instructor: 'Coach Rahul Mehta',
    instructorBio: 'CSCS certified, former competitive bodybuilder, helped 1000+ clients achieve fat loss goals',
    price: 1999,
    originalPrice: 4999,
    duration: '8 weeks',
    lessons: 36,
    students: 5430,
    rating: 4.9,
    level: 'Intermediate',
    category: 'Certification',
    featured: true,
    description:
      'Deep dive into the science of fat loss. Learn metabolic programming, body recomposition, and how to design 6-12 week transformation programs.',
    outcomes: [
      'Master fat loss physiology',
      'Design 12-week transformation plans',
      'Use advanced cardio protocols',
      'Apply metabolic conditioning techniques',
      'Track and adjust based on biofeedback',
      'Handle weight loss plateaus',
    ],
    curriculum: [
      { week: 'Week 1-2', topics: ['Fat Loss Science', 'Metabolic rate', 'Hormonal factors'] },
      { week: 'Week 3-4', topics: ['Training for Fat Loss', 'HIIT vs LISS', 'Strength training in deficit'] },
      { week: 'Week 5-6', topics: ['Nutrition Strategies', 'Carb cycling', 'Protein sparing'] },
      { week: 'Week 7-8', topics: ['Advanced Protocols', 'Reverse dieting', 'Contest prep basics'] },
    ],
  },
  {
    id: 'muscle-hypertrophy',
    title: 'Muscle Building & Hypertrophy',
    subtitle: 'Evidence-based muscle building',
    emoji: '💪',
    instructor: 'Dr. Priya Singh',
    instructorBio: 'Sports scientist, published researcher in muscle hypertrophy, 12 years coaching athletes',
    price: 1499,
    originalPrice: 3999,
    duration: '8 weeks',
    lessons: 32,
    students: 4210,
    rating: 4.7,
    level: 'Intermediate',
    category: 'Training',
    featured: false,
    description:
      'Learn the science of muscle growth. From mechanical tension to metabolic stress, master every variable that drives hypertrophy.',
    outcomes: [
      'Understand muscle growth mechanisms',
      'Design hypertrophy-focused programs',
      'Apply volume and frequency principles',
      'Optimize rep ranges and rest periods',
      'Use advanced techniques like supersets',
      'Track muscle gain progress accurately',
    ],
    curriculum: [
      {
        week: 'Week 1-2',
        topics: ['Hypertrophy Science', 'Mechanical tension', 'Metabolic stress', 'Muscle damage'],
      },
      { week: 'Week 3-4', topics: ['Program Variables', 'Volume, frequency, intensity', 'Periodization'] },
      { week: 'Week 5-6', topics: ['Advanced Techniques', 'Drop sets, supersets', 'Partial reps'] },
      { week: 'Week 7-8', topics: ['Nutrition for Muscle', 'Protein synthesis', 'Surplus strategies'] },
    ],
  },
  {
    id: 'sports-nutrition-advanced',
    title: 'Sports Nutrition Advanced',
    subtitle: 'Elite-level nutrition science',
    emoji: '⚡',
    instructor: 'Dr. Vikram Nair',
    instructorBio: 'PhD Nutritional Biochemistry, consults for national sports teams, author of 3 books',
    price: 2499,
    originalPrice: 5999,
    duration: '10 weeks',
    lessons: 40,
    students: 2890,
    rating: 4.8,
    level: 'Advanced',
    category: 'Nutrition',
    featured: false,
    description:
      'Advanced sports nutrition for coaches and athletes. Cover supplementation, nutrient timing, ergogenic aids, and periodized nutrition.',
    outcomes: [
      'Master ergogenic aids and supplements',
      'Design periodized nutrition plans',
      'Understand gut health and performance',
      'Apply advanced nutrient timing',
      'Work with elite athletes',
      'Navigate WADA prohibited substances',
    ],
    curriculum: [
      { week: 'Week 1-2', topics: ['Advanced Macronutrients', 'Glycogen dynamics', 'Protein turnover'] },
      { week: 'Week 3-4', topics: ['Supplementation', 'Creatine, beta-alanine', 'Evidence-based guide'] },
      { week: 'Week 5-6', topics: ['Nutrient Timing', 'Intra-workout nutrition', 'Recovery protocols'] },
      { week: 'Week 7-8', topics: ['Gut Health', 'Microbiome and performance', 'Probiotics'] },
      { week: 'Week 9-10', topics: ['Elite Protocols', 'Sport-specific nutrition', 'Case studies'] },
    ],
  },
  {
    id: 'physio-rehab',
    title: 'Physio & Sports Rehabilitation Diploma',
    subtitle: 'Prevent & recover from injuries like a pro',
    emoji: '🦴',
    instructor: 'Dr. Priya Singh',
    instructorBio: 'Sports physiotherapist, 12 years treating national-level athletes and gym injuries',
    price: 999,
    originalPrice: 9999,
    duration: '8 Weeks',
    lessons: 36,
    students: 3210,
    rating: 4.8,
    level: 'Advanced',
    category: 'Physio',
    featured: false,
    description: 'Master the anatomy of injury prevention and sports rehabilitation. Learn how to assess, treat, and prevent common gym injuries using evidence-based protocols.',
    outcomes: ['Assess and diagnose common gym injuries', 'Design rehabilitation programs', 'Apply taping & bracing techniques', 'Prevent overuse injuries', 'Return athletes to performance safely', 'Earn Physio & Rehab Diploma'],
    curriculum: [
      { week: 'Week 1-2', topics: ['Injury Anatomy', 'Common gym injuries', 'Assessment protocols'] },
      { week: 'Week 3-4', topics: ['Rehabilitation Protocols', 'Progressive loading', 'Pain management'] },
      { week: 'Week 5-6', topics: ['Prevention Strategies', 'Warm-up science', 'Overuse prevention'] },
      { week: 'Week 7-8', topics: ['Return to Sport', 'Clearance criteria', 'Case studies & exam'] },
    ],
  },
  {
    id: 'elite-performance',
    title: 'Elite Performance & Fitness Master',
    subtitle: 'The complete coach certification',
    emoji: '👑',
    instructor: 'Dr. Vikram Nair',
    instructorBio: 'PhD Exercise Science, former Indian national team coach, author of 3 books on elite performance',
    price: 1499,
    originalPrice: 14999,
    duration: '16 Weeks',
    lessons: 64,
    students: 1890,
    rating: 4.9,
    level: 'Advanced',
    category: 'Certification',
    featured: true,
    description: 'The most comprehensive fitness certification in India. Master all aspects of coaching — programming, nutrition, psychology, business — and become an elite performance coach.',
    outcomes: ['Program for elite athletes', 'Master all energy systems', 'Apply sports psychology principles', 'Build a 6-figure coaching business', 'Design periodized annual plans', 'Earn RFC Elite Master Certification'],
    curriculum: [
      { week: 'Week 1-4', topics: ['Advanced Physiology', 'VO2 max', 'Energy systems', 'Lactate threshold'] },
      { week: 'Week 5-8', topics: ['Elite Programming', 'Periodization models', 'Sport-specific training'] },
      { week: 'Week 9-12', topics: ['Sports Nutrition', 'Supplementation', 'Nutrient timing protocols'] },
      { week: 'Week 13-16', topics: ['Coaching Business', 'Psychology', 'Client systems', 'Final exam'] },
    ],
  },
  {
    id: 'sports-medicine',
    title: 'Sports Medicine & Physio Expert',
    subtitle: 'Medical-grade sports care knowledge',
    emoji: '🏥',
    instructor: 'Dr. Amit Sharma',
    instructorBio: 'MBBS + Sports Medicine, 15 years treating pro athletes, India national team doctor',
    price: 1499,
    originalPrice: 14999,
    duration: '12 Weeks',
    lessons: 48,
    students: 1240,
    rating: 4.8,
    level: 'Advanced',
    category: 'Medicine',
    featured: false,
    description: 'Bridge the gap between fitness coaching and sports medicine. Learn from a national team doctor how to identify, manage, and refer sports injuries with confidence.',
    outcomes: ['Identify red-flag medical conditions', 'Understand sports pharmacology', 'Manage acute sports injuries', 'Coordinate with medical professionals', 'Apply blood biomarker knowledge', 'Earn Sports Medicine Expert Certificate'],
    curriculum: [
      { week: 'Week 1-3', topics: ['Sports Medicine Foundations', 'Anatomy', 'Pathophysiology'] },
      { week: 'Week 4-6', topics: ['Acute Injury Management', 'RICE protocol', 'Emergency response'] },
      { week: 'Week 7-9', topics: ['Chronic Conditions', 'Overtraining syndrome', 'Female athlete triad'] },
      { week: 'Week 10-12', topics: ['Blood Biomarkers', 'Lab tests interpretation', 'Final exam'] },
    ],
  },
];

function getLevelColor(level: Course['level']) {
  if (level === 'Beginner') return 'bg-green-500/20 text-green-400 border border-green-500/30';
  if (level === 'Intermediate') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border border-red-500/30';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-[#f7f0df]/60 ml-1">{rating}</span>
    </span>
  );
}

function CourseCard({
  course,
  enrolled,
  onClick,
}: {
  course: Course;
  enrolled: boolean;
  onClick: () => void;
}) {
  const savings = course.originalPrice - course.price;
  const savingsPct = Math.round((savings / course.originalPrice) * 100);

  return (
    <div
      onClick={onClick}
      className="relative bg-[#0f0a1a] border border-violet-900/30 rounded-2xl overflow-hidden cursor-pointer group hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300"
    >
      {course.featured && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Featured
        </div>
      )}
      {enrolled && (
        <div className="absolute top-3 left-3 z-10 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Enrolled
        </div>
      )}
      <div className="h-32 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/30 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
        {course.emoji}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
          <span className="text-[10px] text-[#f7f0df]/40 bg-white/5 px-2 py-0.5 rounded-full">
            {course.category}
          </span>
        </div>
        <h3 className="text-[#f7f0df] font-bold text-sm leading-tight group-hover:text-violet-300 transition-colors">
          {course.title}
        </h3>
        <p className="text-[#f7f0df]/50 text-xs">{course.instructor}</p>
        <div className="flex items-center gap-3 text-[10px] text-[#f7f0df]/40">
          <span>{course.duration}</span>
          <span>•</span>
          <span>{course.lessons} lessons</span>
          <span>•</span>
          <span>{course.students.toLocaleString()} students</span>
        </div>
        <StarRating rating={course.rating} />
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-violet-900/20">
          <div className="flex items-center gap-2">
            <span className="text-violet-400 font-bold text-base">₹{course.price.toLocaleString()}</span>
            <span className="text-[#f7f0df]/30 text-xs line-through">₹{course.originalPrice.toLocaleString()}</span>
            <span className="text-green-400 text-[10px] font-semibold">{savingsPct}% off</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold transition-all duration-200 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
        >
          {enrolled ? 'View Course' : 'Enroll Now'}
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  course,
  onConfirm,
  onCancel,
  loading,
}: {
  course: Course;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0a1a] border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{course.emoji}</div>
          <h3 className="text-[#f7f0df] font-bold text-lg">Complete Payment</h3>
          <p className="text-[#f7f0df]/50 text-sm mt-1">{course.title}</p>
        </div>
        <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-[#f7f0df]/60 text-xs mb-1">Amount to Pay</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            ₹{course.price.toLocaleString()}
          </p>
          <p className="text-green-400 text-xs mt-1">
            You save ₹{(course.originalPrice - course.price).toLocaleString()}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 mb-5">
          <p className="text-[#f7f0df]/60 text-xs font-semibold mb-2 uppercase tracking-wider">Pay via UPI</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center text-lg">
              📲
            </div>
            <div>
              <p className="text-[#f7f0df] text-sm font-semibold">tigerfit@upi</p>
              <p className="text-[#f7f0df]/40 text-xs">Scan or pay via any UPI app</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-violet-700/40 text-[#f7f0df]/60 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
        <p className="text-center text-[#f7f0df]/30 text-[10px] mt-3">
          By confirming, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}

function CourseDetailModal({
  course,
  enrollment,
  onClose,
  onEnroll,
  enrolling,
}: {
  course: Course;
  enrollment: Enrollment | null;
  onClose: () => void;
  onEnroll: () => void;
  enrolling: boolean;
}) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const savings = course.originalPrice - course.price;
  const savingsPct = Math.round((savings / course.originalPrice) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0b0714] border border-violet-800/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b0714]/95 backdrop-blur-sm border-b border-violet-900/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{course.emoji}</span>
            <div>
              <h2 className="text-[#f7f0df] font-bold text-base leading-tight">{course.title}</h2>
              <p className="text-[#f7f0df]/50 text-xs">{course.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#f7f0df]/60 hover:text-[#f7f0df] transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Duration', value: course.duration, icon: '⏱️' },
              { label: 'Lessons', value: course.lessons, icon: '📚' },
              { label: 'Students', value: course.students.toLocaleString(), icon: '👥' },
              { label: 'Rating', value: course.rating, icon: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-[#f7f0df] font-bold text-sm">{stat.value}</div>
                <div className="text-[#f7f0df]/40 text-[10px]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Level & Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
            <span className="text-xs text-[#f7f0df]/40 bg-white/5 px-3 py-1 rounded-full">{course.category}</span>
            <StarRating rating={course.rating} />
          </div>

          {/* Description */}
          <div>
            <h3 className="text-[#f7f0df] font-semibold text-sm mb-2">About This Course</h3>
            <p className="text-[#f7f0df]/60 text-sm leading-relaxed">{course.description}</p>
          </div>

          {/* Outcomes */}
          <div>
            <h3 className="text-[#f7f0df] font-semibold text-sm mb-3">What You'll Learn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {course.outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2 bg-violet-900/10 rounded-lg p-2.5">
                  <span className="text-green-400 mt-0.5 text-sm flex-shrink-0">✓</span>
                  <span className="text-[#f7f0df]/70 text-xs leading-relaxed">{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <h3 className="text-[#f7f0df] font-semibold text-sm mb-3">Curriculum</h3>
            <div className="flex flex-col gap-2">
              {course.curriculum.map((item, i) => (
                <div key={i} className="border border-violet-900/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-[#f7f0df] text-xs font-semibold">{item.week}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f7f0df]/40 text-[10px]">{item.topics.length} topics</span>
                      <svg
                        className={`w-4 h-4 text-violet-400 transition-transform duration-200 ${expandedWeek === i ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedWeek === i && (
                    <div className="px-4 pb-3 pt-1 bg-black/20 flex flex-col gap-1.5">
                      {item.topics.map((topic, j) => (
                        <div key={j} className="flex items-center gap-2 text-[#f7f0df]/60 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                          {topic}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructor */}
          <div className="bg-gradient-to-r from-violet-900/20 to-fuchsia-900/10 border border-violet-800/30 rounded-xl p-4">
            <h3 className="text-[#f7f0df] font-semibold text-sm mb-3">Your Instructor</h3>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl flex-shrink-0">
                👤
              </div>
              <div>
                <p className="text-[#f7f0df] font-semibold text-sm">{course.instructor}</p>
                <p className="text-[#f7f0df]/55 text-xs mt-1 leading-relaxed">{course.instructorBio}</p>
              </div>
            </div>
          </div>

          {/* Enrollment CTA */}
          {enrollment ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="text-green-400 font-semibold text-sm">You're enrolled!</p>
                  <p className="text-[#f7f0df]/40 text-xs">
                    Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              {enrollment.pdfUrl || course.pdfUrl ? (
                <a
                  href={enrollment.pdfUrl || course.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-semibold transition-all duration-200"
                >
                  <span>📄</span> Download Course PDF
                </a>
              ) : (
                <div className="flex items-center gap-2 text-[#f7f0df]/50 text-sm bg-white/5 rounded-xl py-2.5 px-4 justify-center">
                  <span>📧</span>
                  <span>PDF will be emailed to you</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-violet-900/30 to-fuchsia-900/20 border border-violet-700/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[#f7f0df]/60 text-xs mb-1">Course Price</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-violet-400">₹{course.price.toLocaleString()}</span>
                    <span className="text-[#f7f0df]/30 text-sm line-through">
                      ₹{course.originalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 text-center">
                  <p className="text-green-400 font-bold text-sm">{savingsPct}% OFF</p>
                  <p className="text-green-400/70 text-[10px]">Save ₹{savings.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={onEnroll}
                disabled={enrolling}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Enroll Now — Pay ₹{course.price.toLocaleString()}</>
                )}
              </button>
              <p className="text-center text-[#f7f0df]/30 text-[10px] mt-2">30-day money-back guarantee</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelFilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (v: 'All' | 'Beginner' | 'Intermediate' | 'Advanced') => void;
}) {
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {levels.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            active === lvl
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]'
              : 'bg-white/5 text-[#f7f0df]/50 hover:bg-white/10 hover:text-[#f7f0df]/80'
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}

function CourseGrid({
  courses,
  enrollments,
  onSelect,
}: {
  courses: Course[];
  enrollments: Record<string, Enrollment>;
  onSelect: (c: Course) => void;
}) {
  if (courses.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🎓</div>
        <p className="text-[#f7f0df]/50 text-sm">No courses found for this filter.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          enrolled={!!enrollments[course.id]}
          onClick={() => onSelect(course)}
        />
      ))}
    </div>
  );
}

// ─── CoursesSection (named export — for landing page) ────────────────────────

export function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [selected, setSelected] = useState<Course | null>(null);
  const [levelFilter, setLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  // Load courses from Firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        collection(db, 'courses'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
            setCourses(data);
          }
        },
        () => { setCourses(DEFAULT_COURSES); }
      );
    } catch {
      setCourses(DEFAULT_COURSES);
    }
    return () => unsub?.();
  }, []);

  const filtered = levelFilter === 'All' ? courses : courses.filter((c) => c.level === levelFilter);

  return (
    <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#07040d]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">Courses & Certifications</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#f7f0df] mb-3">
            Level Up Your{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Fitness Career
            </span>
          </h2>
          <p className="text-[#f7f0df]/50 text-base max-w-xl mx-auto">
            Industry-recognized certifications and courses taught by world-class instructors.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <LevelFilterTabs active={levelFilter} onChange={setLevelFilter} />
          <p className="text-[#f7f0df]/30 text-xs">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Grid */}
        <CourseGrid courses={filtered} enrollments={{}} onSelect={setSelected} />
        <div className="text-center mt-10">
          <a href="#app" className="inline-block bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold px-8 py-3 rounded-xl transition-all">
            Sign In to Enroll →
          </a>
        </div>
      </div>

      {selected && (
        <CourseDetailModal
          course={selected}
          enrollment={null}
          onClose={() => setSelected(null)}
          onEnroll={() => { window.location.hash = "#app"; }}
          enrolling={false}
        />
      )}
    </section>
  );
}

// ─── CoursesPage (default export — for SaaS app) ─────────────────────────────

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [selected, setSelected] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({});
  const [levelFilter, setLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [showModal, setShowModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my-courses'>('all');

  // Load courses from Firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        collection(db, 'courses'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
            setCourses(data);
          }
        },
        () => {
          setCourses(DEFAULT_COURSES);
        }
      );
    } catch {
      setCourses(DEFAULT_COURSES);
    }
    return () => unsub?.();
  }, []);

  // Load enrollments
  useEffect(() => {
    if (!user?.id) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        collection(db, 'courseEnrollments', user.id, 'courses'),
        (snap) => {
          const map: Record<string, Enrollment> = {};
          snap.docs.forEach((d) => {
            map[d.id] = d.data() as Enrollment;
          });
          setEnrollments(map);
        },
        () => {}
      );
    } catch {}
    return () => unsub?.();
  }, [user?.id]);

  const filtered = levelFilter === 'All' ? courses : courses.filter((c) => c.level === levelFilter);

  const enrolledCourses = courses.filter((c) => !!enrollments[c.id]);

  const handleEnroll = () => {
    if (!user) return;
    setShowModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      const enrollment: Enrollment = {
        enrolledAt: new Date().toISOString(),
        courseId: selected.id,
        ...(selected.pdfUrl ? { pdfUrl: selected.pdfUrl } : {}),
      };
      await setDoc(doc(db, 'courseEnrollments', user.id, 'courses', selected.id), enrollment);
      setEnrollments((prev) => ({ ...prev, [selected.id]: enrollment }));
      setPaymentDone(true);
      setShowModal(false);
    } catch (err) {
      console.error('Enrollment failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df]">
      {/* Page Header */}
      <div className="bg-gradient-to-b from-[#0b0714] to-[#07040d] border-b border-violet-900/20 px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">
              TigerFit Pro Academy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Courses & Certifications
            </span>
          </h1>
          <p className="text-[#f7f0df]/50 text-sm max-w-xl">
            Advance your fitness career with world-class certifications and courses.
          </p>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 bg-white/5 rounded-xl p-1 w-fit">
            {(['all', 'my-courses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'text-[#f7f0df]/50 hover:text-[#f7f0df]/80'
                }`}
              >
                {tab === 'all' ? 'All Courses' : `My Courses${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'all' ? (
          <>
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <LevelFilterTabs active={levelFilter} onChange={setLevelFilter} />
              <p className="text-[#f7f0df]/30 text-xs">
                {filtered.length} course{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <CourseGrid courses={filtered} enrollments={enrollments} onSelect={setSelected} />
          </>
        ) : (
          /* My Courses */
          enrolledCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-5">🎓</div>
              <h3 className="text-[#f7f0df] font-bold text-xl mb-2">No Enrollments Yet</h3>
              <p className="text-[#f7f0df]/40 text-sm mb-6 max-w-xs">
                Browse our courses and enroll to start your fitness education journey.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[#f7f0df]/40 text-sm mb-2">
                You are enrolled in {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}.
              </p>
              {enrolledCourses.map((course) => {
                const enrollment = enrollments[course.id];
                return (
                  <div
                    key={course.id}
                    className="bg-[#0f0a1a] border border-violet-900/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-900/60 to-fuchsia-900/40 flex items-center justify-center text-3xl flex-shrink-0">
                      {course.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-[#f7f0df] font-bold text-base leading-tight">{course.title}</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getLevelColor(course.level)}`}
                        >
                          {course.level}
                        </span>
                      </div>
                      <p className="text-[#f7f0df]/50 text-xs mb-1">{course.instructor}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#f7f0df]/35">
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span>{course.lessons} lessons</span>
                        <span>•</span>
                        <span>
                          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => setSelected(course)}
                        className="px-4 py-2 rounded-xl border border-violet-700/40 text-violet-400 text-xs font-semibold hover:bg-violet-900/20 transition-colors"
                      >
                        View Details
                      </button>
                      {enrollment.pdfUrl || course.pdfUrl ? (
                        <a
                          href={enrollment.pdfUrl || course.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                        >
                          <span>📄</span> Download PDF
                        </a>
                      ) : (
                        <div className="px-4 py-2 rounded-xl bg-white/5 text-[#f7f0df]/40 text-xs flex items-center gap-1.5">
                          <span>📧</span> PDF via Email
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Course Detail Modal */}
      {selected && !showModal && (
        <CourseDetailModal
          course={selected}
          enrollment={enrollments[selected.id] || null}
          onClose={() => { setSelected(null); setPaymentDone(false); }}
          onEnroll={handleEnroll}
          enrolling={loading}
        />
      )}

      {/* Payment Modal */}
      {selected && showModal && (
        <PaymentModal
          course={selected}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowModal(false)}
          loading={loading}
        />
      )}

      {/* Success Toast */}
      {paymentDone && (
        <div className="fixed bottom-6 right-6 z-[70] bg-green-900/90 border border-green-500/40 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-4">
          <span className="text-green-400 text-xl">✅</span>
          <div>
            <p className="text-green-400 font-semibold text-sm">Enrollment Successful!</p>
            <p className="text-[#f7f0df]/50 text-xs">Check your email for course materials.</p>
          </div>
          <button
            onClick={() => setPaymentDone(false)}
            className="ml-3 text-[#f7f0df]/30 hover:text-[#f7f0df]/60 text-sm"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
