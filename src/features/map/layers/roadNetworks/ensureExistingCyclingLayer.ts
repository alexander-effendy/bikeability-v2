// src/features/map/layers/ensureExistingCyclingLayer.ts
import maplibregl from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_cycling tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_cycling`;
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

export const removeExistingCyclingLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city cycling layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  anyMap._existingCyclingEventsBound = false;
};

export const ensureExistingCyclingLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureExistingCyclingLayer(map, city);
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

  // 2) Line layer with color by `facility`
  //
  // Distinct values expected:
  //  - Other bike infrastructure
  //  - Painted bicycle lane
  //  - Shared path
  //  - Separated/protected
  //  - Associated bike infrastructure
  //  - Shared zone/Quietway
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
            ["get", "facility"],
            "Separated/protected",
            "#22c55e", // green
            "Painted bicycle lane",
            "#3b82f6", // blue
            "Shared path",
            "#eab308", // yellow
            "Shared zone/Quietway",
            "#8b5cf6", // purple
            "Associated bike infrastructure",
            "#ec4899", // pink
            "Other bike infrastructure",
            "#6b7280", // neutral gray
            // default fallback
            "#9ca3af",
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

  // 3) Simple interactivity – bind once for all city layers
  if (!anyMap._existingCyclingEventsBound) {
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
        console.log("Existing cycling facility:", {
          city: c,
          facility: feature.properties?.facility,
          ...feature.properties,
        });
      });
    }

    anyMap._existingCyclingEventsBound = true;
  }
};

export const EXISTING_CYCLING_LINE_LEGEND: LegendItem[] = [
  {
    label: "Separated / protected",
    color: "#22c55e",
  },
  {
    label: "Painted bicycle lane",
    color: "#3b82f6",
  },
  {
    label: "Shared path",
    color: "#eab308",
  },
  {
    label: "Shared zone / Quietway",
    color: "#8b5cf6",
  },
  {
    label: "Associated bike infrastructure",
    color: "#ec4899",
  },
  {
    label: "Other bike infrastructure",
    color: "#6b7280",
  },
];