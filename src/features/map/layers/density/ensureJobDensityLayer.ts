// src/features/map/layers/ensureJobDensityLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_job_density_sa2 tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Columns – tweak if schema differs
const VALUE_FIELD = "job_den";      // job density
const SA2_ID_FIELD = "sa2_code21";  // adjust if different
const SA2_NAME_FIELD = "sa2_name21";

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_job_density_sa2`;
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

export const removeJobDensityLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._jobHoverEl) {
    anyMap._jobHoverEl.remove();
    anyMap._jobHoverEl = undefined;
  }
  anyMap._jobHoverBound = false;
  anyMap._jobClickBound = false;
};

// --- color ramp for job_den ---
// Example values: 0, 0.127, 2.279, 3.086, 10, 17, etc
// Buckets (you can tweak later):
//   0 – 0.1
//   0.1 – 0.5
//   0.5 – 1
//   1 – 2
//   2 – 4
//   4 – 8
//   8 – 16
//   16+
const baseFillForJobDensity = (): any => {
  return [
    "step",
    ["to-number", ["get", VALUE_FIELD], 0],

    // 0 – 0.1
    "#fefce8",
    0.1, "#fef9c3",   // 0.1 – 0.5
    0.5, "#fef08a",   // 0.5 – 1
    1, "#fde047",   // 1 – 2
    2, "#facc15",   // 2 – 4
    4, "#eab308",   // 4 – 8
    8, "#ca8a04",   // 8 – 16
    16, "#854d0e"    // 16+
  ];
};

const fillColorWithHover = (): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#22c55e", // hover highlight (green)
  baseFillForJobDensity(),
];

export const ensureJobDensityLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureJobDensityLayer(map, city);
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
      promoteId: SA2_ID_FIELD,
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

  // 4) Hover label (once per map, across all cities)
  if (!anyMap._jobHoverBound) {
    let hoveredId: string | number | null = null;
    let hoveredSourceId: string | null = null;

    const container = map.getContainer();
    let hoverEl = anyMap._jobHoverEl as HTMLDivElement | undefined;
    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "sa2-job-hover-label";
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
      anyMap._jobHoverEl = hoverEl;
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
            (SA2_ID_FIELD
              ? (feature.properties?.[SA2_ID_FIELD] as
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
            (SA2_NAME_FIELD &&
              (feature.properties?.[SA2_NAME_FIELD] as string | undefined)) ??
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

    anyMap._jobHoverBound = true;
  }

  // 5) Click logging (once per map, per city layer)
  if (!anyMap._jobClickBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: cityFillId } = getIdsForCity(c);

      map.on(
        "click",
        cityFillId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;
          console.log(
            "Job density SA2 click:",
            feature.layer.id,
            feature.properties
          );
        }
      );
    }

    anyMap._jobClickBound = true;
  }
};
