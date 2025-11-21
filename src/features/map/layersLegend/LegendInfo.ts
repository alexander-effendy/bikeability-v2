// src/features/map/legend/legendConfig.ts

// These should match your activeLayerAtom possible values
export type LayerId =
  | "cycling-metrics"
  | "severe-cycling-crashes"
  | "road-network"
  | "existing-cycling-infrastructure"
  | "cycleway-network-connectivity"
  | "population-density"
  | "job-density"
  | "poi-schools"
  | "poi-service"
  | "poi-transit"
  | "poi-shopping"
  | "university-polygon"
  | "park-polygon"
  | "bikespot-safe"
  | "bikespot-unsafe"
  | "catchment";

// One row inside the legend
export type LegendItem = {
  label: string;
  color: string;          // hex or css color
  min?: number;           // optional numeric range
  max?: number | null;    // null = open-ended (e.g. "16+")
  shape?: "line" | "fill" | "circle"; // optional styling hint for UI
};

// Legend config per layer
export type LayerLegend = {
  id: LayerId;
  title: string;
  description?: string;
  items: LegendItem[];
};

// 👇 Centralised legend data
export const LegendInfo: LayerLegend[] = [
  {
    id: "existing-cycling-infrastructure",
    title: "Existing Cycling Infrastructure",
    items: [
      { label: "Separated / protected", color: "#22c55e", shape: "line" },
      { label: "Painted bicycle lane", color: "#3b82f6", shape: "line" },
      { label: "Shared path", color: "#eab308", shape: "line" },
      { label: "Shared zone / Quietway", color: "#8b5cf6", shape: "line" },
      {
        label: "Associated bike infrastructure",
        color: "#ec4899",
        shape: "line",
      },
      { label: "Other bike infrastructure", color: "#6b7280", shape: "line" },
    ],
  },
  {
    id: "population-density",
    title: "Population Density (POA)",
    items: [
      { label: "< 200",       color: "#fef2f2", min: 0,    max: 200,   shape: "fill" },
      { label: "200 – 500",   color: "#fee2e2", min: 200,  max: 500,   shape: "fill" },
      { label: "500 – 1,000", color: "#fecaca", min: 500,  max: 1000,  shape: "fill" },
      { label: "1,000 – 2,000", color: "#fca5a5", min: 1000, max: 2000, shape: "fill" },
      { label: "2,000 – 5,000", color: "#f87171", min: 2000, max: 5000, shape: "fill" },
      { label: "5,000 – 10,000", color: "#ef4444", min: 5000, max: 10000, shape: "fill" },
      { label: "10,000 – 20,000", color: "#b91c1c", min: 10000, max: 20000, shape: "fill" },
      { label: "20,000+",     color: "#7f1d1d", min: 20000, max: null, shape: "fill" },
    ],
  },
  {
    id: "job-density",
    title: "Job Density (SA2)",
    items: [
      { label: "0 – 0.1",  color: "#fefce8", min: 0,   max: 0.1,  shape: "fill" },
      { label: "0.1 – 0.5", color: "#fef9c3", min: 0.1, max: 0.5, shape: "fill" },
      { label: "0.5 – 1",  color: "#fef08a", min: 0.5, max: 1,    shape: "fill" },
      { label: "1 – 2",    color: "#fde047", min: 1,   max: 2,    shape: "fill" },
      { label: "2 – 4",    color: "#facc15", min: 2,   max: 4,    shape: "fill" },
      { label: "4 – 8",    color: "#eab308", min: 4,   max: 8,    shape: "fill" },
      { label: "8 – 16",   color: "#ca8a04", min: 8,   max: 16,   shape: "fill" },
      { label: "16+",      color: "#854d0e", min: 16,  max: null, shape: "fill" },
    ],
  },
  {
    id: "bikespot-safe",
    title: "Bikespot – Safe locations",
    items: [{ label: "Safe spot", color: "#22c55e", shape: "circle" }],
  },
  {
    id: "bikespot-unsafe",
    title: "Bikespot – Unsafe locations",
    items: [{ label: "Unsafe spot", color: "#ef4444", shape: "circle" }],
  },
  {
    id: "catchment",
    title: "Catchment Accessibility",
    description:
      "Colour represents destination type; opacity represents within selected travel time.",
    items: [
      { label: "Park",    color: "#22c55e", shape: "fill" },
      { label: "School",  color: "#8b5cf6", shape: "fill" },
      { label: "Service", color: "#f97316", shape: "fill" },
      { label: "Shopping", color: "#ec4899", shape: "fill" },
      { label: "Transit", color: "#14b8a6", shape: "fill" },
    ],
  },
  // TODO: add more layers (poi-schools, poi-service, university-polygon, etc.)
];

// Small helper for easier lookup
export const getLegendForLayer = (id: LayerId) =>
  LegendInfo.find((entry) => entry.id === id) ?? null;
