// src/features/map/layers/ensureMaskingLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// 👇 MUST match your 3D buildings layer id in ensure3DBuildingsLayer.ts
export const BUILDING_3D_LAYER_ID = "3d-buildings";

// Single Australia-wide LGA dissolved layer
const MASK_SOURCE_ID = "lga_2025_aust_gda94_dissolved";
const MASK_FILL_LAYER_ID = `${MASK_SOURCE_ID}-fill`;
const MASK_OUTLINE_LAYER_ID = `${MASK_SOURCE_ID}-outline`;

// Find first symbol layer (labels)
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

// ❗ New: decide where to insert the mask
// Prefer: just *under* the 3D buildings layer, so 3D is always above the mask.
// Fallback: before first symbol layer.
const getMaskBeforeId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return getFirstSymbolLayerId(map);

  const has3D = style.layers.find((l) => l.id === BUILDING_3D_LAYER_ID);
  if (has3D) {
    return BUILDING_3D_LAYER_ID;
  }

  return getFirstSymbolLayerId(map);
};

export const removeMaskingLayer = (map: maplibregl.Map) => {
  if (map.getLayer(MASK_FILL_LAYER_ID)) {
    map.removeLayer(MASK_FILL_LAYER_ID);
  }
  if (map.getLayer(MASK_OUTLINE_LAYER_ID)) {
    map.removeLayer(MASK_OUTLINE_LAYER_ID);
  }
  if (map.getSource(MASK_SOURCE_ID)) {
    map.removeSource(MASK_SOURCE_ID);
  }

  const anyMap = map as any;

  // Just hide tooltip, keep handlers / element
  if (anyMap._maskHoverEl) {
    anyMap._maskHoverEl.style.display = "none";
  }
  // Don't flip _maskingEventsBound back to false here
};

export const ensureMaskingLayer = (map: maplibregl.Map) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureMaskingLayer(map);
    });
    return;
  }

  const beforeId = getMaskBeforeId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(MASK_SOURCE_ID)) {
    map.addSource(MASK_SOURCE_ID, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${MASK_SOURCE_ID}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Fill layer – dark slate mask with ~60% opacity
if (!map.getLayer(MASK_FILL_LAYER_ID)) {
  map.addLayer(
    {
      id: MASK_FILL_LAYER_ID,
      type: "fill",
      source: MASK_SOURCE_ID,
      "source-layer": MASK_SOURCE_ID,
      paint: {
        // very dark slate, but with opacity so basemap is still visible
        "fill-color": "#020617", // tailwind slate-950-ish
        "fill-opacity": 0.6,
      },
    },
    beforeId || undefined
  );
}

// 3) Outline layer – subtle dashed extent line
if (!map.getLayer(MASK_OUTLINE_LAYER_ID)) {
  map.addLayer(
    {
      id: MASK_OUTLINE_LAYER_ID,
      type: "line",
      source: MASK_SOURCE_ID,
      "source-layer": MASK_SOURCE_ID,
      paint: {
        "line-color": "#e5e7eb", // light gray around the mask
        "line-width": 1.2,
        "line-opacity": 0.9,
        "line-dasharray": [2, 2], // helps communicate “boundary”
      },
    },
    beforeId || undefined
  );
}

  // 4) Hover tooltip + cursor
  if (!anyMap._maskingEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._maskHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "masking-hover-label";
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
      anyMap._maskHoverEl = hoverEl;
    }

    map.on(
      "mousemove",
      MASK_FILL_LAYER_ID,
      (e: MapLayerMouseEvent) => {
        if (!hoverEl) return;

        hoverEl.innerHTML = `<div>Outside of study area</div>`;

        const { x, y } = e.point;
        hoverEl.style.left = `${x + 10}px`;
        hoverEl.style.top = `${y + 10}px`;
        hoverEl.style.display = "block";

        map.getCanvas().style.cursor = "pointer";
      }
    );

    map.on("mouseleave", MASK_FILL_LAYER_ID, () => {
      if (hoverEl) {
        hoverEl.style.display = "none";
      }
      map.getCanvas().style.cursor = "";
    });

    map.on("click", MASK_FILL_LAYER_ID, (e) => {
      const feature = e.features?.[0] as
        | maplibregl.MapGeoJSONFeature
        | undefined;
      if (!feature) return;
      console.log("Masking LGA feature click:", feature.properties);
    });

    anyMap._maskingEventsBound = true;
  }
};
