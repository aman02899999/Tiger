export interface WgerExerciseInput {
  id?: number;
  name?: string;
  description?: string;
  category?: { name?: string } | null;
  equipment?: Array<{ name?: string }> | null;
  muscles?: Array<{ name?: string }> | null;
  muscles_secondary?: Array<{ name?: string }> | null;
  images?: Array<{ image?: string }> | null;
  uuid?: string;
}

export interface NormalizedWgerExercise {
  id: string;
  externalId: string;
  name: string;
  description: string;
  muscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  category: string;
  instructions: string[];
  images: string[];
  source: "wger";
  sourceUrl: string;
}

export function normalizeWgerExercise(input: WgerExerciseInput): NormalizedWgerExercise {
  const name = input.name?.trim() || "Exercise";
  const description = input.description?.trim() || "Exercise details unavailable.";

  return {
    id: input.uuid ?? `wger-${input.id ?? name.toLowerCase().replace(/\s+/g, "-")}`,
    externalId: String(input.id ?? input.uuid ?? name),
    name,
    description,
    muscles: (input.muscles ?? []).map((muscle) => muscle.name ?? "General").filter(Boolean),
    secondaryMuscles: (input.muscles_secondary ?? []).map((muscle) => muscle.name ?? "General").filter(Boolean),
    equipment: (input.equipment ?? []).map((item) => item.name ?? "Bodyweight").filter(Boolean),
    category: input.category?.name ?? "General",
    instructions: description ? [description] : [],
    images: (input.images ?? []).map((image) => image.image ?? "").filter(Boolean),
    source: "wger",
    sourceUrl: "https://wger.de/",
  };
}

export async function fetchWgerExercise(name: string): Promise<NormalizedWgerExercise | null> {
  const normalized = name.trim();
  if (!normalized) return null;

  const response = await fetch(`https://wger.de/api/v2/exercise/?search=${encodeURIComponent(normalized)}&limit=1`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Wger request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { results?: WgerExerciseInput[] };
  const first = payload.results?.[0];
  return first ? normalizeWgerExercise(first) : null;
}
