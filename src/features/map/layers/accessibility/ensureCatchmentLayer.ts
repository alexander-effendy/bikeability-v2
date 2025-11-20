// src/features/map/layers/ensureCatchmentLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_catchment tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_catchment`;
  return {
    sourceId,
    fillLayerId: `${sourceId}-fill`,
    outlineLayerId: `${sourceId}-outline`,
  };
};

// Map type string to column name
const getCatchmentField = (catchmentType: string, mins: number): string => {
  // e.g. "park" + 20 -> "park_20"
  return `${catchmentType}_${mins}`;
};

// 🔧 Per-type color ramps (different ranges for park / school / service / etc)
const getCatchmentFillColorExpr = (
  catchmentType: string,
  fieldName: string
): any => {
  const valueExpr: any = ["to-number", ["get", fieldName], 0];

  switch (catchmentType) {
    case "park":
      // Park values you said can be ~2–100+
      // Buckets (tweak later): 0–5, 5–15, 15–30, 30–60, 60–100, 100+
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0 (invisible; opacity will also handle this)
        0.0001, "#ecfdf3", // >0 – 5
        5,      "#bbf7d0", // 5 – 15
        15,     "#4ade80", // 15 – 30
        30,     "#22c55e", // 30 – 60
        60,     "#16a34a", // 60 – 100
        100,    "#166534"  // 100+
      ];

    case "school":
      // Assume smaller-ish: 0–10
      // Buckets: 0–1, 1–3, 3–5, 5–7, 7–10, 10+
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0
        0.0001, "#f5f3ff", // >0 – 1
        1,      "#e0e7ff", // 1 – 3
        3,      "#c7d2fe", // 3 – 5
        5,      "#818cf8", // 5 – 7
        7,      "#4f46e5", // 7 – 10
        10,     "#3730a3"  // 10+
      ];

    case "service":
      // Say 0–20-ish
      // Buckets: 0–2, 2–5, 5–10, 10–15, 15–20, 20+
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0
        0.0001, "#fff7ed", // >0 – 2
        2,      "#ffedd5", // 2 – 5
        5,      "#fed7aa", // 5 – 10
        10,     "#fdba74", // 10 – 15
        15,     "#fb923c", // 15 – 20
        20,     "#c2410c"  // 20+
      ];

    case "shopping":
      // Maybe mid-range: 0–30
      // Buckets: 0–3, 3–8, 8–15, 15–22, 22–30, 30+
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0
        0.0001, "#fff1f2", // >0 – 3
        3,      "#ffe4e6", // 3 – 8
        8,      "#fecdd3", // 8 – 15
        15,     "#fb7185", // 15 – 22
        22,     "#e11d48", // 22 – 30
        30,     "#9f1239"  // 30+
      ];

    case "transit":
      // Assume 0–20
      // Buckets: 0–2, 2–5, 5–8, 8–12, 12–20, 20+
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0
        0.0001, "#ecfeff", // >0 – 2
        2,      "#cffafe", // 2 – 5
        5,      "#a5f3fc", // 5 – 8
        8,      "#22d3ee", // 8 – 12
        12,     "#06b6d4", // 12 – 20
        20,     "#0e7490"  // 20+
      ];

    default:
      // Generic 0–10 gray ramp
      return [
        "step",
        valueExpr,
        "rgba(0,0,0,0)", // <= 0
        0.0001, "#f9fafb", // >0 – 2
        2,      "#e5e7eb", // 2 – 4
        4,      "#d1d5db", // 4 – 6
        6,      "#9ca3af", // 6 – 8
        8,      "#6b7280", // 8 – 10
        10,     "#374151"  // 10+
      ];
  }
};

// Insert below first symbol layer (labels)
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

export const removeCatchmentLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._catchmentEventsBound = false;
};

export const ensureCatchmentLayer = (
  map: maplibregl.Map,
  city: CityId,
  catchmentType: string, // "park" | "school" | "service" | "shopping" | "transit"
  catchmentMins: number // 5 | 10 | 15 | 20 | 25 | 30
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureCatchmentLayer(map, city, catchmentType, catchmentMins);
    });
    return;
  }

  const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  const fieldName = getCatchmentField(catchmentType, catchmentMins);
  const fillColorExpr = getCatchmentFillColorExpr(catchmentType, fieldName);

  // Opacity still controlled by > 0
  const fillOpacityExpr: any = [
    "case",
    [">", ["to-number", ["get", fieldName], 0], 0],
    0.7,
    0,
  ];

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Fill layer
  if (!map.getLayer(fillLayerId)) {
    map.addLayer(
      {
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "fill-color": fillColorExpr,
          "fill-opacity": fillOpacityExpr,
        },
      },
      beforeId || undefined
    );
  } else {
    map.setPaintProperty(fillLayerId, "fill-color", fillColorExpr);
    map.setPaintProperty(fillLayerId, "fill-opacity", fillOpacityExpr);
  }

  // 3) Outline layer
  if (!map.getLayer(outlineLayerId)) {
    map.addLayer(
      {
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#111827",
          "line-width": 0.6,
          "line-opacity": 0.5,
        },
      },
      beforeId || undefined
    );
  }

  // 4) Interactivity – bind once for all city layers
  if (!anyMap._catchmentEventsBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: fid } = getIdsForCity(c);

      map.on("mouseenter", fid, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", fid, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", fid, (e) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        console.log("Catchment click:", {
          city: c,
          catchmentType,
          catchmentMins,
          field: fieldName,
          rawValue: feature.properties?.[fieldName],
          ...feature.properties,
        });
      });
    }

    anyMap._catchmentEventsBound = true;
  }
};
