import type { ComputeLengthRawResponse, NormalizedComputeLengthRow } from "@/atoms/ModelAtom";


export function normaliseResponse(raw: ComputeLengthRawResponse): NormalizedComputeLengthRow[] {
  const indices = Object.keys(raw.sa1_code21); // ["0", "1", ...]
  return indices.map((idx) => ({
    sa1_code21: raw.sa1_code21[idx],
    painted: raw.painted[idx] ?? 0,
    separated: raw.separated[idx] ?? 0,
    quiet: raw.quiet[idx] ?? 0,
  }));
}