"use client";

import { useState, useMemo } from "react";

type Guide = {
  id: number;
  title: string;
  description: string;
  pages: string;
  price: number;
  category: string;
  badge?: string;
  icon: string;
};

type Bundle = {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  price: number;
  savings: string;
  guides: string;
  icon: string;
};

const GUIDES: Guide[] = [
  { id: 1, title: "Advanced Cutting Cycle — 12-Week Protocol", description: "Complete 12-week advanced cutting cycle with detailed compound breakdown", pages: "48+ pages", price: 299, category: "Cycles", icon: "🔪" },
  { id: 2, title: "Advanced Bulking Cycle with Peptides — Mass Building", description: "Mass building protocol combining anabolics with peptide synergy", pages: "52+ pages", price: 299, category: "Cycles", icon: "💪" },
  { id: 3, title: "Beginner Steroid Cycle Full Guide — Entry-Level Protocol", description: "Safe entry-level protocol with bloodwork guidance and PCT", pages: "44+ pages", price: 299, category: "Cycles", badge: "🔥 HOT", icon: "🧪" },
  { id: 4, title: "30-Day Keto Indian Plan — Vegetarian Edition", description: "Vegetarian keto meal plans tailored to Indian ingredients", pages: "38+ pages", price: 249, category: "Nutrition", icon: "🥗" },
  { id: 5, title: "Indian Nutrition Bible — Bodybuilder Edition", description: "70+ Indian foods analyzed for bodybuilding macros and timing", pages: "58+ pages", price: 299, category: "Nutrition", icon: "🍛" },
  { id: 6, title: "Female Weight Loss Plan — Hormone-Safe Protocol", description: "Science-backed weight loss designed around female hormonal cycles", pages: "45+ pages", price: 249, category: "Women", icon: "🌸" },
  { id: 7, title: "Women's Transformation — Body Recomposition", description: "Body recomposition strategy for women: lose fat, gain muscle simultaneously", pages: "42+ pages", price: 249, category: "Women", icon: "✨" },
  { id: 8, title: "Peptide Protocol Bible — 15+ Peptides", description: "Comprehensive guide covering 15+ peptides with dosing and stacking protocols", pages: "58+ pages", price: 349, category: "Hormones", icon: "🔬" },
  { id: 9, title: "SARMs Scientific Handbook — 8 SARMs with Clinical Data", description: "Clinical data on 8 SARMs: efficacy, suppression, and PCT protocols", pages: "54+ pages", price: 349, category: "Hormones", icon: "📊" },
  { id: 10, title: "TRT Hormone Guide — India Legal Guide + Optimization", description: "TRT in India: legal sources, protocols, monitoring and optimization", pages: "55+ pages", price: 299, category: "Hormones", icon: "⚗️" },
  { id: 11, title: "Natural Testosterone Optimization — Lifestyle + Nutrition", description: "Evidence-based natural T optimization through lifestyle and nutrition", pages: "48+ pages", price: 299, category: "Hormones", icon: "🦁" },
  { id: 12, title: "Science of Hypertrophy — 12-Week Training Program", description: "12-week evidence-based hypertrophy program with periodization", pages: "50+ pages", price: 299, category: "Training", icon: "🏋️" },
  { id: 13, title: "Fat Loss Masterclass — Evidence-Based Protocol", description: "Complete evidence-based fat loss system combining training and nutrition", pages: "52+ pages", price: 299, category: "Training", badge: "⭐ BESTSELLER", icon: "🔥" },
  { id: 14, title: "Pre-Workout Optimization Guide — DIY Formula + Stacking", description: "Build your own pre-workout and master ingredient stacking", pages: "36+ pages", price: 199, category: "Supplements", icon: "⚡" },
  { id: 15, title: "Recovery & CNS Restoration — Sleep + HRV Guide", description: "CNS recovery protocols using sleep optimization and HRV monitoring", pages: "42+ pages", price: 199, category: "Recovery", icon: "😴" },
  { id: 16, title: "Beginner Anabolic Cycle Complete Guide — Test-E Only", description: "Complete beginner guide: Test-E only cycle with AI and PCT", pages: "62+ pages", price: 399, category: "Anabolic", badge: "🆕", icon: "💉" },
  { id: 17, title: "Intermediate Anabolic Cycle Blueprint — Multi-Compound", description: "Multi-compound intermediate blueprint with advanced management", pages: "68+ pages", price: 499, category: "Anabolic", badge: "🆕", icon: "📋" },
  { id: 18, title: "Advanced Anabolic Mastery — Competition Prep + HGH", description: "Elite competition prep protocol integrating HGH and advanced compounds", pages: "78+ pages", price: 599, category: "Anabolic", badge: "🆕", icon: "🏆" },
  { id: 19, title: "PCT Complete Bible — HPTA Recovery + SERM Guide", description: "Complete HPTA recovery using SERMs, HCG and natural support", pages: "58+ pages", price: 399, category: "Anabolic", badge: "🆕", icon: "🔄" },
  { id: 20, title: "Anabolic Nutrition Bible — Indian Meal Plans On-Cycle", description: "Indian meal plans optimized for anabolic cycles: on-cycle and PCT nutrition", pages: "62+ pages", price: 399, category: "Anabolic", badge: "🆕", icon: "🍽️" },
  { id: 21, title: "Fitness & Mindset Guidance", description: "15 chapters covering fitness psychology and 5 exclusive bonuses", pages: "60+ pages", price: 299, category: "Flagship", icon: "🧠" },
  { id: 22, title: "Anabolic Full Guide", description: "Complete protein data tables, supplement tier table and anabolic overview", pages: "65+ pages", price: 299, category: "Flagship", icon: "📚" },
];

