// src/features/map/layers/ensureNetworkIslandLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_island tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_island`;
  return {
    sourceId,
    layerId: `${sourceId}-line`,
  };
};

// helper: insert below first symbol layer (labels)
const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

export const removeNetworkIslandLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city network_island layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._networkIslandEventsBound = false;
};

export const ensureNetworkIslandLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureNetworkIslandLayer(map, city);
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

  // 2) Line layer – color by new_is_100
  //
  // new_is_100 distinct values:
  //  1, 2, 3, 4, 5, 6+ (6 and above)
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": [
            "match",
            ["to-number", ["get", "new_is_100"]],
            1,
            "#000000", // black
            2,
            "#ef4444", // red
            3,
            "#3b82f6", // blue
            4,
            "#22c55e", // green
            5,
            "#fb923c", // orange
            // 6+ or anything else
            "#a855f7", // purple
          ],
          "line-width": 2.2,
          "line-opacity": 0.9,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      },
      beforeId || undefined
    );
  }

  // 3) Basic interactivity – bind once for *all* city layers
  if (!anyMap._networkIslandEventsBound) {
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
        console.log("Network island feature:", {
          city: c,
          new_is_100: feature.properties?.new_is_100,
          ...feature.properties,
        });
      });
    }

    anyMap._networkIslandEventsBound = true;
  }
};
