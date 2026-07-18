# The Titan Fitness — Android App (Trusted Web Activity)

This wraps the existing web app (`https://tiger-fitness-pro-2f047-c4f21.web.app`) in a thin
native Android shell using a **Trusted Web Activity (TWA)** — Google's own recommended path
for shipping a PWA to the Play Store. The web app is the single source of truth; the Android
project in `android/` just launches it full-screen with no browser chrome, and bridges Google
Play Billing into the app's existing checkout (`src/app/Checkout.tsx`).

No native rebuild is required for day-to-day feature work — ship new features to the website
as usual and Android users get them automatically, the same as a browser tab refreshing.

---

## ✅ Play Store policy risk — resolved with a two-channel build

The PDF Guide Store includes titles like *"Beginner Steroid Cycle Full Guide,"* *"SARMs
Scientific Handbook,"* *"TRT Hormone Guide,"* *"PCT Complete Bible,"* and several *"Anabolic
..."* protocols. Google Play's **Restricted Content / Dangerous Products** policy prohibits
apps that facilitate the sale of, or provide usage instructions for, anabolic steroids and
other controlled/unapproved substances — so those guides can't safely appear inside an app
distributed *through Play*.

**This is now handled automatically, not by removing any content.** The app ships as **two
Gradle product flavors** that share 100% of the same code and web app:

- **`playstore`** (`com.titanfitness.app`) — the build you upload to Play Console. The web
  app detects this channel (via `?channel=playstore` baked into its launch URL) and hides
  the 12 flagged guides and the 3 bundles that include them — see
  `src/app/PlatformChannel.ts` and the filtering in `src/app/PDFStore.tsx`. A small in-app
  note links Play users to the website for the full catalog, so you don't lose that revenue.
- **`direct`** (`com.titanfitness.app.direct`) — an unfiltered build with the complete
  24-guide catalog, meant to be downloaded straight from your own website rather than Play.
  Play's policies only govern what's distributed *through* Play Store, so this channel is
  free to show everything.
- **The website itself** is a third, always-unfiltered channel — nothing changes there.

Build either with `./gradlew assemblePlaystoreRelease` or `./gradlew assembleDirectRelease`
(see the build commands below). If you'd rather not maintain two channels, you can still:

1. Submit only the `playstore` flavor and skip building `direct` at all.
2. Submit the unfiltered catalog anyway and accept the rejection/suspension risk — Play
   enforcement can affect your whole developer account, not just this one app listing.
