// src/features/map/layers/currentCyclingConditions/ensurePurposeRatioLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";
import type { PurposeRatioType } from "@/atoms/LayerAtom";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_lga_purpose tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Columns (adjust if schema differs)
const LGA_ID_FIELD = "lga_code21";
const LGA_NAME_FIELD = "lga_name21";

// Map type -> column name (per your note: leisure_pc, commute_pc, utility_pc, sport_pc)
const getPurposeField = (purposeType: PurposeRatioType): string => {
  switch (purposeType) {
    case "commute":
      return "commute_pc";
    case "leisure":
      return "leisure_pc";
    case "utility":
      return "utility_pc";
    case "sports":
      return "sports_pct"; // adjust if your DB uses a different name
    default:
      return "commute_pc";
  }
};

const PURPOSE_LABEL: Record<PurposeRatioType, string> = {
  commute: "Commute",
  leisure: "Leisure",
  utility: "Utility",
  sports: "Sport",
};

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_lga_purpose`;
  return {
    sourceId,
    fillLayerId: `${sourceId}-fill`,
    outlineLayerId: `${sourceId}-outline`,
  };
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

export const removePurposeRatioLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._purposeHoverEl) {
    anyMap._purposeHoverEl.remove();
    anyMap._purposeHoverEl = undefined;
  }

  anyMap._purposeHoverBound = false;
  anyMap._purposeClickBound = false;
  anyMap._purposeFieldName = undefined;
  anyMap._purposeFieldLabel = undefined;
};

// --- color ramp for *_pc (percentage) ---
// Using your orange-ish ramp:
// 0–2, 2–4, 4–6, 6–10, 10–15, 15–20, 20%+
const baseFillForPurposeRatio = (valueExpr: any): any => {
  return [
    "step",
    valueExpr,

    // 0 – 2%
    "#fff7ed",  // orange-50
    2, "#ffedd5", // 2 – 4%
    4, "#fed7aa", // 4 – 6%
    6, "#fdba74", // 6 – 10%
    10, "#fb923c", // 10 – 15%
    15, "#f97316", // 15 – 20%
    20, "#7c2d12", // 20%+
  ];
};

const fillColorWithHover = (valueExpr: any): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#22c55e", // hover highlight
  baseFillForPurposeRatio(valueExpr),
];

export const ensurePurposeRatioLayer = (
  map: maplibregl.Map,
  city: CityId,
  purposeType: PurposeRatioType
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensurePurposeRatioLayer(map, city, purposeType);
    });
    return;
  }

  const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  const fieldName = getPurposeField(purposeType);
  const valueExpr: any = ["to-number", ["get", fieldName], 0];
  const fillColorExpr = fillColorWithHover(valueExpr);

  // Show polygons only where value > 0
  const fillOpacityExpr: any = [
    "case",
    [">", valueExpr, 0],
    0.8,
    0,
  ];

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
      promoteId: LGA_ID_FIELD,
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
          "line-width": 0.4,
          "line-opacity": 0.6,
        },
      },
      beforeId || undefined
    );
  }

  // Store the currently active field + label so hover can adapt
  anyMap._purposeFieldName = fieldName;
  anyMap._purposeFieldLabel = PURPOSE_LABEL[purposeType];

  // 4) Hover label (once per map – works across all cities)
  if (!anyMap._purposeHoverBound) {
    let hoveredId: string | number | null = null;
    let hoveredSourceId: string | null = null;

    const container = map.getContainer();
    let hoverEl = anyMap._purposeHoverEl as HTMLDivElement | undefined;
    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "lga-purpose-hover-label";
      hoverEl.style.position = "absolute";
      hoverEl.style.pointerEvents = "none";
      hoverEl.style.padding = "4px 8px";
      hoverEl.style.background = "rgba(255,255,255,0.95)";
      hoverEl.style.border = "1px solid rgba(0,0,0,0.1)";
      hoverEl.style.borderRadius = "6px";
      hoverEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
      hoverEl.style.font =
        "600 12px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
      hoverEl.style.whiteSpace = "nowrap";
      hoverEl.style.display = "none";
      hoverEl.style.color = "#111";
      container.appendChild(hoverEl);
      anyMap._purposeHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { sourceId: citySourceId, fillLayerId: cityFillId } =
        getIdsForCity(c);

      map.on(
        "mousemove",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const id =
            feature.id ??
            (LGA_ID_FIELD
              ? (feature.properties?.[LGA_ID_FIELD] as
                  | string
                  | number
                  | undefined)
              : undefined);

          // Only do feature-state highlight when we actually have an id
          if (
            id != null &&
            hoveredId !== null &&
            hoveredSourceId &&
            (hoveredId !== id || hoveredSourceId !== citySourceId)
          ) {
            map.setFeatureState(
              {
                source: hoveredSourceId,
                sourceLayer: hoveredSourceId,
                id: hoveredId,
              },
              { hover: false }
            );
          }

          if (id != null) {
            hoveredId = id;
            hoveredSourceId = citySourceId;

            map.setFeatureState(
              {
                source: citySourceId,
                sourceLayer: citySourceId,
                id,
              },
              { hover: true }
            );
          } else {
            hoveredId = null;
            hoveredSourceId = null;
          }

          const name =
            (LGA_NAME_FIELD &&
              (feature.properties?.[LGA_NAME_FIELD] as string | undefined)) ??
            (feature.properties?.name as string | undefined) ??
            "N/A";

          const activeFieldName: string =
            (map as any)._purposeFieldName ?? getPurposeField("commute");
          const activeLabel: string =
            (map as any)._purposeFieldLabel ?? "Purpose ratio";

          const raw = feature.properties?.[activeFieldName];
          let labelValue = "N/A";
          const num = Number(raw);
          if (raw != null && raw !== "" && Number.isFinite(num)) {
            // assume *_pc is already percent
            labelValue = `${num.toFixed(1)}%`;
          }

          hoverEl!.innerHTML = `
            <div>${String(name)}</div>
            <div style="font-weight:400;">
              ${activeLabel}: ${labelValue}
            </div>
          `;

          const { x, y } = e.point;
          hoverEl!.style.left = `${x + 10}px`;
          hoverEl!.style.top = `${y + 10}px`;
          hoverEl!.style.display = "block";

          map.getCanvas().style.cursor = "pointer";
        }
      );

      map.on("mouseleave", cityFillId, () => {
        if (hoveredId !== null && hoveredSourceId) {
          map.setFeatureState(
            {
              source: hoveredSourceId,
              sourceLayer: hoveredSourceId,
              id: hoveredId,
            },
            { hover: false }
          );
        }
        hoveredId = null;
        hoveredSourceId = null;
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });
    }

    anyMap._purposeHoverBound = true;
  }

  // 5) Click logging (once per map, per city layer)
  if (!anyMap._purposeClickBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: cityFillId } = getIdsForCity(c);

      map.on(
        "click",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const activeFieldName: string =
            (map as any)._purposeFieldName ?? getPurposeField("commute");
          const activeLabel: string =
            (map as any)._purposeFieldLabel ?? "Purpose ratio";

          console.log("LGA purpose ratio click:", {
            city: c,
            purposeField: activeFieldName,
            purposeLabel: activeLabel,
            value: feature.properties?.[activeFieldName],
            ...feature.properties,
          });
        }
      );
    }

    (map as any)._purposeClickBound = true;
  }
};

export const PURPOSE_RATIO_LEGEND: LegendItem[] = [
  {
    label: "0 – 2%",
    color: "#fff7ed",
  },
  {
    label: "2 – 4%",
    color: "#ffedd5",
  },
  {
    label: "4 – 6%",
    color: "#fed7aa",
  },
  {
    label: "6 – 10%",
    color: "#fdba74",
  },
  {
    label: "10 – 15%",
    color: "#fb923c",
  },
  {
    label: "15 – 20%",
    color: "#f97316",
  },
  {
    label: "20%+",
    color: "#7c2d12",
  },
];
