import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Progress Photos — upload a "before" and "after" shot and drag a   */
/* handle to reveal the transformation. Photos + weights persist in  */
/* localStorage as data URLs (per user). No SVG.                     */
/* ---------------------------------------------------------------- */

interface Shot {
  data: string; // data URL
  label: string;
  weight: string;
  date: string;
}

function loadShots(email: string | null | undefined): { before: Shot | null; after: Shot | null } {
  try {
    return JSON.parse(localStorage.getItem(`tfp_photos_${email ?? "guest"}`) ?? "{}") || { before: null, after: null };
  } catch {
    return { before: null, after: null };
  }
}

// Downscale an uploaded image to keep localStorage small.
function fileToDataUrl(file: File, maxW = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function UploadTile({ slot, shot, onUpload }: { slot: "before" | "after"; shot: Shot | null; onUpload: (slot: "before" | "after", data: string, weight: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [weight, setWeight] = useState(shot?.weight ?? "");
  const [busy, setBusy] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await fileToDataUrl(file);
      onUpload(slot, data, weight);
    } catch { /* ignore */ }
    setBusy(false);
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">{slot === "before" ? "📷 Before" : "✨ After"}</p>
        {shot && <span className="text-[11px] text-[#2a1e16]/62">{shot.date}</span>}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#2a1e16]/15 bg-[#2a1e16]/5 transition hover:border-orange-300/40"
      >
        {shot ? (
          <img src={shot.data} alt={`${slot} progress`} className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-xs text-[#2a1e16]/62">{busy ? "Processing…" : `Tap to upload your ${slot} photo`}</span>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number" inputMode="decimal" value={weight} placeholder="Weight (kg)"
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => shot && onUpload(slot, shot.data, weight)}
          className="w-full rounded-lg border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-2 text-sm outline-none focus:border-orange-200/40"
        />
      </div>
    </div>
  );
}

/* Interactive drag-to-compare slider */
function CompareSlider({ before, after }: { before: Shot; after: Shot }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function setFromClientX(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  useEffect(() => {
    function move(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      setFromClientX(x);
    }
    function up() { dragging.current = false; }
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const wDiff = parseFloat(after.weight) - parseFloat(before.weight);

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Drag to reveal your transformation</p>
      <div
        ref={ref}
        className="relative aspect-[3/4] w-full max-w-md mx-auto select-none overflow-hidden rounded-2xl"
        onMouseDown={(e) => { dragging.current = true; setFromClientX(e.clientX); }}
        onTouchStart={(e) => { dragging.current = true; setFromClientX(e.touches[0].clientX); }}
      >
        {/* after (full) */}
        <img src={after.data} alt="after" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* before (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img src={before.data} alt="before" className="absolute inset-0 h-full w-full object-cover" style={{ width: ref.current?.clientWidth ?? "100%", maxWidth: "none" }} draggable={false} />
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]">Before</span>
        </div>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ea580c]">After</span>
        {/* handle */}
        <div className="absolute inset-y-0 flex items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          <div className="h-full w-0.5 bg-black/80" />
          <div className="absolute grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg">⇄</div>
        </div>
      </div>

      {before.weight && after.weight && !Number.isNaN(wDiff) && (
        <div className="mt-4 text-center">
          <p className="text-sm text-[#2a1e16]/75">
            Weight change: <span className={`font-black tabular-nums ${wDiff < 0 ? "text-emerald-600" : wDiff > 0 ? "text-[#ea580c]" : "text-[#2a1e16]"}`}>{wDiff > 0 ? "+" : ""}{wDiff.toFixed(1)} kg</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProgressPhotosPage() {
  const { user } = useAuth();
  const [shots, setShots] = useState<{ before: Shot | null; after: Shot | null }>({ before: null, after: null });
  const rewarded = useRef(false);

  useEffect(() => {
    setShots(loadShots(user?.email));
  }, [user?.email]);

  function upload(slot: "before" | "after", data: string, weight: string) {
    setShots((prev) => {
      const next = { ...prev, [slot]: { data, label: slot, weight, date: prev[slot]?.date ?? new Date().toISOString().slice(0, 10) } };
      try { localStorage.setItem(`tfp_photos_${user?.email ?? "guest"}`, JSON.stringify(next)); } catch { /* quota */ }
      if (next.before && next.after && !rewarded.current) {
        rewarded.current = true;
        addXP(user?.email, 20);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Progress Photos</h1>
        <p className="text-sm text-[#2a1e16]/68">Upload a before &amp; after and drag to see how far you've come</p>
      </div>

      {/* How this works */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">How this works — 3 simple steps</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Upload two photos", d: "Add a 'before' and an 'after' shot. Same pose, lighting and distance gives the clearest comparison." },
            { n: "2", t: "Add your weight", d: "Optionally log the weight for each photo — the tool shows your exact change in kg." },
            { n: "3", t: "Drag to compare", d: "Slide the handle across the combined image to reveal your transformation. Both photos stay private on your device." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-black/8 bg-black/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#2a1e16]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#2a1e16]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UploadTile slot="before" shot={shots.before} onUpload={upload} />
        <UploadTile slot="after" shot={shots.after} onUpload={upload} />
      </div>

      {shots.before && shots.after ? (
        <CompareSlider before={shots.before} after={shots.after} />
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">📸</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Upload both photos above to unlock the drag-to-compare slider (+20 XP).</p>
        </div>
      )}

      <p className="text-center text-xs text-[#2a1e16]/55">🔒 Your photos never leave your device — they're stored only in this browser.</p>
    </div>
  );
}
