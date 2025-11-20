// src/features/map/layers/ensureSevereAccidentLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_poi_accidents tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_poi_accidents`;
  return {
    sourceId,
    outerLayerId: `${sourceId}-outer`,
    innerLayerId: `${sourceId}-inner`,
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

export const removeSevereAccidentLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city accident layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, outerLayerId, innerLayerId } = getIdsForCity(city);
    if (map.getLayer(innerLayerId)) map.removeLayer(innerLayerId);
    if (map.getLayer(outerLayerId)) map.removeLayer(outerLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._severeAccidentEventsBound = false;
};

export const ensureSevereAccidentLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureSevereAccidentLayer(map, city);
    });
    return;
  }

  const { sourceId, outerLayerId, innerLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
      // promoteId: "accident_id", // if you have one
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Outer red circle
  if (!map.getLayer(outerLayerId)) {
    map.addLayer(
      {
        id: outerLayerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "circle-radius": 10, // bigger outer radius
          "circle-color": "#ff3b30", // red
          "circle-opacity": 0.9,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
        },
      },
      beforeId || undefined
    );
  }

  // 3) Inner black dot
  if (!map.getLayer(innerLayerId)) {
    map.addLayer(
      {
        id: innerLayerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "circle-radius": 2.5, // smaller, centered
          "circle-color": "#000000",
          "circle-opacity": 1,
        },
      },
      beforeId || undefined
    );
  }

  // 4) Basic interactivity (cursor + click logging) – bind once for *all* cities
  if (!anyMap._severeAccidentEventsBound) {
    for (const c of CITY_LIST) {
      const { outerLayerId: outerId, innerLayerId: innerId } = getIdsForCity(c);
      const layers = [outerId, innerId];

      layers.forEach((layerId) => {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("click", layerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          console.log("Severe accident click:", {
            city: c,
            ...feature.properties,
          });
        });
      });
    }

    anyMap._severeAccidentEventsBound = true;
  }
};
