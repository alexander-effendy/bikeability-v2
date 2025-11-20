import { atom } from "jotai";

export type CityId = "sydney" | "melbourne" | "brisbane" | "perth";

export const technicalActiveAtom = atom<string>("current-cycling-conditions"); // can be maptiles, current-cycling-conditions, road-networks, densities, pois, bikespot, accessibility, modelling 
export const darkModeAtom = atom<boolean>(true);
export const activeCityAtom = atom<CityId>('sydney');