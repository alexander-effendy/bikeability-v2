// src/features/map/layers/3d/ensure3DBuildingsLayer.ts
import maplibregl from "maplibre-gl";

const BUILDINGS_3D_LAYER_ID = "3d-buildings";

// Find first symbol layer to insert below labels
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

// Try to discover a "building" layer in the current style
const getBuildingSourceInfo = (
  map: maplibregl.Map
):
  | {
      sourceId: string;
      sourceLayer: string;
    }
  | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;

  for (const layer of style.layers) {
    const anyLayer = layer as any;
    const sourceLayer = anyLayer["source-layer"] as string | undefined;
    const source = anyLayer.source as string | undefined;

    if (!sourceLayer || !source) continue;

    const idLower = layer.id.toLowerCase();
    const srcLayerLower = sourceLayer.toLowerCase();

    const looksLikeBuilding =
      srcLayerLower.includes("building") || idLower.includes("building");

    if (looksLikeBuilding) {
      return { sourceId: source, sourceLayer };
    }
  }

  return undefined;
};

export const remove3DBuildingsLayer = (map: maplibregl.Map) => {
  if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
    map.removeLayer(BUILDINGS_3D_LAYER_ID);
  }
};

export const ensure3DBuildingsLayer = (map: maplibregl.Map) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => ensure3DBuildingsLayer(map));
    return;
  }

  // Already added?
  if (map.getLayer(BUILDINGS_3D_LAYER_ID)) return;

  const info = getBuildingSourceInfo(map);
  if (!info) {
    // Important: don't throw, just bail
    console.warn(
      "[ensure3DBuildingsLayer] No building source/source-layer found in this style; skipping 3D buildings."
    );
    return;
  }

  const { sourceId, sourceLayer } = info;
  const beforeId = getFirstSymbolLayerId(map);

  map.addLayer(
    {
      id: BUILDINGS_3D_LAYER_ID,
      type: "fill-extrusion",
      source: sourceId,
      "source-layer": sourceLayer,
      minzoom: 14,
      paint: {
        // Soft grey-ish buildings
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          "#e5e7eb",
          16,
          "#d1d5db",
        ],
        // Use height attributes if present; otherwise 0
        "fill-extrusion-height": [
          "case",
          ["has", "render_height"],
          ["to-number", ["get", "render_height"], 0],
          ["has", "height"],
          ["to-number", ["get", "height"], 0],
          0,
        ],
        "fill-extrusion-base": [
          "case",
          ["has", "render_min_height"],
          ["to-number", ["get", "render_min_height"], 0],
          ["has", "min_height"],
          ["to-number", ["get", "min_height"], 0],
          0,
        ],
        "fill-extrusion-opacity": 0.9,
      },
    },
    beforeId || undefined
  );
};
