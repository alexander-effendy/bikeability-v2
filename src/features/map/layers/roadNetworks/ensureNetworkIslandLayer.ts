// src/features/map/layers/roadNetworks/ensureNetworkIslandLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom";
import type { LegendItem } from "../../layersLegend/LegendInfo";

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_island tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_island`;
  return {
    sourceId,
    visibleLayerId: `${sourceId}-line`,
    hitLayerId: `${sourceId}-hit`,
  };
};

const getFirstSymbolLayerId = (map: maplibregl.Map): string | undefined => {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
};

// Decide which field to use for a given distance limit
const getIslandFieldName = (lengthMeters: number): string => {
  switch (lengthMeters) {
    case 100:
      return "new_is_100";
    case 200:
      return "new_is_200";
    case 300:
      return "new_is_300";
    default:
      return "new_is_100";
  }
};

// Color expression based on the chosen field
const getIslandColorExpression = (fieldName: string): any => {
  return [
    "match",
    ["to-number", ["get", fieldName]],
    1,
    "#000000", // black
    2,
    "#ef4444", // red
    3,
    "#3b82f6", // blue
    4,
    "#22c55e", // green
    5,
    "#fb923c", // orange
    // 6+ or anything else
    "#a855f7", // purple
  ];
};

export const removeNetworkIslandLayer = (map: maplibregl.Map) => {
  const anyMap = map as any;

  for (const city of CITY_LIST) {
    const { sourceId, visibleLayerId, hitLayerId } = getIdsForCity(city);
    if (map.getLayer(hitLayerId)) map.removeLayer(hitLayerId);
    if (map.getLayer(visibleLayerId)) map.removeLayer(visibleLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  if (anyMap._networkIslandHoverEl) {
    anyMap._networkIslandHoverEl.remove();
    anyMap._networkIslandHoverEl = undefined;
  }

  anyMap._networkIslandEventsBound = false;
  anyMap._networkIslandFieldName = undefined;
};

export const ensureNetworkIslandLayer = (
  map: maplibregl.Map,
  city: CityId,
  lengthMeters: number
) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureNetworkIslandLayer(map, city, lengthMeters);
    });
    return;
  }

  const { sourceId, visibleLayerId, hitLayerId } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  const fieldName = getIslandFieldName(lengthMeters);
  const colorExpr = getIslandColorExpression(fieldName);

  // Store active field name for hover/click handlers
  anyMap._networkIslandFieldName = fieldName;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Visible line layer
  if (!map.getLayer(visibleLayerId)) {
    map.addLayer(
      {
        id: visibleLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": colorExpr,
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
  } else {
    // Update colors if user changes distance
    map.setPaintProperty(visibleLayerId, "line-color", colorExpr);
  }

  // 3) Invisible "hit" layer for easier hover/click
  if (!map.getLayer(hitLayerId)) {
    map.addLayer(
      {
        id: hitLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#000000",
          "line-width": 15, // buffer size (px)
          "line-opacity": 0,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      },
      beforeId || undefined
    );
  }

  // 4) Hover + click interactivity – bind once
  if (!anyMap._networkIslandEventsBound) {
    const container = map.getContainer();
    let hoverEl = anyMap._networkIslandHoverEl as HTMLDivElement | undefined;

    if (!hoverEl) {
      hoverEl = document.createElement("div");
      hoverEl.className = "network-island-hover-label";
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
      anyMap._networkIslandHoverEl = hoverEl;
    }

    for (const c of CITY_LIST) {
      const { hitLayerId: hitId } = getIdsForCity(c);

      map.on("mousemove", hitId, (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const activeFieldName: string =
          (map as any)._networkIslandFieldName ?? getIslandFieldName(100);

        const raw = feature.properties?.[activeFieldName];
        let labelValue = "N/A";
        const num = Number(raw);
        if (raw != null && raw !== "" && Number.isFinite(num)) {
          labelValue = num >= 6 ? "6+" : String(num);
        }

        hoverEl!.innerHTML = `<div>Network island size: ${labelValue}</div>`;

        const { x, y } = e.point;
        hoverEl!.style.left = `${x + 10}px`;
        hoverEl!.style.top = `${y + 10}px`;
        hoverEl!.style.display = "block";

        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", hitId, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      map.on("click", hitId, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const activeFieldName: string =
          (map as any)._networkIslandFieldName ?? getIslandFieldName(100);

        console.log("Network island feature:", {
          city: c,
          lengthMeters,
          new_is_value: feature.properties?.[activeFieldName],
          ...feature.properties,
        });
      });
    }

    anyMap._networkIslandEventsBound = true;
  }
};

export const NETWORK_ISLAND_LINE_LEGEND: LegendItem[] = [
  {
    label: "1",
    color: "#000000",
  },
  {
    label: "2",
    color: "#ef4444",
  },
  {
    label: "3",
    color: "#3b82f6",
  },
  {
    label: "4",
    color: "#22c55e",
  },
  {
    label: "5",
    color: "#fb923c",
  },
  {
    label: "6+",
    color: "#a855f7",
  },
];
