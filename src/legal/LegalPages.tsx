import { useState } from "react";

type LegalType = "terms" | "privacy" | "refund" | "disclaimer" | "help";

const legalContent: Record<LegalType, { title: string; updated: string; sections: Array<{ h: string; p: string[] }> }> = {
  terms: {
    title: "Terms of Service",
    updated: "June 15, 2025",
    sections: [
      { h: "1. Acceptance of Terms", p: ["By accessing or using Tiger Fitness Pro (\"the Service\"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.", "These terms apply to all users, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content."] },
      { h: "2. Description of Service", p: ["Tiger Fitness Pro provides AI-powered fitness coaching, nutrition tracking, workout planning, and family health management as a Software-as-a-Service (SaaS) platform.", "We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice."] },
      { h: "3. Account Responsibilities", p: ["You are responsible for maintaining the confidentiality of your account credentials.", "You agree to accept responsibility for all activities that occur under your account.", "You must notify us immediately of any unauthorized use of your account."] },
      { h: "4. Subscription & Payments", p: ["Free tier access is available indefinitely with limited features.", "Paid subscriptions (Pro, Elite) are billed monthly or annually in advance.", "Refunds are handled per our Refund Policy. Auto-renewal can be cancelled anytime from Settings."] },
      { h: "5. Health Disclaimer", p: ["The Service provides wellness guidance, not medical advice. Always consult qualified medical professionals before starting any fitness or diet program.", "Tiger Fitness Pro is not liable for injuries, health issues, or outcomes resulting from use of the Service."] },
      { h: "6. User Content", p: ["You retain ownership of content you upload (photos, progress data).", "By uploading, you grant us a license to use content solely for providing and improving the Service."] },
      { h: "7. Termination", p: ["We may terminate or suspend your account for violations of these Terms.", "You may delete your account anytime from Settings > Privacy."] },
      { h: "8. Contact", p: ["For questions about these Terms, email legal@tigerfitpro.in or write to Tiger Fitness Pro, Bengaluru, Karnataka, India."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "June 15, 2025",
    sections: [
      { h: "1. Information We Collect", p: ["Account information: name, email, phone, date of birth.", "Health & fitness data: weight, height, body measurements, workout logs, food intake, sleep patterns.", "Device information: device type, OS version, IP address, app usage analytics."] },
      { h: "2. How We Use Your Data", p: ["To provide personalized AI coaching and fitness recommendations.", "To process subscription payments via secure third-party processors.", "To send transactional emails and optional marketing communications.", "To improve our AI models using anonymized, aggregated data."] },
      { h: "3. Data Sharing", p: ["We do NOT sell your personal data to third parties.", "We share minimal necessary data with payment processors (Razorpay, Stripe).", "Analytics providers (Google Analytics, Mixpanel) receive anonymized data only."] },
      { h: "4. Data Storage & Security", p: ["All data is encrypted at rest (AES-256) and in transit (TLS 1.3).", "Data is stored on Indian servers (compliant with DPDP Act 2023).", "We conduct regular security audits and penetration testing."] },
      { h: "5. Your Rights", p: ["Access: Request a copy of all your data anytime.", "Rectification: Update or correct inaccurate information.", "Erasure: Request account deletion from Settings > Privacy.", "Portability: Export all your data in JSON format.", "Withdraw consent for marketing communications anytime."] },
      { h: "6. Children's Privacy", p: ["The Service is intended for users aged 16 and above.", "We do not knowingly collect data from children under 16. If discovered, we delete such data immediately."] },
      { h: "7. Changes to This Policy", p: ["We will notify you of material changes via email or in-app notification at least 30 days before they take effect."] },
      { h: "8. Contact", p: ["Privacy concerns? Email privacy@tigerfitpro.in or write to our Data Protection Officer at Tiger Fitness Pro, Bengaluru, Karnataka, India."] },
    ],
  },
  refund: {
    title: "Refund Policy",
    updated: "June 15, 2025",
    sections: [
      { h: "1. Free Trial", p: ["New Pro and Elite subscribers receive a 7-day free trial.", "No charges are applied during the trial period.", "You may cancel anytime during the trial without any obligation."] },
      { h: "2. Monthly Subscriptions", p: ["Monthly subscriptions are non-refundable once charged.", "You retain access until the end of the current billing cycle.", "Cancel anytime to prevent future charges."] },
      { h: "3. Annual Subscriptions", p: ["Annual plans are eligible for a full refund within 14 days of purchase.", "After 14 days, prorated refunds are available for unused months minus a 10% processing fee.", "Contact support@tigerfitpro.in within the window for refund requests."] },
      { h: "4. Exceptional Cases", p: ["Technical failures preventing Service use: full refund available.", "Accidental duplicate charges: refunded within 5-7 business days.", "Service downtime exceeding 24 hours: prorated credit applied."] },
      { h: "5. How to Request a Refund", p: ["Email support@tigerfitpro.in with your account email and reason.", "Include transaction ID from your payment confirmation.", "Refunds are processed within 7-10 business days to original payment method."] },
      { h: "6. No Refund Scenarios", p: ["After free trial conversion (unless within 14-day window for annual).", "For accounts suspended due to Terms violations.", "For partial months of monthly subscriptions."] },
    ],
  },
  disclaimer: {
    title: "Medical Disclaimer",
    updated: "June 15, 2025",
    sections: [
      { h: "1. Not Medical Advice", p: ["Tiger Fitness Pro provides general wellness and fitness guidance only.", "The Service is NOT a substitute for professional medical advice, diagnosis, or treatment.", "Always seek the advice of your physician or qualified health provider with any questions regarding a medical condition."] },
      { h: "2. Health Predictions", p: ["Features like Health Risk Prediction, Metabolic Age, and Injury Risk Predictor are wellness screening tools only.", "These features use general algorithms and DO NOT constitute medical diagnosis.", "Any elevated risk scores should be discussed with your doctor, not acted upon independently."] },
      { h: "3. Medical Report Analysis", p: ["AI explanations of blood tests and medical reports are for educational purposes only.", "We are not licensed medical professionals and cannot interpret your results clinically.", "Always consult your doctor for actual medical interpretation and decisions."] },
      { h: "4. Diet & Nutrition", p: ["Diet recommendations are general guidelines. Individual nutritional needs vary.", "Consult a registered dietitian for personalized medical nutrition therapy.", "If you have conditions like diabetes, PCOS, or thyroid disorders, work with your doctor on diet changes."] },
      { h: "5. Exercise Safety", p: ["Stop any exercise that causes pain, dizziness, or discomfort.", "Consult your doctor before starting any new exercise program, especially if you have heart conditions, joint issues, or are pregnant.", "Tiger Fitness Pro is not liable for injuries during exercise."] },
      { h: "6. Reporting Issues", p: ["If you experience any adverse effects from following our recommendations, stop immediately and consult a healthcare professional.", "Report any concerns to safety@tigerfitpro.in."] },
    ],
  },
  help: {
    title: "Help Center",
    updated: "June 15, 2025",
    sections: [
      { h: "Getting Started", p: ["Create your free account and complete the onboarding wizard.", "Set your fitness goal: fat loss, muscle gain, wedding prep, or general fitness.", "Enter your body metrics for personalized AI recommendations.", "Explore workouts, nutrition tracking, and habit building features."] },
      { h: "Subscription & Billing", p: ["Free plan: Basic features with 5 AI sessions/month.", "Pro plan (₹199/mo): Unlimited AI, food scanner, wedding mode.", "Elite plan (₹399/mo): Family dashboard, medical analyzer, voice coach.", "Payment methods: UPI, Credit/Debit Cards, Net Banking via Razorpay."] },
      { h: "AI Food Scanner", p: ["Open Nutrition tab → Tap 'Open Scanner'.", "Take a clear photo of your meal (Indian food optimized).", "AI estimates calories, protein, carbs, and fat in seconds.", "Adjust portions manually if needed for accuracy."] },
      { h: "Wedding Mode", p: ["Available on Pro and Elite plans.", "Set your wedding date to generate a 120-day transformation roadmap.", "Includes personalized diet, workouts, and progress milestones.", "Receive weekly check-ins and plan adjustments."] },
      { h: "Family Dashboard", p: ["Elite plan feature supporting up to 8 family members.", "Each member gets personalized recommendations based on age and goals.", "View everyone's health overview from a single dashboard.", "Perfect for tracking kids' nutrition and parents' wellness."] },
      { h: "Contact Support", p: ["Email: support@tigerfitpro.in (response within 24 hours)", "Live chat: Available in-app for Pro and Elite members", "Help articles: Browse this help center anytime", "Community: Join our Discord for peer support"] },
    ],
  },
};

export default function LegalPage({ type, onBack }: { type: LegalType; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const content = legalContent[type];

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df]">
      <header className="border-b border-[#f7f0df]/10 bg-[#0b0714]/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#f7f0df]/60 hover:text-[#f7f0df]">
            ← Back to Tiger Fitness Pro
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">TF</div>
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">Tiger Fitness Pro</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">{type === "help" ? "Help Center" : "Legal"}</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em]">{content.title}</h1>
        <p className="mt-3 text-sm text-[#f7f0df]/50">Last updated: {content.updated}</p>

        {type === "help" && (
          <div className="mt-8 rounded-2xl border border-[#f7f0df]/12 bg-[#f7f0df]/5 px-5 py-3 flex items-center gap-3">
            <span>🔍</span>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#f7f0df]/30" />
          </div>
        )}

        <div className="mt-12 space-y-10">
          {content.sections
            .filter((s) => !query || s.h.toLowerCase().includes(query.toLowerCase()) || s.p.some((p) => p.toLowerCase().includes(query.toLowerCase())))
            .map((section, i) => (
              <div key={i} className="border-t border-[#f7f0df]/10 pt-6">
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[#f7f0df]">{section.h}</h2>
                <div className="mt-4 space-y-3">
                  {section.p.map((paragraph, j) => (
                    <p key={j} className="text-base leading-7 text-[#f7f0df]/70">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-16 rounded-2xl border border-violet-200/20 bg-violet-200/8 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100">Need more help?</p>
          <h3 className="mt-2 text-xl font-bold">Contact our support team</h3>
          <p className="mt-1 text-sm text-[#f7f0df]/60">We typically respond within 24 hours.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="mailto:support@tigerfitpro.in" className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white">📧 Email Support</a>
            <a href="#" className="rounded-full border border-[#f7f0df]/18 bg-[#f7f0df]/8 px-6 py-3 text-xs font-bold">💬 Live Chat</a>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#f7f0df]/10 bg-[#06040d] px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-[#f7f0df]/32">© 2025 Tiger Fitness Pro · Bengaluru, India</p>
          <p className="text-xs text-[#f7f0df]/32">Made with 🐅 for a healthier India</p>
        </div>
      </footer>
    </div>
  );
}

export { legalContent };
export type { LegalType };
