// src/features/map/layers/ensureCyclistRatioLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { CyclistRatioType } from "@/atoms/LayerAtom";
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_cyclist_ratio tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// ID/name fields – tweak if schema differs
const AREA_ID_FIELD = "sa2_code21";
const AREA_NAME_FIELD = "sa2_name21";

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_cyclist_ratio`;
  return {
    sourceId,
    fillLayerId: `${sourceId}-fill`,
    outlineLayerId: `${sourceId}-outline`,
  };
};

// Decide which column to read based on type
const getValueField = (cyclistRatioType: CyclistRatioType): string => {
  if (cyclistRatioType === "total") {
    return "cyc_ratio";
  }
  // commute | leisure | sports | utility
  return cyclistRatioType;
};

const CYCLIST_RATIO_LABEL: Record<CyclistRatioType, string> = {
  total: "Cyclist ratio",
  commute: "Commute cyclist ratio",
  leisure: "Leisure cyclist ratio",
  sports: "Sport cyclist ratio",
  utility: "Utility cyclist ratio",
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

export const removeCyclistRatioLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._cycRatioHoverEl) {
    anyMap._cycRatioHoverEl.remove();
    anyMap._cycRatioHoverEl = undefined;
  }
  anyMap._cycRatioHoverBound = false;
  anyMap._cycRatioClickBound = false;
  anyMap._cycRatioFieldName = undefined;
  anyMap._cycRatioFieldLabel = undefined;
};

// --- color ramp for cyclist ratio ---
// Values are ~0.0 to ~0.5 (maybe a bit more).
// Buckets (in ratios, not %):
//   0 – 0.02
//   0.02 – 0.05
//   0.05 – 0.10
//   0.10 – 0.20
//   0.20 – 0.30
//   0.30 – 0.40
//   0.40+
const baseFillForCyclistRatio = (valueExpr: any): any => {
  return [
    "step",
    valueExpr,

    // 0 – 0.02
    "#f9fafb",
    0.02, "#e0f2fe", // 0.02 – 0.05
    0.05, "#bae6fd", // 0.05 – 0.10
    0.1, "#7dd3fc",  // 0.10 – 0.20
    0.2, "#38bdf8",  // 0.20 – 0.30
    0.3, "#0ea5e9",  // 0.30 – 0.40
    0.4, "#0369a1",  // 0.40+
  ];
};

const fillColorWithHover = (valueExpr: any): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#22c55e", // hover highlight (green)
  baseFillForCyclistRatio(valueExpr),
];

export const ensureCyclistRatioLayer = (
  map: maplibregl.Map,
  city: CityId,
  cyclistRatioType: CyclistRatioType
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureCyclistRatioLayer(map, city, cyclistRatioType);
    });
    return;
  }

  const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  const fieldName = getValueField(cyclistRatioType);
  const valueExpr: any = ["to-number", ["get", fieldName], 0];
  const fillColorExpr = fillColorWithHover(valueExpr);

  // Show polygons only where value > 0
  const fillOpacityExpr: any = [
    "case",
    [">", valueExpr, 0],
    0.75,
    0,
  ];

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
      promoteId: AREA_ID_FIELD,
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
          "line-width": 0.3,
          "line-opacity": 0.7,
        },
      },
      beforeId || undefined
    );
  }

  // Store current field + label so hover/click stay in sync
  anyMap._cycRatioFieldName = fieldName;
  anyMap._cycRatioFieldLabel =
    CYCLIST_RATIO_LABEL[cyclistRatioType] ?? "Cyclist ratio";

  // 4) Hover label (once per map – works across all cities)
  if (!anyMap._cycRatioHoverBound) {
    let hoveredId: string | number | null = null;
    let hoveredSourceId: string | null = null;

    const container = map.getContainer();
    let hoverEl = anyMap._cycRatioHoverEl as HTMLDivElement | undefined;
    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "cyclist-ratio-hover-label";
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
      anyMap._cycRatioHoverEl = hoverEl;
    }

    // Attach layer-specific handlers for ALL city layers
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
            (AREA_ID_FIELD
              ? (feature.properties?.[AREA_ID_FIELD] as
                  | string
                  | number
                  | undefined)
              : undefined);

          // Optional highlight: only if we actually have an id
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
            (AREA_NAME_FIELD &&
              (feature.properties?.[AREA_NAME_FIELD] as string | undefined)) ??
            (feature.properties?.name as string | undefined) ??
            "N/A";

          const activeFieldName: string =
            (map as any)._cycRatioFieldName ?? "cyc_ratio";
          const activeLabel: string =
            (map as any)._cycRatioFieldLabel ?? "Cyclist ratio";

          const raw = feature.properties?.[activeFieldName];
          let labelValue = "N/A";
          const num = Number(raw);
          if (raw != null && raw !== "" && Number.isFinite(num)) {
            // value is stored as ratio → show as %
            labelValue = `${(num * 100).toFixed(1)}%`;
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

    anyMap._cycRatioHoverBound = true;
  }

  // 5) Click logging (once per map, per city layer)
  if (!anyMap._cycRatioClickBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: cityFillId } = getIdsForCity(c);

      map.on(
        "click",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const activeFieldName: string =
            (map as any)._cycRatioFieldName ?? "cyc_ratio";
          const activeLabel: string =
            (map as any)._cycRatioFieldLabel ?? "Cyclist ratio";

          console.log("Cyclist ratio click:", {
            city: c,
            field: activeFieldName,
            label: activeLabel,
            value: feature.properties?.[activeFieldName],
            ...feature.properties,
          });
        }
      );
    }

    anyMap._cycRatioClickBound = true;
  }
};

export const CYCLIST_RATIO_LEGEND: LegendItem[] = [
  {
    label: "0 – 2%",
    color: "#f9fafb", // 0 – 0.02
  },
  {
    label: "2 – 5%",
    color: "#e0f2fe", // 0.02 – 0.05
  },
  {
    label: "5 – 10%",
    color: "#bae6fd", // 0.05 – 0.10
  },
  {
    label: "10 – 20%",
    color: "#7dd3fc", // 0.10 – 0.20
  },
  {
    label: "20 – 30%",
    color: "#38bdf8", // 0.20 – 0.30
  },
  {
    label: "30 – 40%",
    color: "#0ea5e9", // 0.30 – 0.40
  },
  {
    label: "40%+",
    color: "#0369a1", // 0.40+
  },
];
