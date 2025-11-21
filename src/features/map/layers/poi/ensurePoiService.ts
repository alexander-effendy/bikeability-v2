// src/features/map/layers/ensurePoiServiceLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_poi_service tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_poi_service`;
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

export const removePoiServiceLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  // Remove all city service POI layers/sources
  for (const city of CITY_LIST) {
    const { sourceId, layerId } = getIdsForCity(city);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  // Remove hover tooltip if it exists
  if (anyMap._poiServiceHoverEl) {
    anyMap._poiServiceHoverEl.remove();
    anyMap._poiServiceHoverEl = undefined;
  }

  anyMap._poiServiceEventsBound = false;
};

export const ensurePoiServiceLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensurePoiServiceLayer(map, city);
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

  // 2) Circle layer – teal service dots
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "circle",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#0ea5e9", // teal/sky blue
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
  if (!anyMap._poiServiceEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._poiServiceHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "poi-service-hover-label";
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
      anyMap._poiServiceHoverEl = hoverEl;
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
        const name =
          (props["name"] as string | undefined)?.trim() ||
          (props["label"] as string | undefined)?.trim() ||
          "Service location";

        const category =
          (props["category"] as string | undefined)?.trim() ||
          (props["type"] as string | undefined)?.trim() ||
          (props["amenity"] as string | undefined)?.trim();

        hoverEl!.innerHTML = category
          ? `<div>${name}</div><div style="font-weight:400;">${category}</div>`
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

      // Click logging (kept from original)
      map.on("click", lid, (e) => {
        const feature = e.features?.[0] as
          | maplibregl.MapGeoJSONFeature
          | undefined;
        if (!feature) return;

        console.log("Service POI click:", {
          city: c,
          ...feature.properties,
        });
      });
    }

    anyMap._poiServiceEventsBound = true;
  }
};

export const SERVICE_POI_LEGEND: LegendItem[] = [
  {
    label: "Service",
    color: "#0ea5e9",
  },
];
