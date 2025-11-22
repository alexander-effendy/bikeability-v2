// src/lib/api/model.ts
import { apiClient } from "./client";
import type { CityId } from "@/atoms/GeneralAtom";
import type { RoadSegmentType } from "@/atoms/ModelAtom";

/** Payload shape that your FastAPI endpoint expects */
export type SubmitRoadsPayload = {
  city: CityId;
  segment: RoadSegmentType; // "painted" | "separated" | "quiet"
  roads: {
    gid: number;
    name: string;
    length: number;
  }[];
};

export type RunModelPayload = {
  // example shape – adapt to your FastAPI schema
  painted: SubmitRoadsPayload["roads"];
  separated: SubmitRoadsPayload["roads"];
  quiet: SubmitRoadsPayload["roads"];
};

export type RunModelResponse = {
  job_id: string;
  status: "queued" | "running" | "finished" | "failed";
  // anything else your FastAPI returns
};

// 🔹 POST /model/submit-roads  (example endpoint)
export const submitRoadsApi = async (payload: SubmitRoadsPayload) => {
  const res = await apiClient.post("/model/submit-roads", payload);
  return res.data;
};

// 🔹 POST /model/run
export const runModelApi = async (payload: RunModelPayload) => {
  const res = await apiClient.post<RunModelResponse>("/model/run", payload);
  return res.data;
};
