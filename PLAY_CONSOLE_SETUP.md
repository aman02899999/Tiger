# Play Console setup — subscriptions, products & store listing

Exact values to enter in Play Console so the products you sell match what `Checkout.tsx` /
`PlayBilling.ts` / `PDFStore.tsx` already expect. Product IDs below are **immutable once
created** — don't rename them later, create a new product instead.

Play Console → your app → **Monetize → Products**.

---

## 1. Subscriptions (Monetize → Products → Subscriptions)

Create **two subscription products**, each with two **base plans** (monthly + annual).

### Product: `pro`
| Field | Value |
|---|---|
| Product ID | `pro` |
| Name | Titan Fitness Pro |
| Description | Unlimited AI Coach, full Yoga & Meditation libraries, Blood Report analyzer, Indian food scanner, and 10% off every PDF guide. |

**Base plan `monthly`**
- Billing period: 1 month
- Price: **₹199** (India) — let Play auto-convert other regions, or set manually to match your market
- Renewal type: Auto-renewing

**Base plan `annual`**
- Billing period: 1 year
- Price: **₹1,499** (India) — ~37% cheaper than 12× monthly, matches the in-app "Save 37%" badge
- Renewal type: Auto-renewing

Optional but recommended: add a **7-day free trial** offer on both base plans to match the
in-app "7-day refund" messaging, and a **grace period of 3 days** + **account hold of 30
days** under the subscription's Base plan settings (Play defaults are fine — just confirm
they're on).

### Product: `elite`
| Field | Value |
|---|---|
| Product ID | `elite` |
| Name | Titan Fitness Elite Family |
| Description | Everything in Pro, for up to 8 family members — medical report analyzer, voice fitness coach, priority support, and 25% off every PDF guide. |

**Base plan `monthly`** — ₹399/month, auto-renewing
**Base plan `annual`** — ₹2,999/year, auto-renewing

---

## 2. One-time products (Monetize → Products → In-app products)

Play doesn't support "lifetime subscriptions" as a subscription type — a one-time purchase
that never expires must be a **managed product** (non-consumable). Create:

| Product ID | Name | Price |
|---|---|---|
| `elite_lifetime` | Titan Fitness — Lifetime Elite | ₹6,999 |

