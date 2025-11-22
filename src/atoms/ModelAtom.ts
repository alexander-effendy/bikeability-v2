// src/atoms/ModelAtom.ts
import { atom } from "jotai";
import type { CityId } from "@/atoms/GeneralAtom";

export type RoadSegmentType = "painted" | "separated" | "quiet";

export type RoadType = {
  gid: number;
  name: string;
  city: CityId;
  length: number;
};

// selecting roads (step 1)
export const clickedRoadsAtom = atom<RoadType[]>([]);

// which segment the *current batch* belongs to
export const roadSegmentActiveAtom = atom<RoadSegmentType>("painted");

// submitted roads (step 2), bucketed by segment
export type SubmittedRoadsState = {
  painted: RoadType[];
  separated: RoadType[];
  quiet: RoadType[];
};

export const submittedRoadsAtom = atom<SubmittedRoadsState>({
  painted: [],
  separated: [],
  quiet: [],
});

export type ComputeLengthRawResponse = {
  sa1_code21: Record<string, string>;
  painted: Record<string, number>;
  separated: Record<string, number>;
  quiet: Record<string, number>;
};

// normalized row (what `normaliseResponse` returns)
export type NormalizedComputeLengthRow = {
  sa1_code21: string;
  painted: number;
  separated: number;
  quiet: number;
};

// this is what you actually want to store
export const computedRoadsAtom = atom<NormalizedComputeLengthRow[]>([]);