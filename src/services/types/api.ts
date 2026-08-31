export type ApiStatus = "success" | "fallback" | "error";

export interface ExternalApiResponse<T> {
  status: ApiStatus;
  data?: T;
  fallback?: T;
  error?: string;
  source?: string;
}

export interface GeoLocation {
  displayName: string;
  latitude: number;
  longitude: number;
  country: string;
  city: string;
}

export interface WeatherConditions {
  city: string;
  country: string;
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  windKph: number;
  timestamp: string;
}

export interface AirQuality {
  city: string;
  country: string;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  timestamp: string;
}

export interface ExerciseReference {
  name: string;
  muscleGroup: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  guidance: string;
}

export interface CurrencyQuote {
  base: string;
  quote: string;
  rate: number;
  timestamp: string;
}