3. Ask me to adjust which guides are filtered (the exact list is the
   `PLAY_RESTRICTED_GUIDE_IDS` constant at the top of `src/app/PDFStore.tsx`) if you disagree
   with where I drew the line — e.g. `id 11` ("Natural Testosterone Optimization —
   Lifestyle + Nutrition") was deliberately left visible everywhere since it contains no
   substance-cycle content despite living in the "Hormones" category.
   I can do this in a few minutes if you choose option 1.

---

## What's in this repo

```
android/
  twa-manifest.json         Bubblewrap-style config describing the TWA
  build.gradle               Root Gradle build
  settings.gradle
  gradle.properties
  app/
    build.gradle              App module — applicationId, Play Billing deps
    src/main/
      AndroidManifest.xml     TWA launcher activity + Play Billing wiring
      res/                    Icons, colors, splash screen (generated from the brand)
public/.well-known/
  assetlinks.json            Digital Asset Links — proves the app owns the domain
src/app/
  PlayBilling.ts             Digital Goods API bridge (Play Billing on Android only)
  Checkout.tsx               Existing checkout — auto-detects Play Billing and switches to it
```

## How Play Billing plugs in

`Checkout.tsx` already runs the same UPI/Card/Netbanking flow on the website. On Android,
`PlayBilling.ts` detects `window.getDigitalGoodsService('https://play.google.com/billing')` —
which only resolves inside this TWA once `androidbrowserhelper:billing` is wired up (already
done in `AndroidManifest.xml` and `app/build.gradle`) — and when present, the checkout modal
hides the card/UPI form and shows a single **"Continue with Google Play"** button instead.
This isn't optional politeness: **Play Store policy requires all digital subscriptions and
in-app digital content sold inside a Play-distributed app to go through Play Billing**, so
this split is what keeps the app compliant.

---

## A build-time verification you should do

This sandbox has no network access to `dl.google.com`, Android's Maven repo, or Gradle's
distribution service, so **the Gradle project here has been hand-authored to match the
documented `androidbrowserhelper` + Play Billing (Digital Goods API) integration shape, but
it has not been compiled or run.** Before your first real build, diff `AndroidManifest.xml`
and `app/build.gradle` against the current official sample at
[github.com/GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) and
[github.com/GoogleChrome/android-browser-helper](https://github.com/GoogleChrome/android-browser-helper)
(search its `demos/`/`playbilling` sample) — library versions and manifest meta-data keys do
shift over time, and Android Studio will surface any mismatch immediately as a build error
you can fix by matching whatever the current sample uses.

## Prerequisites (on your own machine — not available in this sandbox)

- **JDK 17+** and **Android Studio** (or the Android SDK command-line tools) — this sandbox
  has neither the Android SDK nor network access to `dl.google.com` / `services.gradle.org`,
  so the project here is complete and correct but has not been compiled. Opening it in
  Android Studio will finish the setup automatically.
- A **Google Play Console developer account** (you said you already have one).

## One-time setup

### 1. Generate the Gradle wrapper
This sandbox couldn't reach Gradle's distribution service, so the wrapper jar isn't checked
in. Run this once, from the `android/` folder, on a machine with internet access:
```bash
cd android
gradle wrapper --gradle-version 8.7
```
(Opening the project in Android Studio does this automatically on first sync — you can skip
the manual command if you're using Android Studio.)

### 2. Generate your upload keystore
```bash
cd android
keytool -genkeypair -v -keystore android.keystore \
  -alias titanfitness -keyalg RSA -keysize 2048 -validity 10000
```
Keep `android.keystore` and its passwords **out of git** (already gitignored) and back them
up somewhere safe — losing it means you can never update the app again under the same
package name.

### 3. Get your app's SHA-256 fingerprint
```bash
keytool -list -v -keystore android.keystore -alias titanfitness | grep SHA256
```
Paste that fingerprint into `public/.well-known/assetlinks.json`, replacing
`REPLACE_WITH_YOUR_UPLOAD_KEYSTORE_SHA256_FINGERPRINT`, then deploy the website so the file
is live at `https://tiger-fitness-pro-2f047-c4f21.web.app/.well-known/assetlinks.json`
(it already deploys automatically — it's inside `public/`).

Verify it with Google's checker before building:
`https://developers.google.com/digital-asset-links/tools/generator`

### 4. Point the app at your real domain (recommended)
`android/twa-manifest.json`, `AndroidManifest.xml`'s `@string/host`/`@string/launch_url`, and
`assetlinks.json` all currently point at the Firebase-hosted URL
(`tiger-fitness-pro-2f047-c4f21.web.app`). That works fine for launch, but if you later move
to a custom domain (e.g. `titanfitness.in`), update all three together — a TWA's chrome-less
mode breaks if the asset-link verification doesn't match exactly.

### 5. Build the release binaries
Both flavors share the same keystore and Gradle properties — only the task name changes.

**For Play Console (AAB required, filtered catalog):**
```bash
cd android
./gradlew bundlePlaystoreRelease \
  -PTITAN_KEYSTORE_PATH=../android.keystore \
  -PTITAN_KEYSTORE_PASSWORD=<your password> \
  -PTITAN_KEY_ALIAS=titanfitness \
  -PTITAN_KEY_PASSWORD=<your password>
```
The signed `.aab` lands in `android/app/build/outputs/bundle/playstoreRelease/`. That's what
you upload to Play Console — not an `.apk`.

**For direct download from your website (APK, full catalog):**
```bash
cd android
./gradlew assembleDirectRelease \
  -PTITAN_KEYSTORE_PATH=../android.keystore \
  -PTITAN_KEYSTORE_PASSWORD=<your password> \
  -PTITAN_KEY_ALIAS=titanfitness \
  -PTITAN_KEY_PASSWORD=<your password>
```
The signed `.apk` lands in `android/app/build/outputs/apk/direct/release/`. Upload it
somewhere on your own hosting (e.g. `public/downloads/titan-fitness.apk` in this repo, so it
deploys with the site) and link to it from the website — Play's policies don't apply to a
file your own server hosts.

### 6. Test locally before publishing
Install `bubblewrap` (`npm i -g @bubblewrap/cli`) or use Android Studio's built-in emulator/
device run. Confirm the app opens full-screen with **no browser address bar** — if you see
one, the Digital Asset Links check failed (usually a mismatched SHA-256 or a site that hasn't
redeployed `assetlinks.json` yet).

---

## Play Console: create the app & subscription products

See **`PLAY_CONSOLE_SETUP.md`** for the exact product IDs, base plans, prices, and store
listing copy to enter — written to match what's already live in the app's `Checkout.tsx` and
`PDFStore.tsx` so nothing is inconsistent between what Play sells and what the app unlocks.
