// src/features/map/layers/ensureBoundaryParkLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom"; // "sydney" | "melbourne" | "brisbane" | "perth"
import type { LegendItem } from "../../layersLegend/LegendInfo";

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

  // Remove hover tooltip if it exists
  if (anyMap._boundaryParkHoverEl) {
    anyMap._boundaryParkHoverEl.remove();
    anyMap._boundaryParkHoverEl = undefined;
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

  // 4) Hover + click interactivity – bind once for all city layers
  if (!anyMap._boundaryParkEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._boundaryParkHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "boundary-park-hover-label";
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
      anyMap._boundaryParkHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { fillLayerId: fid } = getIdsForCity(c);

      // Hover: show park name
      map.on("mousemove", fid, (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const props = feature.properties ?? {};
        const name =
          (props["park_name"] as string | undefined)?.trim() ||
          (props["name"] as string | undefined)?.trim() ||
          "Park / open space";

        hoverEl!.innerHTML = `<div>${name}</div>`;

        const { x, y } = e.point;
        hoverEl!.style.left = `${x + 10}px`;
        hoverEl!.style.top = `${y + 10}px`;
        hoverEl!.style.display = "block";

        map.getCanvas().style.cursor = "pointer";
      });

      // Leave polygon: hide tooltip + reset cursor
      map.on("mouseleave", fid, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      // Click logging (kept from your original)
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

export const PARK_POLYGON_LEGEND: LegendItem[] = [
  {
    label: "Parks",
    color: "#22c55e", // if you want this to match exactly, change to "#4ade80"
  },
];
