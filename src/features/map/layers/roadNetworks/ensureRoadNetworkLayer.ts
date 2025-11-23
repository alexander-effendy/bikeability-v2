// src/features/map/layers/roadNetworks/ensureRoadNetworkLayer.ts
import maplibregl, { type MapLayerMouseEvent } from "maplibre-gl";
import type { CityId } from "@/atoms/GeneralAtom";
import type { LegendItem } from "../../layersLegend/LegendInfo";
import { getDefaultStore } from "jotai";
import {
  clickedRoadsAtom,
  submittedRoadsAtom,
  type RoadType,
  type RoadSegmentType,
  type SubmittedRoadsState,
} from "@/atoms/ModelAtom";

const store = getDefaultStore();

const MARTIN_BASE_URL = import.meta.env.VITE_MARTIN_URL;

// All cities that have *_network_all tiles
const CITY_LIST: CityId[] = ["sydney", "melbourne", "brisbane", "perth"];

// Build ids for a given city
const getIdsForCity = (city: CityId) => {
  const sourceId = `${city}_network_all`;
  return {
    sourceId,
    visibleLayerId: `${sourceId}-line`,
    hitLayerId: `${sourceId}-hit`,
    selectedLayerId: `${sourceId}-selected`, // clicked (step 1) – cyan
    paintedLayerId: `${sourceId}-painted`, // submitted painted – blue
    separatedLayerId: `${sourceId}-separated`, // submitted separated – green
    quietLayerId: `${sourceId}-quiet`, // submitted quiet – pink
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

// === Common filter builder (by gid) =======================

const buildGidFilter = (gids: number[]): any =>
  gids.length === 0
    ? ["==", ["to-number", ["get", "gid"], -1], -1] // match nothing
    : [
        "any",
        ...gids.map((gid) => [
          "==",
          ["to-number", ["get", "gid"], 0],
          gid,
        ]),
      ];

// === 🔵 Selected roads (clicked) filter helpers ===========

const updateSelectedRoadFilterForCity = (
  map: maplibregl.Map,
  city: CityId,
  roads: RoadType[]
) => {
  const { selectedLayerId } = getIdsForCity(city);
  if (!map.getLayer(selectedLayerId)) return;

  const gids = roads.filter((r) => r.city === city).map((r) => r.gid);
  map.setFilter(selectedLayerId, buildGidFilter(gids));
};

// 👇 exported so React (Map.tsx) can sync when clickedRoadsAtom atom changes
export const syncSelectedRoadsOnMap = (
  map: maplibregl.Map,
  roads: RoadType[]
) => {
  for (const city of CITY_LIST) {
    updateSelectedRoadFilterForCity(map, city, roads);
  }
};

// === 🎨 Submitted roads (painted / separated / quiet) =====
// NOTE: submittedRoadsAtom now stores { gid } only, per segment type.

const updateSubmittedRoadFiltersForCity = (
  map: maplibregl.Map,
  city: CityId,
  submitted: SubmittedRoadsState
) => {
  const { paintedLayerId, separatedLayerId, quietLayerId } = getIdsForCity(city);

  // Each entry is now just { gid }, no city field
  const paintedGids = submitted.painted.map((r) => r.gid);
  const separatedGids = submitted.separated.map((r) => r.gid);
  const quietGids = submitted.quiet.map((r) => r.gid);

  if (map.getLayer(paintedLayerId)) {
    map.setFilter(paintedLayerId, buildGidFilter(paintedGids));
  }
  if (map.getLayer(separatedLayerId)) {
    map.setFilter(separatedLayerId, buildGidFilter(separatedGids));
  }
  if (map.getLayer(quietLayerId)) {
    map.setFilter(quietLayerId, buildGidFilter(quietGids));
  }
};

export const syncSubmittedRoadsOnMap = (
  map: maplibregl.Map,
  submitted: SubmittedRoadsState
) => {
  for (const city of CITY_LIST) {
    updateSubmittedRoadFiltersForCity(map, city, submitted);
  }
};

// ==========================================================

export const removeRoadNetworkLayer = (map: maplibregl.Map) => {
  // Remove all city road network layers/sources
  for (const city of CITY_LIST) {
    const {
      sourceId,
      visibleLayerId,
      hitLayerId,
      selectedLayerId,
      paintedLayerId,
      separatedLayerId,
      quietLayerId,
    } = getIdsForCity(city);

    if (map.getLayer(quietLayerId)) map.removeLayer(quietLayerId);
    if (map.getLayer(separatedLayerId)) map.removeLayer(separatedLayerId);
    if (map.getLayer(paintedLayerId)) map.removeLayer(paintedLayerId);
    if (map.getLayer(selectedLayerId)) map.removeLayer(selectedLayerId);
    if (map.getLayer(hitLayerId)) map.removeLayer(hitLayerId);
    if (map.getLayer(visibleLayerId)) map.removeLayer(visibleLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  // still keep events bound for lifetime of map
};

export const ensureRoadNetworkLayer = (map: maplibregl.Map, city: CityId) => {
  if (!map.isStyleLoaded()) {
    map.once("style.load", () => {
      ensureRoadNetworkLayer(map, city);
    });
    return;
  }

  const {
    sourceId,
    visibleLayerId,
    hitLayerId,
    selectedLayerId,
    paintedLayerId,
    separatedLayerId,
    quietLayerId,
  } = getIdsForCity(city);
  const beforeId = getFirstSymbolLayerId(map);
  const anyMap = map as any;

  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: `${MARTIN_BASE_URL}/${sourceId}`,
    } as maplibregl.VectorSourceSpecification);
  }

  // 2) Visible line layer (grey network)
  if (!map.getLayer(visibleLayerId)) {
    map.addLayer(
      {
        id: visibleLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#9ca3af",
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

  // 3) Invisible "hit" buffer layer
  if (!map.getLayer(hitLayerId)) {
    map.addLayer(
      {
        id: hitLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#000000",
          "line-width": 5, // buffer
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

  // 4) Selected roads layer (clicked, cyan)
  if (!map.getLayer(selectedLayerId)) {
    map.addLayer(
      {
        id: selectedLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#06b6d4", // cyan
          "line-width": 3,
          "line-opacity": 0.95,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        filter: ["==", ["to-number", ["get", "gid"], -1], -1],
      },
      beforeId || undefined
    );
  }

  // 5) Submitted roads layers
  // painted → blue
  if (!map.getLayer(paintedLayerId)) {
    map.addLayer(
      {
        id: paintedLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#3b82f6", // blue
          "line-width": 3,
          "line-opacity": 0.95,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        filter: ["==", ["to-number", ["get", "gid"], -1], -1],
      },
      beforeId || undefined
    );
  }

  // separated → green
  if (!map.getLayer(separatedLayerId)) {
    map.addLayer(
      {
        id: separatedLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#22c55e", // green
          "line-width": 3,
          "line-opacity": 0.95,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        filter: ["==", ["to-number", ["get", "gid"], -1], -1],
      },
      beforeId || undefined
    );
  }

  // quiet → pink
  if (!map.getLayer(quietLayerId)) {
    map.addLayer(
      {
        id: quietLayerId,
        type: "line",
        source: sourceId,
        "source-layer": sourceId,
        paint: {
          "line-color": "#ec4899", // pink
          "line-width": 3,
          "line-opacity": 0.95,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        filter: ["==", ["to-number", ["get", "gid"], -1], -1],
      },
      beforeId || undefined
    );
  }

  // Sync already-clicked + submitted roads for this city
  const currentRoads = store.get(clickedRoadsAtom);
  updateSelectedRoadFilterForCity(map, city, currentRoads);

  const submitted = store.get(submittedRoadsAtom) as SubmittedRoadsState;
  updateSubmittedRoadFiltersForCity(map, city, submitted);

  // 6) Interactivity – bind once for *all* cities
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

      // Hover tooltip uses HIT layer
      map.on("mousemove", hitId, (e: MapLayerMouseEvent) => {
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
      });

      map.on("mouseleave", hitId, () => {
        hoverEl!.style.display = "none";
        map.getCanvas().style.cursor = "";
      });

      // Click = toggle in Jotai + sync cyan layer
      map.on("click", hitId, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const props = feature.properties ?? {};
        const gidRaw = props["gid"];
        const gid =
          typeof gidRaw === "number"
            ? gidRaw
            : gidRaw != null
            ? Number(gidRaw)
            : NaN;

        if (!Number.isFinite(gid)) {
          console.warn("Road feature without valid gid", props);
          return;
        }

        const name =
          (props["name"] as string | undefined)?.trim() || "Unnamed road";

        // length – from feature.length or properties.length
        const lengthRaw =
          (feature as any).length ?? props["length"] ?? props["len"];
        const length =
          typeof lengthRaw === "number"
            ? lengthRaw
            : lengthRaw != null
            ? Number(lengthRaw)
            : 0;

        const road: RoadType = {
          gid,
          name,
          city: c,
          length,
        };

        // Toggle in atom
        store.set(clickedRoadsAtom, (prev) => {
          const exists = prev.some(
            (r) => r.gid === gid && r.city === c
          );
          if (exists) {
            return prev.filter(
              (r) => !(r.gid === gid && r.city === c)
            );
          }
          return [...prev, road];
        });

        // Sync map with latest clicked state
        const updated = store.get(clickedRoadsAtom);
        syncSelectedRoadsOnMap(map, updated);

        console.log("Road network click (stored in Jotai):", {
          city: c,
          length,
          ...props,
        });
      });
    }

    anyMap._roadNetworkEventsBound = true;
  }
};

export const ROAD_NETWORK_LINE_LEGEND: LegendItem[] = [
  {
    label: "Road Network",
    color: "#9ca3af",
  },
];
