// src/features/map/layers/ensureSevereAccidentLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
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

  // Just hide tooltip, keep DOM element so we can reuse it
  if (anyMap._severeAccidentHoverEl) {
    anyMap._severeAccidentHoverEl.style.display = "none";
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

  // 4) Hover + cursor + click – bind once for *all* cities
  if (!anyMap._severeAccidentEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._severeAccidentHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "severe-accident-hover-label";
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
      anyMap._severeAccidentHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { outerLayerId: outerId, innerLayerId: innerId } = getIdsForCity(c);
      const layers = [outerId, innerId];

      layers.forEach((layerId) => {
        // hover / tooltip
        map.on(
          "mousemove",
          layerId,
          (e: MapLayerMouseEvent) => {
            const feature = e.features?.[0];
            if (!feature) return;

            const props = feature.properties || {};

            // Try to pull something location-ish if it exists
            const lga =
              (props["lga"] as string | undefined) ??
              (props["loc_suburb"] as string | undefined) ??
              (props["road_name"] as string | undefined) ??
              (props["lga_name"] as string | undefined) ?? "N/A";
            const othe_traf =
              (props["othe_traf"] as string | undefined) ??
              (props["accident_t"] as string | undefined) ??
              (props["crash_traf"] as string | undefined) ?? "N/A";
            const rum_desc =
              (props["rum_desc"] as string | undefined) ??
              (props["event_type"] as string | undefined) ??
              (props["crash_road"] as string | undefined) ??
              (props["road_geome"] as string | undefined) ?? "N/A";
              
            hoverEl!.innerHTML = `
            <div>${String(lga)}</div>
            <div style="font-weight:400;">
              ${othe_traf}, ${rum_desc}
            </div>
          `;

            const { x, y } = e.point;
            hoverEl!.style.left = `${x + 10}px`;
            hoverEl!.style.top = `${y + 10}px`;
            hoverEl!.style.display = "block";

            map.getCanvas().style.cursor = "pointer";
          }
        );

        map.on("mouseleave", layerId, () => {
          if (hoverEl) hoverEl.style.display = "none";
          map.getCanvas().style.cursor = "";
        });

        // click logging
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

type SevereAccidentLegendItem = {
  id: string;
  label: string;
  outerColor: string;
  innerColor: string;
};

export const SEVERE_ACCIDENT_LEGEND: SevereAccidentLegendItem[] = [
  {
    id: "severe-accident",
    label: "Severe cycling crash",
    outerColor: "#ff3b30", // matches circle-color
    innerColor: "#000000", // matches inner dot
  },
] as const;
