// src/api/routes/model.ts
import type { PotentialResultData, PredictionResultData } from "@/atoms/ModelAtom";
import { apiClient } from "../lib/client";

/* -------------------- Shared types -------------------- */

export type SubmittedRoad = { gid: number };

export type BikePathTypePayload = {
  painted: SubmittedRoad[];
  quiet: SubmittedRoad[];
  separated: SubmittedRoad[];
};

export type ComputeLengthPayload = {
  userid: number;
  location: string;
  bikepathtype: BikePathTypePayload;
};

/**
 * Shape of the JSON produced by df_wide.to_json()
 * on the backend for computeLengthFromSegmentFID.
 */
export type ComputeLengthBackendJson = {
  sa1_code21: Record<string, string>;
  painted: Record<string, number>;
  separated: Record<string, number>;
  quiet: Record<string, number>;
};

export type ComputeLengthResult = ComputeLengthBackendJson;

// Generic backend envelope: { status, message, data }
export type BackendEnvelope<T> = {
  status: number;
  message: string;
  data: T;
};

/**
 * Payload shape for the "changes" object used by the modelling endpoints.
 * This matches the backend expectation:
 * {
 *   "sa1_code21": { "0": "123", ... },
 *   "painted": { "0": 10.5, ... },
 *   ...
 * }
 */
export type ChangesPayload = {
  sa1_code21: Record<string, string>;
  painted: Record<string, number>;
  separated: Record<string, number>;
  quiet: Record<string, number>;
};

export type BaseModelRunPayload = {
  userid: number;
  location: string;
  modelyear: string;
  changes: ChangesPayload;
};

// /calculateAccessibility has no "scenarios"
export type AccessibilityPayload = BaseModelRunPayload;

// /calculatePredictionModel and /calculatePotentialModel *do* have scenarios
export type ScenarioModelPayload = BaseModelRunPayload & {
  scenarios: string;
};

/* -------------------- Result types -------------------- */

// From the docstring of calculateAccessibility:
// data: {"jobs":88637,"population":204594,"park":197,"school":59,"service":255,"transit":12}
export type AccessibilityData = {
  jobs: number;
  population: number;
  park: number;
  school: number;
  service: number;
  transit: number;
};

// From the example in calculatePredictionModel docstring
export type PredictionOverall = {
  increased_cycling_participation: number;
  additional_cyclists_transport: number;
  additional_cyclists_recreation: number;
  additional_trips_transport: number;
  additional_trips_recreation: number;
};

export type PredictionData = {
  overall: PredictionOverall;
  // backend returns these as JSON strings
  lga: string;
  poa: string;
};

// We don’t have a concrete example for potential;
// keep it loose for now. You can refine later once needed.
export type PotentialData = any;

/* -------------------- API functions -------------------- */

export async function computeLengthFromSegmentFID(
  payload: ComputeLengthPayload
): Promise<ComputeLengthResult> {
  const res = await apiClient.post("/fastapi/computeLengthFromSegmentFID/", payload);

  // Backend currently returns df_wide.to_json() → string.
  // Handle both string & already-parsed object just in case.
  if (typeof res.data === "string") {
    try {
      return JSON.parse(res.data) as ComputeLengthResult;
    } catch {
      // If parsing fails, just throw so it's obvious
      throw new Error("Failed to parse computeLengthFromSegmentFID response");
    }
  }

  return res.data as ComputeLengthResult;
}

export async function calculateAccessibility(
  payload: AccessibilityPayload
): Promise<AccessibilityData> {
  const res = await apiClient.post<BackendEnvelope<AccessibilityData>>(
    "/fastapi/calculateAccessibility/",
    payload
  );

  // Return only the inner "data" so components don’t deal with envelopes
  return res.data.data;
}

export async function calculatePredictionModel(
  payload: ScenarioModelPayload
): Promise<PredictionResultData> {
  const res = await apiClient.post<BackendEnvelope<PredictionResultData>>(
    "/fastapi/calculatePredictionModel/",
    payload
  );

  return res.data.data;
}

export async function calculatePotentialModel(
  payload: ScenarioModelPayload
): Promise<PotentialResultData> {
  const res = await apiClient.post<BackendEnvelope<PotentialResultData>>(
    "/fastapi/calculatePotentialModel/",
    payload
  );

  return res.data.data;
}
