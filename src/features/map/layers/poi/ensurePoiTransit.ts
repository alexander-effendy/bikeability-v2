// src/features/map/layers/ensurePoiTransitLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_poi_transit tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_poi_transit`;
  return {
    sourceId,
    layerId: `${sourceId}-circle`,
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

export const removePoiTransitLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city transit POI layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._poiTransitEventsBound = false;
};

export const ensurePoiTransitLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensurePoiTransitLayer(map, city);
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

  // 2) Circle layer – purple transit dots
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#6366f1", // indigo / purple-ish
          "circle-opacity": 0.95,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
        },
      },
      beforeId || undefined
    );
  }

  // 3) Simple interactivity – bind once for all city layers
  if (!anyMap._poiTransitEventsBound) {
    for (const c of CITY_LIST) {
      const { layerId: lid } = getIdsForCity(c);

      map.on("mouseenter", lid, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", lid, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", lid, (e) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        console.log("Transit POI click:", {
          city: c,
          ...feature.properties,
        });
      });
    }

    anyMap._poiTransitEventsBound = true;
  }
};
