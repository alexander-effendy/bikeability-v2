// src/features/map/layers/ensurePopulationDensityLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_boundary_poa tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Data columns – tweak if your schema differs
const VALUE_FIELD = "pop_den";      // population / density field
const POA_ID_FIELD = "poa_code21";  // ABS code, adjust if different
const POA_NAME_FIELD = "poa_name21";

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_boundary_poa`;
  return {
    sourceId,
    fillLayerId: `${sourceId}-fill`,
    outlineLayerId: `${sourceId}-outline`,
  };
};

// Reuse helper: find first symbol layer to insert below labels
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

export const removePopulationDensityLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city POA layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._poaHoverEl) {
    anyMap._poaHoverEl.remove();
    anyMap._poaHoverEl = undefined;
  }
  anyMap._poaHoverBound = false;
  anyMap._poaClickBound = false;
};

// --- color ramp for pop_den ---
// You said values can be big (200k, 19M, etc), so let's use broad buckets:
//
//   < 20k         very light
//   20k–50k
//   50k–100k
//   100k–200k
//   200k–500k
//   500k–1M
//   1M–2M
//   2M+           darkest
//
const baseFillForPopulation = (): any => {
  return [
    "step",
    ["to-number", ["get", VALUE_FIELD], 0],

    // < 20k
    "#fef2f2",
    200, "#fee2e2",  // 20k – 50k
    500, "#fecaca",  // 50k – 100k
    1000, "#fca5a5", // 100k – 200k
    2000, "#f87171", // 200k – 500k
    5000, "#ef4444", // 500k – 1M
    10000, "#b91c1c",// 1M – 2M
    20000, "#7f1d1d" // 2M+
  ];
};

const fillColorWithHover = (): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#ffcc00", // hover color
  baseFillForPopulation(),
];

// --- main helper ---

export const ensurePopulationDensityLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensurePopulationDensityLayer(map, city);
    });
    return;
  }

  const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
      promoteId: POA_ID_FIELD,
    } as maplibregl.VectorSourceSpecification);
  }

  const fillColorExpr = fillColorWithHover();

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
          "fill-opacity": 0.75,
        },
      },
      beforeId || undefined
    );
  } else {
    map.setPaintProperty(fillLayerId, "fill-color", fillColorExpr);
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

  // 4) Hover label (once per map – works across all cities)
  if (!anyMap._poaHoverBound) {
    let hoveredId: string | number | null = null;
    let hoveredSourceId: string | null = null;

    const container = map.getContainer();
    let hoverEl = anyMap._poaHoverEl as HTMLDivElement | undefined;
    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "poa-hover-label";
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
      anyMap._poaHoverEl = hoverEl;
    }

    // Attach layer-specific handlers for ALL city layers
    for (const c of CITY_LIST) {
      const { sourceId: citySourceId, fillLayerId: cityFillId } =
        getIdsForCity(c);

      // Move within a fill polygon
      map.on(
        "mousemove",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const id =
            feature.id ??
            (POA_ID_FIELD
              ? (feature.properties?.[POA_ID_FIELD] as
                | string
                | number
                | undefined)
              : undefined);
          if (id == null) return;

          // Clear previous highlight if different
          if (
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

          const name =
            (POA_NAME_FIELD &&
              (feature.properties?.[POA_NAME_FIELD] as string | undefined)) ??
            (feature.properties?.name as string | undefined) ??
            "N/A";

          const raw = feature.properties?.[VALUE_FIELD];
          let labelValue = "N/A";
          const num = Number(raw);
          if (raw != null && raw !== "" && Number.isFinite(num)) {
            labelValue = num.toFixed(2);
          }

          hoverEl!.innerHTML = `
                <div>${String(name)}</div>
                <div style="font-weight:400;">
                  ${VALUE_FIELD}: ${labelValue}
                </div>
              `;

          const { x, y } = e.point;
          hoverEl!.style.left = `${x + 10}px`;
          hoverEl!.style.top = `${y + 10}px`;
          hoverEl!.style.display = "block";

          map.getCanvas().style.cursor = "pointer";
        }
      );

      // When leaving that city layer
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

    anyMap._lgaHoverBound = true;
  }

  // 5) Click logging (once per map, per city layer)
  if (!anyMap._poaClickBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: cityFillId } = getIdsForCity(c);

      map.on(
        "click",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;
          console.log("POA population density click:", feature.layer.id, feature.properties);
        }
      );
    }

    anyMap._poaClickBound = true;
  }
};
