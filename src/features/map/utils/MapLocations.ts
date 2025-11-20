import type { CityId } from "@/atoms/GeneralAtom";

export interface CityViewConfig {
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export const CITY_VIEWS: Record<CityId, CityViewConfig> = {
  sydney: {
    center: [151.2093, -33.8688],
    zoom: 11,
  },
  melbourne: {
    center: [144.9631, -37.8136],
    zoom: 11,
  },
  brisbane: {
    center: [153.0251, -27.4698],
    zoom: 11,
  },
  perth: {
    center: [115.8570, -31.9523],
    zoom: 11,
  },
};