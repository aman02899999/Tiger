import type {
  AirQuality,
  CurrencyQuote,
  ExerciseReference,
  ExternalApiResponse,
  GeoLocation,
  WeatherConditions,
} from "../types/api";
import { TtlCache } from "../cache/ttl-cache";

const cache = new TtlCache<any>(5 * 60_000);

function readEnv(name: string): string | undefined {
  return typeof window === "undefined" ? undefined : (import.meta as any).env?.[name] || undefined;
}

const API_TIMEOUT_MS = 5000;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function withFallback<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallbackValue: T,
  ttlMs = 5 * 60_000,
): Promise<ExternalApiResponse<T>> {
  const cached = cache.get(key);
  if (cached) {
    return { status: "fallback", data: cached, fallback: fallbackValue, source: "cache" };
  }

  try {
    const data = await fetcher();
    cache.set(key, data, ttlMs);
    return { status: "success", data, fallback: fallbackValue, source: "network" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error";
    return { status: "fallback", data: fallbackValue, fallback: fallbackValue, error: message, source: "fallback" };
  }
}

export async function getWeatherByCity(city: string): Promise<ExternalApiResponse<WeatherConditions>> {
  const normalized = city.trim();
  if (!normalized) {
    return { status: "fallback", fallback: {
      city: "Bengaluru",
      country: "IN",
      temperatureC: 28,
      feelsLikeC: 30,
      condition: "Clear",
      humidity: 52,
      windKph: 8,
      timestamp: new Date().toISOString(),
    }, error: "No city supplied" };
  }

  const apiKey = readEnv("VITE_OPENWEATHER_API_KEY");
  if (!apiKey) {
    return { status: "fallback", fallback: {
      city: normalized,
      country: "IN",
      temperatureC: 28,
      feelsLikeC: 30,
      condition: "Clear",
      humidity: 52,
      windKph: 8,
      timestamp: new Date().toISOString(),
    }, error: "OpenWeather API key not configured" };
  }

  const key = `weather:${normalized.toLowerCase()}`;
  return withFallback(key, async () => {
    const payload = await fetchJson<any>(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(normalized)}&appid=${apiKey}&units=metric`);
    return {
      city: payload.name ?? normalized,
      country: payload.sys?.country ?? "IN",
      temperatureC: Number(payload.main?.temp ?? 0),
      feelsLikeC: Number(payload.main?.feels_like ?? 0),
      condition: payload.weather?.[0]?.main ?? "Clear",
      humidity: Number(payload.main?.humidity ?? 0),
      windKph: Number(payload.wind?.speed ?? 0) * 3.6,
      timestamp: new Date().toISOString(),
    } satisfies WeatherConditions;
  }, {
    city: normalized,
    country: "IN",
    temperatureC: 28,
    feelsLikeC: 30,
    condition: "Clear",
    humidity: 52,
    windKph: 8,
    timestamp: new Date().toISOString(),
  });
}

export async function getAirQuality(city: string): Promise<ExternalApiResponse<AirQuality>> {
  const fallback: AirQuality = {
    city,
    country: "IN",
    aqi: 58,
    category: "Moderate",
    pm25: 25,
    pm10: 42,
    timestamp: new Date().toISOString(),
  };

  const apiKey = readEnv("VITE_AQI_API_KEY");
  if (!apiKey) {
    return { status: "fallback", fallback, error: "AQI API key not configured" };
  }

  return withFallback(`aqi:${city.toLowerCase()}`, async () => {
    const response = await fetchJson<any>(`https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${apiKey}`);
    const data = response?.data ?? {};
    return {
      city: data.city?.name ?? city,
      country: data.city?.country ?? "IN",
      aqi: Number(data.aqi ?? 58),
      category: data?.dominentpol ?? "Moderate",
      pm25: Number(data.iaqi?.pm25?.v ?? 0),
      pm10: Number(data.iaqi?.pm10?.v ?? 0),
      timestamp: new Date().toISOString(),
    } satisfies AirQuality;
  }, fallback);
}

export async function geocodeLocation(query: string): Promise<ExternalApiResponse<GeoLocation>> {
  const fallback: GeoLocation = {
    displayName: query || "Bengaluru, India",
    latitude: 12.9716,
    longitude: 77.5946,
    country: "India",
    city: "Bengaluru",
  };

  const apiKey = readEnv("VITE_GEOCODING_API_KEY");
  if (!apiKey) {
    return { status: "fallback", fallback, error: "Geocoding API key not configured" };
  }

  return withFallback(`geo:${query.toLowerCase()}`, async () => {
    const response = await fetchJson<any>(`https://geocode.maps.co/search?q=${encodeURIComponent(query)}&api_key=${apiKey}`);
    const first = Array.isArray(response) ? response[0] : null;
    if (!first) throw new Error("No geocoding result found");
    return {
      displayName: first.display_name ?? query,
      latitude: Number(first.lat ?? 12.9716),
      longitude: Number(first.lon ?? 77.5946),
      country: first.address?.country,
      city: first.address?.city ?? first.address?.town ?? first.address?.village,
    } satisfies GeoLocation;
  }, fallback);
}

export async function getExerciseReference(name: string): Promise<ExternalApiResponse<ExerciseReference>> {
  const fallback: ExerciseReference = {
    name: name || "Compound lift",
    muscleGroup: "Full body",
    difficulty: "intermediate",
    equipment: ["Dumbbells"],
    guidance: "Focus on controlled range of motion and consistent effort.",
  };

  return withFallback(`exercise:${name.toLowerCase()}`, async () => {
    const response = await fetchJson<any>(`https://api.api-ninjas.com/v1/exercises?name=${encodeURIComponent(name)}`, {
      headers: { "X-Api-Key": readEnv("VITE_EXERCISE_API_KEY") ?? "" },
    });
    const first = Array.isArray(response) && response[0] ? response[0] : null;
    if (!first) throw new Error("No exercise data found");
    return {
      name: first.name ?? name,
      muscleGroup: first.muscle ?? "Full body",
      difficulty: first.difficulty === "beginner" || first.difficulty === "advanced" ? first.difficulty : "intermediate",
      equipment: Array.isArray(first.equipment) ? first.equipment : [String(first.equipment || "Bodyweight")],
      guidance: first.instructions ?? "Use controlled form and maintain a stable tempo.",
    } satisfies ExerciseReference;
  }, fallback, 30 * 60_000);
}

export async function getCurrencyRate(base: string, quote = "INR"): Promise<ExternalApiResponse<CurrencyQuote>> {
  const fallback: CurrencyQuote = {
    base,
    quote,
    rate: 1,
    timestamp: new Date().toISOString(),
  };

  const apiKey = readEnv("VITE_CURRENCY_API_KEY");
  if (!apiKey) {
    return { status: "fallback", fallback, error: "Currency API key not configured" };
  }

  return withFallback(`currency:${base}:${quote}`, async () => {
    const response = await fetchJson<any>(`https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}&apikey=${apiKey}`);
    return {
      base,
      quote,
      rate: Number(response?.result ?? 1),
      timestamp: new Date().toISOString(),
    } satisfies CurrencyQuote;
  }, fallback);
}

export { cache };
