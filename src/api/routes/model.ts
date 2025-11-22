// src/api/routes/model.ts
import { apiClient } from "../lib/client";

export type SubmittedRoad = { gid: number };

export type BikePathTypePayload = {
  painted: SubmittedRoad[];
  quiet: SubmittedRoad[];
  separated: SubmittedRoad[];
};

export type ComputeLengthPayload = {
  userid: number,
  location: string,
  // keycloak: string,
  bikepathtype: BikePathTypePayload;
};

// Shape of backend response:
// backend currently returns df_wide.to_json() → a JSON string.
// We'll handle both string & object just in case.
export type ComputeLengthResult = any;

export async function computeLengthFromSegmentFID(
  payload: ComputeLengthPayload
): Promise<ComputeLengthResult> {
  // NOTE: adjust path if your backend uses a /fastapi prefix
  // e.g. "/fastapi/computeLengthFromSegmentFID/"
  console.log('paylod is')
  console.log(payload)
  const res = await apiClient.post(
    "/fastapi/computeLengthFromSegmentFID/",
    payload
  );

  // If backend returned a JSON string, parse it
  if (typeof res.data === "string") {
    try {
      return JSON.parse(res.data);
    } catch {
      // if it's not parseable, just return raw
      return res.data;
    }
  }

  return res.data;
}

// ----- shared types for modelling calls -----
export type ChangesPayload = {
  sa1_code21: Record<string, string>;
  painted: Record<string, number>;
  separated: Record<string, number>;
  quiet: Record<string, number>;
};

export type ModelRunPayload = {
  userid: number;
  location: string;
  modelyear: string;
  changes: ChangesPayload;
};

export async function calculateAccessibility(payload: ModelRunPayload) {
  const res = await apiClient.post(
    "/fastapi/calculateAccessibility/",
    payload
  );
  return res.data;
}

export async function calculatePredictionModel(payload: ModelRunPayload) {
  const res = await apiClient.post(
    "/fastapi/calculatePredictionModel/",
    payload
  );
  return res.data;
}

export async function calculatePotentialModel(payload: ModelRunPayload) {
  const res = await apiClient.post(
    "/fastapi/calculatePotentialModel/",
    payload
  );
  return res.data;
}
