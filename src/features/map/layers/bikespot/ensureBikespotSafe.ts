// src/features/map/layers/ensureBikespotSafeLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_poi_bikespot tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_poi_bikespot`;
  return {
    sourceId,
    layerId: `${sourceId}-safe-circle`,
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

export const removeBikespotSafeLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city bikespot-safe layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  // Clean up hover tooltip
  if (anyMap._bikespotSafeHoverEl) {
    anyMap._bikespotSafeHoverEl.remove();
    anyMap._bikespotSafeHoverEl = undefined;
  }

  anyMap._bikespotSafeEventsBound = false;
};

export const ensureBikespotSafeLayer = (
  map: maplibregl.Map,
  city: CityId
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureBikespotSafeLayer(map, city);
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

  // 2) Circle layer – only "safe spot" in column "location t"
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        filter: [
          "==",
          ["downcase", ["get", "location t"]],
          "safe spot",
        ],
        paint: {
          "circle-radius": 7,
          "circle-color": "#22c55e", // green safe spots
          "circle-opacity": 0.95,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
        },
      },
      beforeId || undefined
    );
  }

  // 3) Hover + click interactivity – bind once for all city layers
  if (!anyMap._bikespotSafeEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._bikespotSafeHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "bikespot-safe-hover-label";
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
      anyMap._bikespotSafeHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { layerId: lid } = getIdsForCity(c);

      // Hover tooltip
      map.on("mousemove", lid, (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        const props = feature.properties ?? {};
        const loc =
          (props["location t"] as string | undefined)?.trim() ||
          "BikeSpot safe location";

        hoverEl!.innerHTML = `<div>${loc}</div>`;

        const { x, y } = e.point;
        hoverEl!.style.left = `${x + 10}px`;
        hoverEl!.style.top = `${y + 10}px`;
        hoverEl!.style.display = "block";

        map.getCanvas().style.cursor = "pointer";
      });

      // Mouse leave
      map.on("mouseleave", lid, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      // Click logging (your original behaviour)
      map.on("click", lid, (e) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        console.log("Bikespot SAFE click:", {
          city: c,
          location_t: feature.properties?.["location t"],
          ...feature.properties,
        });
      });
    }

    anyMap._bikespotSafeEventsBound = true;
  }
};

export const BIKESPOT_SAFE_POI_LEGEND: LegendItem[] = [
  {
    label: "BikeSpot Safe",
    color: "#22c55e",
  },
];