const BUNDLES: Bundle[] = [
  {
    id: "duo",
    title: "Transformation Duo",
    description: "Both flagship guides: Fitness & Mindset + Anabolic Full Guide",
    originalPrice: 598,
    price: 449,
    savings: "25%",
    guides: "2 guides",
    icon: "🎯",
  },
  {
    id: "anabolic",
    title: "Anabolic Series Bundle",
    description: "All 5 Anabolic Series 2024 guides in one complete package",
    originalPrice: 1895,
    price: 999,
    savings: "40%",
    guides: "5 guides",
    icon: "💊",
  },
  {
    id: "library",
    title: "Complete Library",
    description: "All 22 PDF guides — the ultimate Tiger Fitness Pro collection",
    originalPrice: 7448,
    price: 1999,
    savings: "73%",
    guides: "22 guides",
    icon: "🗂️",
  },
];

const CATEGORIES = ["All", "Nutrition", "Training", "Hormones", "Women", "Recovery", "Anabolic", "Cycles", "Supplements", "Flagship"];

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border"
      style={{ background: "#1a0f2e", borderColor: "#7c3aed", color: "#f7f0df", maxWidth: "90vw" }}
    >
      <span className="text-2xl">📱</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-lg opacity-60 hover:opacity-100 transition-opacity">×</button>
    </div>
  );
}

function BuyModal({
  guide,
  bundle,
  onClose,
  onProceed,
}: {
  guide?: Guide;
  bundle?: Bundle;
  onClose: () => void;
  onProceed: () => void;
}) {
  const title = guide?.title ?? bundle?.title ?? "";
  const price = guide?.price ?? bundle?.price ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,4,13,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl border"
        style={{ background: "#0f0a1e", borderColor: "#7c3aed" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors"
          style={{ color: "#f7f0df", background: "rgba(124,58,237,0.2)" }}
        >
          ×
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{guide?.icon ?? bundle?.icon ?? "📄"}</div>
          <h2 className="text-xl font-bold mb-2 leading-tight" style={{ color: "#f7f0df" }}>{title}</h2>
          <div className="text-3xl font-extrabold mt-4" style={{ color: "#d8b35a" }}>₹{price}</div>
        </div>
        <div
          className="rounded-xl p-4 mb-6 text-center text-sm"
          style={{ background: "rgba(124,58,237,0.1)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          Secure digital delivery after payment. Instant PDF download link sent to your email.
        </div>
        <button
          onClick={onProceed}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a21caf)", color: "#f7f0df" }}
        >
          Proceed to Payment
        </button>
        <p className="text-center text-xs mt-4 opacity-50" style={{ color: "#f7f0df" }}>
          Payment integration coming soon
        </p>
      </div>
    </div>
  );
}

function GuideCard({ guide, onBuy }: { guide: Guide; onBuy: (guide: Guide) => void }) {
  return (
    <div
      className="relative flex flex-col rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
      style={{ background: "#0f0a1e", borderColor: "rgba(124,58,237,0.3)", color: "#f7f0df" }}
    >
      {guide.badge && (
        <span
          className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: "rgba(216,179,90,0.15)", color: "#d8b35a", border: "1px solid rgba(216,179,90,0.4)" }}
        >
          {guide.badge}
        </span>
      )}
      <div className="text-3xl mb-3">{guide.icon}</div>
      <h3 className="font-bold text-sm leading-tight mb-2" style={{ color: "#f7f0df" }}>{guide.title}</h3>
      <p className="text-xs mb-3 opacity-70 flex-1 leading-relaxed" style={{ color: "#f7f0df" }}>{guide.description}</p>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
          {guide.pages}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(216,179,90,0.1)", color: "#d8b35a" }}>
          {guide.category}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-extrabold" style={{ color: "#d8b35a" }}>₹{guide.price}</span>
        <button
          onClick={() => onBuy(guide)}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a21caf)", color: "#f7f0df" }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

function BundleCard({ bundle, onBuy }: { bundle: Bundle; onBuy: (bundle: Bundle) => void }) {
  return (
    <div
      className="relative flex flex-col rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "linear-gradient(135deg, #1a0f2e, #0f0a1e)", borderColor: "rgba(216,179,90,0.4)", color: "#f7f0df" }}
    >
      <div
        className="absolute top-3 right-3 text-xs font-extrabold px-3 py-1 rounded-full"
        style={{ background: "linear-gradient(135deg, #d8b35a, #f59e0b)", color: "#07040d" }}
      >
        SAVE {bundle.savings}
      </div>
      <div className="text-4xl mb-3">{bundle.icon}</div>
      <h3 className="font-extrabold text-lg mb-1" style={{ color: "#d8b35a" }}>{bundle.title}</h3>
      <p className="text-xs mb-3 opacity-70 leading-relaxed">{bundle.description}</p>
      <div className="text-xs mb-4 opacity-60">{bundle.guides}</div>
      <div className="flex items-end gap-3 mb-4">
        <span className="text-3xl font-extrabold" style={{ color: "#d8b35a" }}>₹{bundle.price}</span>
        <span className="text-sm line-through opacity-50 mb-1">₹{bundle.originalPrice}</span>
      </div>
      <button
        onClick={() => onBuy(bundle)}
        className="w-full py-3 rounded-xl font-bold transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #d8b35a, #f59e0b)", color: "#07040d" }}
      >
        Buy Bundle
      </button>
    </div>
  );
}

