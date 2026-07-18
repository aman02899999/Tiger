/* ---------------------------------------------------------------- */
/* Platform channel detection — distinguishes the three ways this    */
/* web app can reach a user: the plain website, the Play Store       */
/* Android app, or the direct-download (sideloaded) Android app.     */
/*                                                                    */
/* WHY THIS EXISTS: a few PDF guides (steroid cycles, SARMs, TRT,     */
/* PCT, anabolic protocols) are almost certainly a Google Play        */
/* Restricted Content policy violation if they appear inside an app   */
/* distributed *through* Play Store — but Play's policies only apply  */
/* to that specific distribution channel. The website and a           */
/* self-hosted APK aren't governed by Play policy at all, so the same  */
/* code can safely show the full catalog everywhere except inside the  */
/* Play-distributed build. See ANDROID_APP.md for the full rationale.  */
/*                                                                    */
/* HOW IT'S SET: each Android Gradle flavor's AndroidManifest launches */
/* the TWA at a URL with a `?channel=` query param baked into its      */
/* resource strings (see android/app/build.gradle product flavors).    */
/* That param is read once here and cached, so in-app navigation       */
/* (which doesn't reload the page) keeps the right channel.            */
/* ---------------------------------------------------------------- */

export type AppChannel = "web" | "playstore" | "direct";

const STORAGE_KEY = "tfp_app_channel";

function detectChannel(): AppChannel {
  if (typeof window === "undefined") return "web";
  try {
    const param = new URLSearchParams(window.location.search).get("channel");
    if (param === "playstore" || param === "direct") {
      localStorage.setItem(STORAGE_KEY, param);
      return param;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "playstore" || stored === "direct") return stored;
  } catch {
    /* localStorage unavailable (private mode) — fall through to web */
  }
  return "web";
}

let cached: AppChannel | null = null;

/** The distribution channel this session is running under. Computed once and cached. */
export function getAppChannel(): AppChannel {
  if (cached === null) cached = detectChannel();
  return cached;
}

/** True only inside the build submitted to Google Play — the one channel subject to Play policy. */
export function isPlayStoreChannel(): boolean {
  return getAppChannel() === "playstore";
}
