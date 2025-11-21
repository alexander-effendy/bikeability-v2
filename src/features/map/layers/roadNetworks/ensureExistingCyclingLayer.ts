// src/features/map/layers/ensureExistingCyclingLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
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
    layerId: `${sourceId}-line`,   // visible line
    hitLayerId: `${sourceId}-hit`, // invisible, fat hitbox
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
    const { sourceId, layerId, hitLayerId } = getIdsForCity(city);
    if (map.getLayer(hitLayerId)) map.removeLayer(hitLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._existingCyclingHoverEl) {
    anyMap._existingCyclingHoverEl.remove();
    anyMap._existingCyclingHoverEl = undefined;
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

  const { sourceId, layerId, hitLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Visible line layer with color by `facility`
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

  // 3) Invisible "hit" layer with big line-width for easy hover/click
  if (!map.getLayer(hitLayerId)) {
    map.addLayer(
      {
        id: hitLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          // fully transparent but still interactive
          "line-color": "rgba(0,0,0,0)",
          // this is your "buffer" – bump it up/down as you like
          "line-width": 5,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      },
      // put it ABOVE the visible line (no beforeId) so it catches events
    );
  }

  // 4) Interactivity – hover tooltip + cursor + click, bound once
  if (!anyMap._existingCyclingEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._existingCyclingHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "existing-cycling-hover-label";
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
      anyMap._existingCyclingHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { hitLayerId: hitId } = getIdsForCity(c);

      // Hover on the *hit* layer
      map.on(
        "mousemove",
        hitId,
        (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const facility =
            (feature.properties?.facility as string | undefined)?.trim() ||
            "Unknown facility";

          hoverEl!.innerHTML = `<div>${facility}</div>`;

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

      // Click on the *hit* layer too
      map.on("click", hitId, (e) => {
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
