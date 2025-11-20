// sydneyBoundaryLgaLayer.ts
import maplibregl from "maplibre-gl";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// Martin tileset / table name
const SYDNEY_LGA_SOURCE_ID = "sydney_boundary_lga";
const SYDNEY_LGA_FILL_LAYER_ID = "sydney_boundary_lga-fill";
const SYDNEY_LGA_OUTLINE_LAYER_ID = "sydney_boundary_lga-outline";

// 🔴 CHANGE THIS to your actual numeric column (0.15 – 0.55+)
const VALUE_FIELD = "index_value";

// 🔴 CHANGE THIS to your LGA ID column (used for feature-state hover)
const LGA_ID_FIELD = "lga_code21"; // e.g. "lga_code21", "lga_code", etc.

// Optional: name field for hover label
const LGA_NAME_FIELD = "lga_name21";

// Reuse helper: find first symbol layer to insert under labels
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

export const removeSydneyBoundaryLgaLayers = (map: maplibregl.Map) => {
  if (map.getLayer(SYDNEY_LGA_FILL_LAYER_ID)) {
    map.removeLayer(SYDNEY_LGA_FILL_LAYER_ID);
  }
  if (map.getLayer(SYDNEY_LGA_OUTLINE_LAYER_ID)) {
    map.removeLayer(SYDNEY_LGA_OUTLINE_LAYER_ID);
  }
  if (map.getSource(SYDNEY_LGA_SOURCE_ID)) {
    map.removeSource(SYDNEY_LGA_SOURCE_ID);
  }

  const anyMap = map as any;
  if (anyMap._sydneyLgaHoverEl) {
    anyMap._sydneyLgaHoverEl.remove();
    anyMap._sydneyLgaHoverEl = undefined;
  }
  anyMap._sydneyLgaHoverBound = false;
  anyMap._sydneyLgaClickBound = false;
};

// --- color ramp 0.15 – 0.55+ ---

const baseFillForSydneyLga = (): any => {
  return [
    "step",
    ["to-number", ["get", VALUE_FIELD], 0],
    // value < 0.15 or 0
    "#eff6ff",
    0.15,
    "#dbeafe", // 0.15 – 0.25
    0.25,
    "#bfdbfe", // 0.25 – 0.35
    0.35,
    "#93c5fd", // 0.35 – 0.45
    0.45,
    "#60a5fa", // 0.45 – 0.55
    0.55,
    "#1d4ed8", // 0.55+
  ];
};

const fillColorWithHover = (): any => [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#ffcc00",
  baseFillForSydneyLga(),
];

// --- main helper ---

export const ensureSydneyBoundaryLgaLayers = (map: maplibregl.Map) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureSydneyBoundaryLgaLayers(map);
    });
    return;
  }

  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(SYDNEY_LGA_SOURCE_ID)) {
    map.addSource(SYDNEY_LGA_SOURCE_ID, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${SYDNEY_LGA_SOURCE_ID}`,
      // 🔴 make sure this matches an ID field in your table
      promoteId: LGA_ID_FIELD,
    } as maplibregl.VectorSourceSpecification);
  }

  const fillColorExpr = fillColorWithHover();

  // 2) Fill layer
  if (!map.getLayer(SYDNEY_LGA_FILL_LAYER_ID)) {
    map.addLayer(
      {
        id: SYDNEY_LGA_FILL_LAYER_ID,
        type: "fill",
        source: SYDNEY_LGA_SOURCE_ID,
        "source-layer": SYDNEY_LGA_SOURCE_ID,
        paint: {
          "fill-color": fillColorExpr,
          "fill-opacity": 0.7,
        },
      },
      beforeId || undefined
    );
  } else {
    map.setPaintProperty(SYDNEY_LGA_FILL_LAYER_ID, "fill-color", fillColorExpr);
  }

  // 3) Outline layer
  if (!map.getLayer(SYDNEY_LGA_OUTLINE_LAYER_ID)) {
    map.addLayer(
      {
        id: SYDNEY_LGA_OUTLINE_LAYER_ID,
        type: "line",
        source: SYDNEY_LGA_SOURCE_ID,
        "source-layer": SYDNEY_LGA_SOURCE_ID,
        paint: {
          "line-color": "#111111",
          "line-width": 0.4,
          "line-opacity": 0.8,
        },
      },
      beforeId || undefined
    );
  }

  // 4) Hover label (once)
  if (!anyMap._sydneyLgaHoverBound) {
    let hoveredId: string | number | null = null;

    const container = map.getContainer();
    let hoverEl = anyMap._sydneyLgaHoverEl as HTMLDivElement | undefined;
    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "sydney-lga-hover-label";
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
      anyMap._sydneyLgaHoverEl = hoverEl;
    }

    map.on("mousemove", SYDNEY_LGA_FILL_LAYER_ID, (e) => {
      const feature = e.features?.[0];
      if (!feature) {
        hoverEl!.style.display = "none";
        return;
      }

      const id =
        feature.id ??
        (LGA_ID_FIELD ? feature.properties?.[LGA_ID_FIELD] : undefined);
      if (id == null) return;

      if (hoveredId !== id) {
        if (hoveredId !== null) {
          map.setFeatureState(
            {
              source: SYDNEY_LGA_SOURCE_ID,
              sourceLayer: SYDNEY_LGA_SOURCE_ID,
              id: hoveredId,
            },
            { hover: false }
          );
        }
        hoveredId = id;
        map.setFeatureState(
          { source: SYDNEY_LGA_SOURCE_ID, sourceLayer: SYDNEY_LGA_SOURCE_ID, id },
          { hover: true }
        );
      }

      const name =
        (LGA_NAME_FIELD && feature.properties?.[LGA_NAME_FIELD]) ??
        feature.properties?.name ??
        "N/A";

      const raw = feature.properties?.[VALUE_FIELD];
      let labelValue = "N/A";
      const num = Number(raw);
      if (raw != null && raw !== "" && Number.isFinite(num)) {
        labelValue = num.toFixed(2); // 0.15 – 0.55 style
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

    map.on("mouseleave", SYDNEY_LGA_FILL_LAYER_ID, () => {
      if (hoveredId !== null) {
        map.setFeatureState(
          {
            source: SYDNEY_LGA_SOURCE_ID,
            sourceLayer: SYDNEY_LGA_SOURCE_ID,
            id: hoveredId,
          },
          { hover: false }
        );
      }
      hoveredId = null;
      hoverEl!.style.display = "none";
      map.getCanvas().style.cursor = "";
    });

    anyMap._sydneyLgaHoverBound = true;
  }

  // 5) Click logging (once)
  if (!anyMap._sydneyLgaClickBound) {
    map.on("click", SYDNEY_LGA_FILL_LAYER_ID, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      console.log("Sydney LGA click:", feature.properties);
    });

    anyMap._sydneyLgaClickBound = true;
  }
};
