export interface OpenFoodFactsProductInput {
  status?: number;
  product?: {
    product_name?: string;
    nutriments?: {
      energy_100g?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
    serving_size?: string;
    ingredients_text?: string;
    allergens?: string;
    image_front_url?: string;
    brands?: string;
  } | null;
}

export interface NormalizedFoodProduct {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  ingredients: string[];
  allergens: string[];
  imageUrl?: string;
  source: "open-food-facts";
  sourceUrl: string;
}

export function normalizeOpenFoodFactsProduct(input: OpenFoodFactsProductInput): NormalizedFoodProduct {
  const product = input.product ?? {};
  const name = product.product_name?.trim() || "Unknown product";

  const ingredients = product.ingredients_text
    ? product.ingredients_text.split(/,|\n|;/).map((part) => part.trim()).filter(Boolean)
    : [];

  const allergens = product.allergens
    ? product.allergens.split(/,|\n|;/).map((part) => part.trim()).filter(Boolean)
    : [];

  return {
    id: `open-food-facts-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    servingSize: product.serving_size ?? "100 g",
    calories: Number(product.nutriments?.energy_100g ?? 0),
    protein: Number(product.nutriments?.proteins_100g ?? 0),
    carbohydrates: Number(product.nutriments?.carbohydrates_100g ?? 0),
    fat: Number(product.nutriments?.fat_100g ?? 0),
    ingredients,
    allergens,
    imageUrl: product.image_front_url,
    source: "open-food-facts",
    sourceUrl: "https://world.openfoodfacts.org/",
  };
}

export async function lookupOpenFoodFactsProduct(code: string): Promise<NormalizedFoodProduct | null> {
  const normalized = code.trim();
  if (!normalized) return null;

  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalized)}.json`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenFoodFactsProductInput;
  if (payload.status !== 1 || !payload.product) return null;
  return normalizeOpenFoodFactsProduct(payload);
}
