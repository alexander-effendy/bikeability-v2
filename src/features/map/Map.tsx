// src/components/Map.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAtom, useAtomValue } from "jotai";
import { darkModeAtom, type CityId } from "@/atoms/GeneralAtom";
import { activeLayerAtom } from "@/atoms/LayerAtom";
import { activeCityAtom } from "@/atoms/GeneralAtom";

import {
  ensureBoundaryLgaLayer,
  removeBoundaryLgaLayer,
} from "@/features/map/layers/currentCyclingConditions/ensureBoundaryLgaLayer";
import {
  ensureSevereAccidentLayer,
  removeSevereAccidentLayer,
} from "@/features/map/layers/currentCyclingConditions/ensurePoiAccidentLayer";
import {
  ensureRoadNetworkLayer,
  removeRoadNetworkLayer,
} from "@/features/map/layers/roadNetworks/ensureRoadNetworkLayer";
import {
  ensureExistingCyclingLayer,
  removeExistingCyclingLayer,
} from "@/features/map/layers/roadNetworks/ensureExistingCyclingLayer";
import {
  ensureNetworkIslandLayer,
  removeNetworkIslandLayer,
} from "@/features/map/layers/roadNetworks/ensureNetworkIslandLayer";

import { CITY_VIEWS } from "./utils/MapLocations";
import CityCombobox from "../combobox/CityCombobox";
type Theme = "dark" | "light";

interface MapProps {
  apiKey?: string;
  initialTheme?: Theme;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const MAPTILER_BASE_URL = "https://api.maptiler.com/maps";

function getDatavizStyleUrl(dark: boolean, apiKey: string) {
  const mapId = dark ? "dataviz-dark" : "dataviz-light";
  return `${MAPTILER_BASE_URL}/${mapId}/style.json?key=${apiKey}`;
}

// ---- Map component ----
const Map: React.FC<MapProps> = ({
  apiKey = import.meta.env.VITE_MAPTILER_API_KEY as string,
  center = [151.2093, -33.8688], // fallback initial center
  zoom = 10,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const currentStyleRef = useRef<string | null>(null);

  const isDark = useAtomValue<boolean>(darkModeAtom);
  const [activeLayer] = useAtom<string | null>(activeLayerAtom);
  const activeCity = useAtomValue<CityId>(activeCityAtom);

  // Compute style URL for current dark/light
  const styleUrlForTheme = useMemo(
    () => getDatavizStyleUrl(isDark, apiKey),
    [isDark, apiKey]
  );

  // 🔁 Re-add all custom overlays based on current UI state
  const rehydrateCustomOverlays = useCallback(
    (map: maplibregl.Map) => {
      removeBoundaryLgaLayer(map);
      removeSevereAccidentLayer(map);
      removeRoadNetworkLayer(map);
      removeExistingCyclingLayer(map);
      removeNetworkIslandLayer(map);
      switch (activeLayer) {
        case "cycling-metrics":
          ensureBoundaryLgaLayer(map, activeCity);
          break;
        case "severe-cycling-crashes":
          ensureSevereAccidentLayer(map, activeCity);
          break;
        case "road-network":
          ensureRoadNetworkLayer(map, activeCity);
          break;
        case "existing-cycling-infrastructure":
          ensureExistingCyclingLayer(map, activeCity);
          break;
        case "cycleway-network-connectivity":
          ensureNetworkIslandLayer(map, activeCity);
          break;
        default:
          break;
      }
    },
    [activeLayer, activeCity]
  );

  // 1️⃣ Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyleUrl = styleUrlForTheme;
    currentStyleRef.current = initialStyleUrl;

    const initialCityConfig = CITY_VIEWS[activeCity ?? "sydney"];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyleUrl,
      center: initialCityConfig?.center ?? center,
      zoom: initialCityConfig?.zoom ?? zoom,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: { antialias: true },
    });

    mapRef.current = map;
    // map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.resize();
      rehydrateCustomOverlays(map);
    });

    return () => {
      removeBoundaryLgaLayer(map);
      removeSevereAccidentLayer(map);
      removeRoadNetworkLayer(map);
      removeExistingCyclingLayer(map);
      removeNetworkIslandLayer(map);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2️⃣ Switch base style when dark mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const newStyleUrl = styleUrlForTheme;
    if (currentStyleRef.current === newStyleUrl) return;

    currentStyleRef.current = newStyleUrl;
    map.setStyle(newStyleUrl, { diff: false });

    const onStyleLoad = () => {
      map.resize();
      rehydrateCustomOverlays(map);
      map.off("style.load", onStyleLoad);
    };

    map.on("style.load", onStyleLoad);
  }, [styleUrlForTheme, rehydrateCustomOverlays]);

  // 3️⃣ When activeLayer changes, just (re)ensure overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    rehydrateCustomOverlays(map);
  }, [rehydrateCustomOverlays]);

  // 4️⃣ When activeCity changes, flyTo the corresponding center/zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeCity) return;

    const config = CITY_VIEWS[activeCity];
    if (!config) return;

    map.flyTo({
      center: config.center,
      zoom: config.zoom,
      duration: 900,
      essential: true,
    });
  }, [activeCity]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* City combobox in top-left */}
      <div className="absolute top-2 left-2 z-10">
        <CityCombobox />
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />
    </div>
  );
};

export default Map;
