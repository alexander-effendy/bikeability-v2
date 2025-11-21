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
