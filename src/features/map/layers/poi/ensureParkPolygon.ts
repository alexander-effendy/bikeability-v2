// src/features/map/layers/ensureBoundaryParkLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_boundary_park tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_boundary_park`;
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

export const removeBoundaryParkLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city park boundary layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, fillLayerId, outlineLayerId } = getIdsForCity(city);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._boundaryParkEventsBound = false;
};

export const ensureBoundaryParkLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureBoundaryParkLayer(map, city);
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
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Fill layer – light green parks
  if (!map.getLayer(fillLayerId)) {
    map.addLayer(
      {
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "fill-color": "#4ade80", // light green
          "fill-opacity": 0.5,
        },
      },
      beforeId || undefined
    );
  }

  // 3) Outline layer – darker green border
  if (!map.getLayer(outlineLayerId)) {
    map.addLayer(
      {
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#15803d",
          "line-width": 1,
          "line-opacity": 0.9,
        },
      },
      beforeId || undefined
    );
  }

  // 4) Simple interactivity – bind once for all city layers
  if (!anyMap._boundaryParkEventsBound) {
    for (const c of CITY_LIST) {
      const { fillLayerId: fid } = getIdsForCity(c);

      map.on("mouseenter", fid, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", fid, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", fid, (e) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        console.log("Park boundary click:", {
          city: c,
          ...feature.properties,
        });
      });
    }

    anyMap._boundaryParkEventsBound = true;
  }
};