### PDF guides — one managed product per guide
The app currently sells 24 individual guides plus 3 bundles through `PDFStore.tsx`. Create
one non-consumable managed product per row below (Product ID must match exactly — it's
generated from the guide's numeric id in the app as `guide_<id>`):

| Product ID | Title | Price |
|---|---|---|
| `guide_1` | Advanced Cutting Cycle — 12-Week Protocol | ₹299 |
| `guide_2` | Advanced Bulking Cycle with Peptides — Mass Building | ₹299 |
| `guide_3` | Beginner Steroid Cycle Full Guide — Entry-Level Protocol | ₹299 |
| `guide_4` | 30-Day Keto Indian Plan — Vegetarian Edition | ₹249 |
| `guide_5` | Indian Nutrition Bible — Bodybuilder Edition | ₹299 |
| `guide_6` | Female Weight Loss Plan — Hormone-Safe Protocol | ₹249 |
| `guide_7` | Women's Transformation — Body Recomposition | ₹249 |
| `guide_8` | Peptide Protocol Bible — 15+ Peptides | ₹349 |
| `guide_9` | SARMs Scientific Handbook — 8 SARMs with Clinical Data | ₹349 |
| `guide_10` | TRT Hormone Guide — India Legal Guide + Optimization | ₹299 |
| `guide_11` | Natural Testosterone Optimization — Lifestyle + Nutrition | ₹299 |
| `guide_12` | Science of Hypertrophy — 12-Week Training Program | ₹299 |
| `guide_13` | Fat Loss Masterclass — Evidence-Based Protocol | ₹299 |
| `guide_14` | Pre-Workout Optimization Guide — DIY Formula + Stacking | ₹199 |
| `guide_15` | Recovery & CNS Restoration — Sleep + HRV Guide | ₹199 |
| `guide_16` | Beginner Anabolic Cycle Complete Guide — Test-E Only | ₹399 |
| `guide_17` | Intermediate Anabolic Cycle Blueprint — Multi-Compound | ₹499 |
| `guide_18` | Advanced Anabolic Mastery — Competition Prep + HGH | ₹599 |
| `guide_19` | PCT Complete Bible — HPTA Recovery + SERM Guide | ₹399 |
| `guide_20` | Anabolic Nutrition Bible — Indian Meal Plans On-Cycle | ₹399 |
| `guide_21` | Fitness & Mindset Guidance | ₹299 |
| `guide_22` | Anabolic Full Guide | ₹299 |
| `guide_23` | 100 Yoga Poses Complete Guide | ₹249 |
| `guide_24` | Complete Meditation Guide & Roadmap | ₹249 |

> ⚠️ Rows 3, 8–11, 16–20, 22 are the steroid/SARM/peptide/TRT/PCT/anabolic titles flagged in
> `ANDROID_APP.md`. If you choose to Play-safe the catalog, skip creating those Play products
> entirely and hide the matching guides in the Android build.

**Bundles** (also one-time managed products — check current prices/ids in `PDFStore.tsx`'s
`BUNDLES` array before creating, they're easy to get out of sync):
| Product ID | Title |
|---|---|
| `bundle_<id>` | matches each entry in `BUNDLES` — use the bundle's `id` field |

---

## 3. Store listing (Grow → Store presence → Main store listing)

| Field | Value |
|---|---|
| App name | **Titan Fitness** (≤30 chars) |
| Short description | AI fitness coach, workouts, nutrition & wellness for India. (≤80 chars) |
| Full description | See draft below (≤4000 chars) |
| App category | Health & Fitness |
| Contact email | your support email |
| Privacy policy URL | must be a live, public URL — your app already has legal pages in `src/legal/LegalPages.tsx`; make sure they're reachable at a stable path (e.g. `https://tiger-fitness-pro-2f047-c4f21.web.app/#privacy`) before submitting |

### Full description (draft — edit freely)
```
Titan Fitness is an AI-powered fitness and lifestyle coaching app built for India.

TRAIN SMARTER
• Guided workouts with a live exercise player and rest timers
• Build your own routines from a searchable exercise library
• Strength Lab — 1-rep-max calculator with a live plate visualizer

EAT BETTER
• Macro Builder with an Indian food database
• High-protein Indian recipes with step-by-step photos
• Intermittent fasting timer and smart grocery lists

FEEL BETTER
• 50+ yoga poses with real demonstration photos and hold timers
• Guided meditation and breathing coach
• Sleep-cycle calculator and recovery tracking

TRACK EVERYTHING
• Body metrics, progress photos, and a GitHub-style consistency streak
• Blood report analyzer with plain-language explanations
• Daily quests, achievements, and a 24/7 AI coach

Upgrade to Pro or Elite Family for the full library, unlimited AI coaching, and
family health tracking — subscriptions managed through Google Play.
```

### Graphics (already generated in `store-assets/`)
| Asset | File | Required size |
|---|---|---|
| App icon | `store-assets/play_store_icon_512.png` | 512×512 |
| Feature graphic | `store-assets/feature_graphic_1024x500.png` | 1024×500 |
| Phone screenshots | *(not generated — capture 2–8 real screenshots from the running app: Dashboard, Yoga, AI Coach, Premium page work well)* | min 320px, max 3840px, 16:9 or 9:16 |

---

## 4. Data safety form (Policy → App content → Data safety)

Titan Fitness collects: email, name, phone (optional), age/height/weight, workout &
nutrition logs, sleep data, and optionally blood-report values a user manually enters. None
of this is sold to third parties; it's used to power the app's own features. Fill the Data
Safety form accordingly — Play requires this to match what the app actually does, and
mismatches are a common rejection reason.

## 5. Content rating (Policy → App content → Content rating)

Complete the questionnaire honestly, noting the app contains fitness/nutrition guidance and
(if you keep the flagged catalog) references to performance-enhancing substances — answer
that section accurately, since misrepresenting it risks a later suspension even if the
initial review passes.

---

## 6. Before you hit "Publish"

1. Upload the signed AAB to **Internal testing** first, add yourself as a tester, install it
   from the private testing link, and confirm: no browser address bar, all subscription
   buttons open the Play Billing sheet (not the UPI/Card form), and a test purchase
   completes and unlocks the plan in-app.
2. Use Play Console's **license testers** (Setup → License testing) so test purchases don't
   charge real money while verifying the flow end-to-end.
3. Only then promote to **Closed testing → Production**.
