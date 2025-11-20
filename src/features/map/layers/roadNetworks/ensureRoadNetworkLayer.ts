// src/features/map/layers/ensureRoadNetworkLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_all tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_all`;
  return {
    sourceId,
    layerId: `${sourceId}-line`,
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

export const removeRoadNetworkLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city road network layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._roadNetworkEventsBound = false;
};

export const ensureRoadNetworkLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureRoadNetworkLayer(map, city);
    });
    return;
  }

  const { sourceId, layerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Line layer (simple gray network)
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#9ca3af", // gray
          "line-width": 1.4,
          "line-opacity": 0.8,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      },
      beforeId || undefined
    );
  }

  // 3) Optional simple interactivity – bind once for *all* city layers
  if (!anyMap._roadNetworkEventsBound) {
    for (const c of CITY_LIST) {
      const { layerId: lid } = getIdsForCity(c);

      map.on("mouseenter", lid, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", lid, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", lid, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        console.log("Road network click:", {
          city: c,
          ...feature.properties,
        });
      });
    }

    anyMap._roadNetworkEventsBound = true;
  }
};
