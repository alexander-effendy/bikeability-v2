import { atom } from "jotai";

export const activeLayerAtom = atom<string | null>('cycling-metrics');
export const catchmentTypeAtom = atom<string>('school') // park, school service, shopping, transit
export const catchmentMinsAtom = atom<number>(5); // 5, 10, 15, 20, 25, 30