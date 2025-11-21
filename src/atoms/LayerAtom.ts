import { atom } from "jotai";

export type CyclistRatioType = "commute" | "leisure" | "sports" | "utility" | "total";
export type PurposeRatioType = "commute" | "leisure" | "sports" | "utility";

export const activeLayerAtom = atom<string | null>('cyclist-ratio');
export const cyclistRatioTypeAtom = atom<CyclistRatioType>('leisure');
export const purposeRatioTypeAtom = atom<PurposeRatioType>('leisure');
export const accidentClusterAtom = atom<boolean>(false);
export const catchmentTypeAtom = atom<string>('school') // park, school service, shopping, transit
export const catchmentMinsAtom = atom<number>(5); // 5, 10, 15, 20, 25, 30]
export const networkIslandLengthAtom = atom<number>(100); // 100, 200, 300