export default function PDFStorePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return GUIDES.filter((g) => {
      const matchCat = activeCategory === "All" || g.category === activeCategory;
      const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const handleProceed = () => {
    setSelectedGuide(null);
    setSelectedBundle(null);
    setToast("Payment coming soon — contact us on WhatsApp to purchase");
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#07040d", color: "#f7f0df" }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ background: "linear-gradient(135deg, #d8b35a, #a78bfa, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PDF Guide Store
          </h1>
          <p className="text-lg opacity-70 max-w-2xl mx-auto">
            Evidence-based protocols by Tiger Fitness Pro — India's most trusted fitness guides
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-extrabold mb-6 text-center" style={{ color: "#d8b35a" }}>Bundle Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUNDLES.map((b) => (
              <BundleCard key={b.id} bundle={b} onBuy={setSelectedBundle} />
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  activeCategory === cat
                    ? { background: "linear-gradient(135deg, #7c3aed, #a21caf)", color: "#f7f0df" }
                    : { background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm outline-none w-full sm:w-64 transition-colors"
            style={{ background: "rgba(124,58,237,0.1)", color: "#f7f0df", border: "1px solid rgba(124,58,237,0.3)" }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 opacity-50">No guides found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((g) => (
              <GuideCard key={g.id} guide={g} onBuy={setSelectedGuide} />
            ))}
          </div>
        )}
      </div>

      {(selectedGuide || selectedBundle) && (
        <BuyModal
          guide={selectedGuide ?? undefined}
          bundle={selectedBundle ?? undefined}
          onClose={() => { setSelectedGuide(null); setSelectedBundle(null); }}
          onProceed={handleProceed}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export function PDFStoreSection() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const featured = GUIDES.slice(0, 6);

  const handleProceed = () => {
    setSelectedGuide(null);
    setToast("Payment coming soon — contact us on WhatsApp to purchase");
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <section style={{ background: "#07040d", color: "#f7f0df" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-3" style={{ background: "linear-gradient(135deg, #d8b35a, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PDF Guides
          </h2>
          <p className="opacity-60 text-sm">India's most detailed fitness & anabolic guides</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((g) => (
            <GuideCard key={g.id} guide={g} onBuy={setSelectedGuide} />
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="/store"
            className="inline-block px-8 py-3 rounded-xl font-bold transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a21caf)", color: "#f7f0df" }}
          >
            View All 22 Guides →
          </a>
        </div>
      </div>
      {selectedGuide && (
        <BuyModal
          guide={selectedGuide}
          onClose={() => setSelectedGuide(null)}
          onProceed={handleProceed}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}
