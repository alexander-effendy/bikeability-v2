// ensureBoundaryLgaLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_boundary_lga tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Common column names (adjust if different per city)
const VALUE_FIELD = "index_value";
const LGA_ID_FIELD = "lga_code21";
const LGA_NAME_FIELD = "lga_name21";

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_boundary_lga`;
  return {
    sourceId,
    fillLayerId: `${sourceId}-fill`,
    outlineLayerId: `${sourceId}-outline`,
  };
};

// Find first symbol layer to insert underneath labels
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

export const removeBoundaryLgaLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city LGA layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._lgaHoverEl) {
    anyMap._lgaHoverEl.remove();
    anyMap._lgaHoverEl = undefined;
  }
  anyMap._lgaHoverBound = false;
  anyMap._lgaClickBound = false;
};

// --- color ramp 0.15 – 0.55+ ---

const baseFillForLga = (): any => {
  return [
    "step",
    ["to-number", ["get", VALUE_FIELD], 0],
    "#eff6ff", // < 0.15 or 0
    0.15, "#dbeafe", // 0.15 – 0.25
    0.25, "#bfdbfe", // 0.25 – 0.35
    0.35, "#93c5fd", // 0.35 – 0.45
    0.45, "#60a5fa", // 0.45 – 0.55
    0.55, "#1d4ed8", // 0.55+
  ];
};

const fillColorWithHover = (): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#ffcc00",
  baseFillForLga(),
];

// --- main helper ---

export const ensureBoundaryLgaLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureBoundaryLgaLayer(map, city);
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
      promoteId: LGA_ID_FIELD,
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
          "fill-opacity": 0.7,
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
          "line-color": "#111111",
          "line-width": 0.4,
          "line-opacity": 0.8,
        },
      },
      beforeId || undefined
    );
  }

  // 4) Hover label (once per map)
if (!anyMap._lgaHoverBound) {
  let hoveredId: string | number | null = null;
  let hoveredSourceId: string | null = null;

  const container = map.getContainer();
  let hoverEl = anyMap._lgaHoverEl as HTMLDivElement | undefined;
  if (!hoverEl) {
    hoverEl = document.createElement("div");
    hoverEl.className = "city-lga-hover-label";
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
    anyMap._lgaHoverEl = hoverEl;
  }

  const LGA_FILL_LAYER_IDS = CITY_LIST.map(
    (c) => `${c}_boundary_lga-fill`
  );

  map.on("mousemove", (e) => {
    // TS-safe: use queryRenderedFeatures instead of e.features
    const features = map.queryRenderedFeatures(e.point, {
      layers: LGA_FILL_LAYER_IDS,
    });

    const feature = features[0];
    if (!feature) {
      // no feature under cursor → clear hover state
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
      return;
    }

    const sourceId = feature.source as string;
    const id =
      feature.id ??
      (LGA_ID_FIELD
        ? (feature.properties?.[LGA_ID_FIELD] as string | number | undefined)
        : undefined);
    if (id == null) return;

    if (hoveredId !== id || hoveredSourceId !== sourceId) {
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
      hoveredId = id;
      hoveredSourceId = sourceId;
      map.setFeatureState(
        { source: sourceId, sourceLayer: sourceId, id },
        { hover: true }
      );
    }

    const name =
      (LGA_NAME_FIELD &&
        (feature.properties?.[LGA_NAME_FIELD] as string | undefined)) ??
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
  });

  anyMap._lgaHoverBound = true;
}

// 5) Click logging (once per map)
if (!anyMap._lgaClickBound) {
  const LGA_FILL_LAYER_IDS = CITY_LIST.map(
    (c) => `${c}_boundary_lga-fill`
  );

  map.on("click", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: LGA_FILL_LAYER_IDS,
    });
    const feature = features[0];
    if (!feature) return;
    console.log("City LGA click:", feature.layer.id, feature.properties);
  });

  anyMap._lgaClickBound = true;
}

};
