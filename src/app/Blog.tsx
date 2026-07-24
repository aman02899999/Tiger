import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Blog — a feed of trending fitness, nutrition & wellness posts with  */
/* a searchable/filterable list and an in-place reader. Content is     */
/* client-side. No SVG.                                                */
/* ---------------------------------------------------------------- */

interface Post {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  read: string;
  trending?: boolean;
  excerpt: string;
  body: string[];
}

const POSTS: Post[] = [
  { id: "p1", title: "5 Habits of People Who Stay Fit for Life", category: "Motivation", author: "Coach Aditi", date: "Jul 2026", read: "5 min", trending: true, excerpt: "The lifelong-fit don't rely on willpower — they build systems. Here are the five habits they share.", body: ["The people who stay fit for decades rarely have more motivation than everyone else. What they have is better systems. They make the healthy choice the default choice.", "First, they train consistently rather than intensely — showing up three or four times a week for years beats brutal month-long sprints. Second, they prioritize protein and vegetables at most meals without obsessing over perfection.", "Third, they walk daily. Fourth, they protect their sleep like an appointment. And fifth, they never miss twice in a row — one skipped session is human, two becomes a pattern.", "None of these are extreme. That's exactly why they last."] },
  { id: "p2", title: "Why Protein Is the Most Important Macro", category: "Nutrition", author: "Dr. Meera", date: "Jul 2026", read: "6 min", trending: true, excerpt: "If you fix one thing in your diet, make it protein. Here's the science of why it matters most.", body: ["Protein is the building block of muscle, and unlike carbs or fat, your body can't store it — so you need a steady daily supply. For active people, 1.6–2.2 g per kg of bodyweight is the sweet spot.", "Beyond muscle, protein is the most satiating macronutrient, keeping you full longer and making fat loss easier. It also has the highest thermic effect, meaning you burn more calories digesting it.", "Spread it across three or four meals for the best results, prioritizing whole-food sources like eggs, dairy, chicken, fish, paneer, and legumes.", "Get protein right and the rest of your nutrition becomes dramatically easier."] },
  { id: "p3", title: "The Truth About Spot Reduction", category: "Fitness", author: "Coach Rahul", date: "Jul 2026", read: "4 min", trending: true, excerpt: "Can you burn fat from just your belly with crunches? The science has a clear answer.", body: ["It's one of the most persistent fitness myths: do enough crunches and you'll melt belly fat. Unfortunately, spot reduction doesn't work that way.", "When you lose fat, your body draws from fat stores all over — and where you lose it first is largely determined by genetics, not the muscle you're training. Crunches build abdominal muscle but don't preferentially burn the fat sitting on top of it.", "The real path to visible abs is an overall calorie deficit, adequate protein, and full-body strength training — plus patience.", "Train your core for strength and function, but chase fat loss with your whole approach."] },
  { id: "p4", title: "Morning Routines That Actually Work", category: "Wellness", author: "Anjali S.", date: "Jun 2026", read: "5 min", trending: true, excerpt: "Forget the 5am cold-plunge hype. Here's a realistic morning routine anyone can keep.", body: ["The internet loves elaborate morning routines, but the best routine is the one you'll actually do. Complexity is the enemy of consistency.", "Start simple: hydrate with a glass of water, get some natural light early to anchor your body clock, and move for even ten minutes. These three habits alone improve energy and mood.", "Add a few minutes of planning or meditation if it suits you. The goal isn't a perfect two-hour ritual — it's a repeatable sequence that sets a good tone.", "Build it one habit at a time and let it compound."] },
  { id: "p5", title: "How Much Cardio Do You Really Need?", category: "Fitness", author: "Coach Rahul", date: "Jun 2026", read: "6 min", excerpt: "The surprisingly modest amount of cardio that delivers most of the health benefits.", body: ["Public-health guidelines suggest around 150 minutes of moderate cardio a week — and most of the benefits appear at even lower amounts. You don't need to run marathons to be healthy.", "A mix of low-intensity work (like brisk walking or Zone 2) and a little higher-intensity training covers most bases. Low-intensity builds your aerobic base with minimal fatigue; higher intensity improves peak fitness.", "For fat loss, cardio is a tool to increase energy expenditure, but it works best alongside strength training and a good diet — not as a substitute.", "Consistency at a sustainable dose beats heroic efforts you can't maintain."] },
  { id: "p6", title: "The Beginner's Guide to Reading Food Labels", category: "Nutrition", author: "Dr. Meera", date: "Jun 2026", read: "5 min", excerpt: "Cut through marketing spin and understand what's actually in your food.", body: ["Food packaging is designed to sell, not to inform. Learning to read the label puts you back in control.", "Start with the serving size — many 'low-calorie' claims hide behind tiny portions. Then check protein, fiber, added sugars, and the ingredient list, which is ordered by quantity.", "Be wary of health halos like 'natural' or 'made with real fruit', which are largely unregulated marketing. The nutrition panel and ingredient list tell the real story.", "A few seconds of label-reading can transform your grocery cart."] },
  { id: "p7", title: "Yoga for People Who Can't Touch Their Toes", category: "Yoga", author: "Priya Yoga", date: "Jun 2026", read: "5 min", trending: true, excerpt: "Flexibility is a result of yoga, not a requirement to start. Here's how to begin.", body: ["The single biggest myth about yoga is that you need to be flexible to start. In reality, flexibility is something yoga builds — not a prerequisite.", "Begin with gentle, foundational poses and use props freely. Blocks, straps, and bolsters make poses accessible and are used by practitioners at every level.", "Focus on the breath and on how a pose feels rather than how it looks. Consistency of even ten minutes a day steadily improves your range.", "Everyone starts stiff. Starting is the only requirement."] },
  { id: "p8", title: "Understanding the Ayurvedic Doshas", category: "Ayurveda", author: "Vaidya Sharma", date: "May 2026", read: "7 min", trending: true, excerpt: "Vata, Pitta, and Kapha — a beginner-friendly introduction to your constitution.", body: ["Ayurveda describes three functional energies, or doshas, present in everyone in a unique ratio: Vata (air and ether), Pitta (fire and water), and Kapha (earth and water).", "Vata governs movement, Pitta governs transformation and digestion, and Kapha governs structure and stability. Your dominant dosha shapes your tendencies — and imbalance in it is thought to drive discomfort.", "The practical value is personalization: a Pitta type benefits from cooling foods and calm, while a Kapha type thrives on stimulation and lighter meals.", "Understanding your constitution is the first step to Ayurvedic self-care."] },
  { id: "p9", title: "Sleep: The Ultimate Performance Enhancer", category: "Wellness", author: "Dr. Meera", date: "May 2026", read: "6 min", trending: true, excerpt: "No supplement or gadget beats a good night's sleep for recovery and results.", body: ["If sleep were a supplement, it would be the best-selling product in the world. Muscle repair, hormone balance, and mental clarity all depend on it.", "Chronically sleeping under six hours blunts recovery, increases hunger hormones, and impairs decision-making — quietly sabotaging your training and diet.", "Improve it with consistency: the same sleep and wake times daily, a cool dark room, morning light, and cutting caffeine 8–10 hours before bed.", "Prioritize sleep and everything else in your health improves alongside it."] },
  { id: "p10", title: "Strength Training Myths for Women, Busted", category: "Fitness", author: "Coach Aditi", date: "May 2026", read: "6 min", excerpt: "No, lifting weights won't make you bulky. Here's what it actually does.", body: ["The fear of getting 'bulky' keeps many women away from the very training that would benefit them most. The biology simply doesn't support the fear.", "Women have far lower testosterone than men, making large muscle gains slow and deliberate. Lifting builds strength, shape, and tone, boosts bone density, and revs metabolism.", "It's also protective: resistance training reduces osteoporosis risk and keeps you strong and capable as you age.", "Pick up the weights — the results are strength and confidence, not bulk."] },
  { id: "p11", title: "The Real Science of Fat Loss", category: "Nutrition", author: "Dr. Meera", date: "May 2026", read: "7 min", excerpt: "Beyond the fads, fat loss comes down to a few unglamorous but reliable principles.", body: ["Every diet that works does so by creating an energy deficit — you're burning more than you consume. Keto, fasting, and low-fat all just achieve this differently.", "A sustainable deficit of 15–20% below maintenance, high protein to preserve muscle, and resistance training to signal your body to keep muscle is the reliable formula.", "Aim for around 0.25–0.5 kg of loss per week. Faster tends to cost you muscle and rarely lasts.", "Fat loss isn't mysterious — it's consistency applied to simple principles over time."] },
  { id: "p12", title: "Why You Should Track Your Workouts", category: "Fitness", author: "Coach Rahul", date: "Apr 2026", read: "4 min", excerpt: "If you're not writing it down, you're leaving progress on the table.", body: ["Progressive overload — doing a little more over time — is the engine of every result. But you can't beat last week's numbers if you don't remember them.", "A simple log of your sets, reps, and weights turns vague effort into a concrete target. It reveals whether you're actually progressing or just spinning your wheels.", "Tracking also keeps you honest and motivated: seeing months of steady improvement is one of the best motivators there is.", "Whether it's an app or a notebook, log your training and watch your progress accelerate."] },
  { id: "p13", title: "Hydration: How Much Water Is Enough?", category: "Nutrition", author: "Anjali S.", date: "Apr 2026", read: "4 min", excerpt: "Forget the rigid eight-glasses rule — here's a smarter way to hydrate.", body: ["The famous 'eight glasses a day' is a rough guideline, not a law. Real hydration needs vary with body size, activity, climate, and diet.", "A useful starting point is around 30–35 ml per kg of bodyweight, adjusted up for heat and exercise. Pale-yellow urine is a reliable sign you're well hydrated.", "Remember that food — especially fruits and vegetables — contributes significant water, and during heavy sweating you also need electrolytes, not just water.", "Listen to your body and drink consistently through the day rather than chugging all at once."] },
  { id: "p14", title: "Meditation for Beginners: Start Here", category: "Wellness", author: "Priya Yoga", date: "Apr 2026", read: "5 min", excerpt: "You don't need to empty your mind — you just need to begin. A simple starting guide.", body: ["Meditation is simple but not always easy: it's the practice of training attention. The most common misconception is that you must stop all thoughts. You won't — and that's fine.", "Start with just three to five minutes. Sit comfortably, focus on your breath, and when your mind wanders, gently return to it. That returning is the practice itself.", "Anchor it to an existing habit — right after brushing your teeth, for instance — so it becomes automatic.", "Consistency matters far more than duration. A few minutes daily changes more than an hour once a month."] },
  { id: "p15", title: "The Best Exercises for a Strong Back", category: "Fitness", author: "Coach Rahul", date: "Apr 2026", read: "6 min", excerpt: "A strong back improves posture, protects your spine, and completes your physique.", body: ["A well-developed back supports good posture, protects your spine, and balances all the pressing most people do. Yet it's often undertrained because you can't see it in the mirror.", "The foundations are rows (dumbbell, barbell, cable) and vertical pulls (pull-ups and lat pulldowns). Together they hit the lats, mid-back, and rear delts.", "Focus on initiating from the back rather than yanking with the arms, and control the lowering phase for full benefit.", "Train your back at least as much as your chest for a balanced, resilient body."] },
  { id: "p16", title: "Intermittent Fasting: Does It Work?", category: "Nutrition", author: "Dr. Meera", date: "Mar 2026", read: "6 min", excerpt: "A balanced look at the popular eating pattern and who it actually suits.", body: ["Intermittent fasting — cycling between eating and fasting windows — has become hugely popular. But it's not magic; it works mainly by making it easier to eat fewer calories.", "For some people, a shorter eating window naturally reduces snacking and simplifies the day. For others, it leads to overeating in the window or low energy for training.", "There's nothing inherently superior about fasting for fat loss if calories and protein are matched. It's a tool, not a rule.", "If it fits your life and helps you eat well, use it. If it makes you miserable, it isn't necessary."] },
  { id: "p17", title: "Turmeric: Golden Spice or Overhyped?", category: "Ayurveda", author: "Vaidya Sharma", date: "Mar 2026", read: "5 min", excerpt: "Separating the traditional wisdom and modern evidence on turmeric.", body: ["Turmeric has been central to Ayurvedic and Indian cooking for millennia, valued for its warming, cleansing qualities. Its active compound, curcumin, has drawn real scientific interest for anti-inflammatory effects.", "The catch is absorption: curcumin is poorly absorbed on its own. Pairing it with black pepper and a little fat — as in traditional golden milk — dramatically improves uptake.", "It's a wonderful daily addition to food and warm drinks, but it's a supportive spice, not a miracle cure.", "Enjoy it the traditional way, with pepper and fat, and keep expectations realistic."] },
  { id: "p18", title: "Building Muscle After 40", category: "Fitness", author: "Coach Aditi", date: "Mar 2026", read: "6 min", excerpt: "It's absolutely possible to build strength and muscle later in life. Here's how.", body: ["Muscle-building doesn't stop at 40 — the principles just matter even more. Resistance training becomes essential for preserving muscle, bone density, and independence with age.", "Recovery is the main variable to respect: you may need a bit more time between hard sessions and to warm up more thoroughly. Prioritize protein and sleep.", "Progressive overload still works; you can get meaningfully stronger at any age. Consistency and joint-friendly technique are your allies.", "It's never too late to start — the body responds to training throughout life."] },
  { id: "p19", title: "The Gut-Brain Connection Explained", category: "Wellness", author: "Dr. Meera", date: "Feb 2026", read: "6 min", excerpt: "Your gut and brain are in constant conversation — and it affects how you feel.", body: ["The trillions of microbes in your gut do far more than digest food; they communicate with your brain via the gut-brain axis, influencing mood, stress, and even cravings.", "A diverse, fiber-rich diet feeds beneficial bacteria, while fermented foods like yogurt and kimchi add live cultures. A healthy microbiome is linked to better mood and resilience.", "Ultra-processed diets and unnecessary antibiotics can reduce microbial diversity, which is increasingly tied to poorer wellbeing.", "Feeding your gut well is one of the more underrated pillars of feeling good."] },
  { id: "p20", title: "How to Break a Weight-Loss Plateau", category: "Nutrition", author: "Coach Aditi", date: "Feb 2026", read: "6 min", excerpt: "The scale stopped moving? Here's why — and what actually works to restart progress.", body: ["Plateaus are normal physiology, not failure. As you lose weight, your smaller body burns fewer calories and unconscious movement often drops, shrinking your deficit.", "First, recalculate your calories for your new weight, and tighten up tracking — 'bites and licks' add up. Then consider adding steps rather than slashing calories dangerously low.", "A one-to-two-week diet break at maintenance can also restore hormones and adherence, making the next phase more effective.", "Plateaus are a signal to adjust, not to quit."] },
  { id: "p21", title: "Foam Rolling: Worth the Hype?", category: "Fitness", author: "Coach Rahul", date: "Feb 2026", read: "4 min", excerpt: "What foam rolling can and can't do for your recovery and mobility.", body: ["Foam rolling is popular for good reason — it can reduce the feeling of muscle tightness and soreness and briefly improve range of motion before training.", "What it doesn't do is 'break up' fascia or permanently lengthen muscle, despite common claims. Its benefits are largely neurological — it changes how tight a muscle feels.", "Used as a warm-up primer or a soothing post-session routine, it's a useful, low-cost tool. Just don't expect it to replace strength, mobility, or recovery basics.", "Roll if it feels good and helps you move — but keep it in perspective."] },
  { id: "p22", title: "The Simple Math of Portion Control", category: "Nutrition", author: "Anjali S.", date: "Jan 2026", read: "5 min", excerpt: "No scales, no apps — use your hand to portion balanced meals anywhere.", body: ["You don't need to weigh food to eat well. The hand-portion method uses your own hand as a built-in, always-available measuring tool.", "A palm of protein, a fist of vegetables, a cupped hand of carbs, and a thumb of fats makes a balanced plate. Because hand size scales with body size, portions self-adjust to the person.", "It's perfect for restaurants, travel, or anyone who finds tracking tedious. Adjust the number of portions up or down based on your goal.", "Simple, portable, and surprisingly accurate — no gadgets required."] },
  { id: "p23", title: "Why Rest Days Make You Stronger", category: "Fitness", author: "Coach Aditi", date: "Jan 2026", read: "4 min", excerpt: "You don't grow in the gym — you grow while recovering from it.", body: ["It feels counterintuitive, but you don't build muscle during a workout — you build it while recovering afterward. Training is the stimulus; recovery is when adaptation happens.", "Skipping rest days leads to accumulated fatigue, stalled progress, and higher injury risk. More is not always better; better is better.", "Rest doesn't mean lying on the couch — light activity, walking, and mobility (active recovery) can actually help. But hard sessions need genuine recovery between them.", "Respect your rest days as part of the training, not a break from it."] },
  { id: "p24", title: "Ashwagandha and Adaptogens 101", category: "Ayurveda", author: "Vaidya Sharma", date: "Jan 2026", read: "6 min", excerpt: "What adaptogens are, what the evidence says, and how to use them wisely.", body: ["Adaptogens are herbs traditionally used to help the body resist stress. Ashwagandha is the most famous, prized in Ayurveda for building strength and calm.", "Modern research associates ashwagandha with reduced cortisol and improved measures of strength and sleep in some studies — promising, though not a cure-all.", "It's typically taken as a root powder or standardized extract, often in the evening for sleep and recovery.", "As with any supplement, quality varies and it can interact with medications — consult a professional, especially if pregnant or on thyroid or sedative drugs."] },
  { id: "p25", title: "The Best Warm-Up for Any Workout", category: "Fitness", author: "Coach Rahul", date: "Jan 2026", read: "5 min", excerpt: "Ten minutes that boost performance and cut injury risk — don't skip it.", body: ["A good warm-up isn't wasted time — it's an investment in a better, safer session. It raises your body temperature, primes your nervous system, and prepares your joints.", "Start with a few minutes of light cardio to get warm, then dynamic mobility (leg swings, arm circles, hip openers) rather than long static stretches.", "Finish with a couple of progressively heavier warm-up sets of your first exercise to groove the pattern.", "Ten focused minutes here protects months of progress."] },
  { id: "p26", title: "Managing Stress with Your Breath", category: "Wellness", author: "Priya Yoga", date: "Dec 2025", read: "5 min", excerpt: "Your breath is a free, always-available remote control for your stress levels.", body: ["Breathing is the one part of your autonomic nervous system you can consciously control, making it a direct lever on stress. A few minutes of deliberate breathing can shift you out of fight-or-flight.", "Lengthening the exhale relative to the inhale activates the body's calming response. Techniques like box breathing (4-4-4-4) steady you before stressful moments.", "The physiological sigh — a double inhale followed by a long exhale — is one of the fastest ways to reduce acute stress.", "Practice a little daily so the tools are ready when you need them most."] },
  { id: "p27", title: "Creatine: The Most Proven Supplement", category: "Nutrition", author: "Dr. Meera", date: "Dec 2025", read: "5 min", excerpt: "Safe, cheap, and effective — why creatine earns its place in your routine.", body: ["Amid a sea of overhyped supplements, creatine monohydrate stands out as one of the most researched and reliably effective — for strength, power, and muscle recovery.", "It works by helping your muscles regenerate energy during high-intensity effort. Three to five grams daily is enough; there's no need to 'load' unless you want faster saturation.", "It's safe for the vast majority of healthy people and remarkably inexpensive. Staying well hydrated is the main practical tip.", "If you train hard, creatine is one of the few supplements genuinely worth taking."] },
  { id: "p28", title: "Desk Job? Undo the Damage of Sitting", category: "Wellness", author: "Anjali S.", date: "Dec 2025", read: "5 min", excerpt: "Practical fixes for the aches and stiffness of a screen-bound workday.", body: ["Sitting itself isn't evil — sitting still for hours is the problem. The body craves variety of position, and long static postures create tension and stiffness.", "Set a reminder to stand, walk, or stretch every 30–45 minutes. Even a minute of movement resets circulation and muscle tension.", "Set your workstation up well — screen at eye level, elbows around 90 degrees, feet flat — and counter-stretch the chest and hip flexors, which shorten from sitting.", "Movement variety, not a single 'perfect' posture, is the real fix."] },
  { id: "p29", title: "How to Eat Out and Stay on Track", category: "Nutrition", author: "Coach Aditi", date: "Nov 2025", read: "5 min", excerpt: "Enjoy restaurants and social meals without derailing your goals.", body: ["No successful long-term approach requires avoiding restaurants. With a few simple strategies, you can enjoy them guilt-free.", "Check the menu ahead and pick a protein-forward option before you're hungry and surrounded by choices. Build the plate around protein and vegetables, then enjoy some of the indulgent parts.", "Be intentional with liquid calories and bottomless extras, which add up fast without filling you up.", "And remember: one meal never undoes weeks of consistency. Enjoy it, then return to your routine."] },
  { id: "p30", title: "The Power of a Daily Walk After Meals", category: "Wellness", author: "Dr. Meera", date: "Nov 2025", read: "4 min", trending: true, excerpt: "A short post-meal walk is a tiny habit with outsized benefits.", body: ["One of the simplest, most effective health habits is also one of the easiest: a short walk after meals. Even ten to fifteen minutes makes a difference.", "Walking after eating helps blunt the post-meal blood-sugar spike, as your muscles use some of that glucose. Over time this supports better metabolic health.", "It also aids digestion, adds to your daily step count and NEAT, and offers a mental reset — a small pause in a busy day.", "Try attaching it to lunch or dinner and let this tiny habit compound."] },
  { id: "p31", title: "Beginner Mistakes That Stall Progress", category: "Fitness", author: "Coach Rahul", date: "Nov 2025", read: "6 min", excerpt: "The common early mistakes that quietly hold newcomers back — and how to avoid them.", body: ["Most beginner frustration comes down to a handful of avoidable mistakes. The first is program-hopping — switching plans every couple of weeks before any could work.", "The second is ego-lifting: chasing heavy weights with poor form, which stalls progress and invites injury. Master technique first and add load slowly.", "The third is neglecting protein and sleep, then wondering why results are slow. Recovery is where progress actually happens.", "Pick a sensible plan, run it consistently, eat and sleep well, and progress becomes almost inevitable."] },
  { id: "p32", title: "Seasonal Eating the Ayurvedic Way", category: "Ayurveda", author: "Vaidya Sharma", date: "Oct 2025", read: "5 min", excerpt: "Aligning your diet with the seasons for balance and wellbeing.", body: ["Ayurveda teaches Ritucharya — adjusting your diet and lifestyle to the changing seasons to stay in balance and prevent the imbalances each season tends to provoke.", "In summer, favor cooling, hydrating foods; in winter, warm, nourishing, and grounding meals; in spring, lighter, bitter foods to counter heaviness.", "This isn't rigid dogma — it mirrors what fresh, seasonal produce naturally offers throughout the year.", "Eating with the seasons is a simple, intuitive way to bring Ayurvedic wisdom into modern life."] },
];

