// src/features/map/layers/ensureRoadNetworkLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_all tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_all`;
  return {
    sourceId,
    visibleLayerId: `${sourceId}-line`,
    hitLayerId: `${sourceId}-hit`,   // 👈 invisible buffer layer id
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
    const { sourceId, visibleLayerId, hitLayerId } = getIdsForCity(city);
    if (map.getLayer(hitLayerId)) map.removeLayer(hitLayerId);       // remove hit layer
    if (map.getLayer(visibleLayerId)) map.removeLayer(visibleLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  // Clean up hover tooltip
  if (anyMap._roadHoverEl) {
    anyMap._roadHoverEl.remove();
    anyMap._roadHoverEl = undefined;
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

  const { sourceId, visibleLayerId, hitLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Visible line layer (what you actually see)
  if (!map.getLayer(visibleLayerId)) {
    map.addLayer(
      {
        id: visibleLayerId,
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

  // 3) Invisible "hit" layer = the buffer 🎯
  //
  // This is the BUFFER: big line-width, opacity 0, used only for events.
  if (!map.getLayer(hitLayerId)) {
    map.addLayer(
      {
        id: hitLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#000000", // doesn't matter, it's invisible
          "line-width": 5,        // 👈 increase this for bigger buffer
          "line-opacity": 0,       // fully transparent
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      },
      beforeId || undefined
    );
  }

  // 4) Interactivity (hover tooltip + click log) – bind once for *all* city layers
  if (!anyMap._roadNetworkEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._roadHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "road-network-hover-label";
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
      anyMap._roadHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { hitLayerId: hitId } = getIdsForCity(c);

      // Use the HIT layer for interactions
      map.on(
        "mousemove",
        hitId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const props = feature.properties ?? {};
          const name =
            (props["name"] as string | undefined)?.trim() || "Unnamed road";

          hoverEl!.innerHTML = `<div>${name}</div>`;

          const { x, y } = e.point;
          hoverEl!.style.left = `${x + 10}px`;
          hoverEl!.style.top = `${y + 10}px`;
          hoverEl!.style.display = "block";

          map.getCanvas().style.cursor = "pointer";
        }
      );

      map.on("mouseleave", hitId, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      map.on("click", hitId, (e) => {
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

export const ROAD_NETWORK_LINE_LEGEND: LegendItem[] = [
  {
    label: "Road Network",
    color: "#9ca3af", // match visible line-color
  },
];
