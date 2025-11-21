// src/features/map/layers/ensurePoiTransitLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

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

  // Remove hover tooltip if it exists
  if (anyMap._poiTransitHoverEl) {
    anyMap._poiTransitHoverEl.remove();
    anyMap._poiTransitHoverEl = undefined;
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

  // 2) Circle layer – brown-ish transit dots
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#7B3F00", // your chosen color
          "circle-opacity": 0.95,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
        },
      },
      beforeId || undefined
    );
  }

  // 3) Interactivity – hover tooltip + click log (bind once for all cities)
  if (!anyMap._poiTransitEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._poiTransitHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "poi-transit-hover-label";
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
      anyMap._poiTransitHoverEl = hoverEl;
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

        // Try a few likely fields – tweak these to match your schema
        const name =
          (props["name"] as string | undefined)?.trim() ||
          (props["stop_name"] as string | undefined)?.trim() ||
          (props["station"] as string | undefined)?.trim() ||
          "Transit stop";

        const routeOrType =
          (props["route"] as string | undefined)?.trim() ||
          (props["mode"] as string | undefined)?.trim() ||
          (props["type"] as string | undefined)?.trim();

        hoverEl!.innerHTML = routeOrType
          ? `<div>${name}</div><div style="font-weight:400;">${routeOrType}</div>`
          : `<div>${name}</div>`;

        const { x, y } = e.point;
        hoverEl!.style.left = `${x + 10}px`;
        hoverEl!.style.top = `${y + 10}px`;
        hoverEl!.style.display = "block";

        map.getCanvas().style.cursor = "pointer";
      });

      // Leave: hide tooltip + reset cursor
      map.on("mouseleave", lid, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      // Click logging (your existing behaviour)
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

export const TRANSIT_POI_LEGEND: LegendItem[] = [
  {
    label: "Transit",
    color: "#7B3F00",
  },
];