const CATEGORIES = ["All", "Fitness", "Nutrition", "Wellness", "Yoga", "Ayurveda", "Motivation"];
const CAT_COLOR: Record<string, string> = { Fitness: "#f97316", Nutrition: "#059669", Wellness: "#0284c7", Yoga: "#fb923c", Ayurveda: "#16a34a", Motivation: "#ea580c" };

// Relevant Unsplash photos per category (same image source the app uses elsewhere).
const photo = (id: string, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
const CAT_IMG: Record<string, string[]> = {
  Fitness: ["photo-1571019613454-1cb2f99b2d8b", "photo-1541534741688-6078c6bfb5c5", "photo-1517963879433-6ad2b056d712", "photo-1534438327276-14e5300c3a48"],
  Nutrition: ["photo-1512621776951-a57141f2eefd", "photo-1490645935967-10de6ba17061", "photo-1466637574441-749b8f19452f", "photo-1498837167922-ddd27525d352"],
  Wellness: ["photo-1506126613408-eca07ce68773", "photo-1544367567-0f2fcb009e0b", "photo-1499209974431-9dddcece7f88", "photo-1447452001602-7090c7ab2db3"],
  Yoga: ["photo-1518310383802-640c2de311b2", "photo-1544367567-0f2fcb009e0b", "photo-1552196563-55cd4e45efb3"],
  Ayurveda: ["photo-1447452001602-7090c7ab2db3", "photo-1466637574441-749b8f19452f", "photo-1512428813834-c702c7702b78"],
  Motivation: ["photo-1434682881908-b43d0467b798", "photo-1571019613454-1cb2f99b2d8b", "photo-1476480862126-209bfaa8edc8"],
};
// Deterministic per-post pick so an image stays stable for a given post.
function imgFor(p: Post): string {
  const arr = CAT_IMG[p.category] ?? CAT_IMG.Fitness;
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) & 0xffff;
  return photo(arr[h % arr.length]);
}

export default function BlogPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Post | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return POSTS.filter((p) => (cat === "All" || p.category === cat) && (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)));
  }, [cat, query]);

  const trending = POSTS.filter((p) => p.trending);

  if (open) {
    const color = CAT_COLOR[open.category] ?? "#f97316";
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-orange-700 hover:text-orange-700">← Back to blog</button>

        {/* Interactive hero image — click to zoom */}
        <button type="button" onClick={() => setZoom(imgFor(open))} className="group relative block h-56 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950 to-amber-950 sm:h-72">
          <img src={imgFor(open)} alt={open.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/85 via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">🔍 Tap to zoom</span>
        </button>

        {/* Lightbox */}
        {zoom && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setZoom(null)}>
            <img src={imgFor(open)} alt={open.title} className="max-h-[90vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button type="button" onClick={() => setZoom(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/15 text-lg text-white backdrop-blur">✕</button>
          </div>
        )}

        <article className="glass-card rounded-2xl p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${color}22`, color }}>{open.category}</span>
            {open.trending && <span className="rounded-full bg-[#ea580c]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ea580c]">🔥 Trending</span>}
            <span className="text-[11px] text-[#2a1e16]/55">{open.read} read</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">{open.title}</h1>
          <p className="mt-2 text-xs text-[#2a1e16]/55">By {open.author} · {open.date}</p>
          <div className="mt-5 space-y-4">
            {open.body.map((p, i) => <p key={i} className="text-[15px] leading-relaxed text-[#2a1e16]/82">{p}</p>)}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">The Titan Blog</h1>
        <p className="text-sm text-[#2a1e16]/68">Trending reads on fitness, nutrition, wellness & Ayurveda — {POSTS.length} posts</p>
      </div>

      {/* Trending strip */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">🔥 Trending now</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {trending.map((p) => (
            <button key={p.id} type="button" onClick={() => setOpen(p)} className="group w-60 shrink-0 overflow-hidden rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 text-left transition hover:border-orange-200/30">
              <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-orange-950 to-amber-950">
                <img src={imgFor(p)} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/75 to-transparent" />
              </div>
              <div className="p-3">
                <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: CAT_COLOR[p.category] }}>{p.category}</span>
                <p className="mt-1 line-clamp-2 text-sm font-black leading-tight">{p.title}</p>
                <p className="mt-1 text-[11px] text-[#2a1e16]/55">{p.read} · {p.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => {
          const color = CAT_COLOR[p.category] ?? "#f97316";
          return (
            <button key={p.id} type="button" onClick={() => setOpen(p)} className="group glass-card overflow-hidden rounded-2xl text-left transition hover:-translate-y-0.5 hover:border-orange-200/30">
              <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-orange-950 to-amber-950">
                <img src={imgFor(p)} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/70 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur" style={{ background: `${color}33`, color }}>{p.category}</span>
                {p.trending && <span className="absolute right-3 top-3 rounded-full bg-[#ea580c]/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#ea580c] backdrop-blur">🔥 Trending</span>}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[11px] text-[#2a1e16]/55">
                  <span>{p.read}</span><span>·</span><span>{p.date}</span>
                </div>
                <h3 className="mt-2 text-lg font-black leading-tight">{p.title}</h3>
                <p className="mt-1.5 text-sm text-[#2a1e16]/62">{p.excerpt}</p>
                <p className="mt-3 text-[11px] text-[#2a1e16]/50">By {p.author}</p>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="glass-card rounded-2xl p-8 text-center text-sm text-[#2a1e16]/60">No posts match your search.</p>}
      </div>
    </div>
  );
}
