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

import {
  darkModeAtom,
  mode3DAtom,
  showMaskingLayerAtom,
  type CityId,
  activeCityAtom,
} from "@/atoms/GeneralAtom";
import {
  activeLayerAtom,
  catchmentTypeAtom,
  catchmentMinsAtom,
  cyclistRatioTypeAtom,
  type CyclistRatioType,
  purposeRatioTypeAtom,
  type PurposeRatioType,
  networkIslandLengthAtom,
} from "@/atoms/LayerAtom";
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

import {
  ensurePopulationDensityLayer,
  removePopulationDensityLayer,
} from "./layers/density/ensurePopulationDensityLayer";
import {
  ensureJobDensityLayer,
  removeJobDensityLayer,
} from "./layers/density/ensureJobDensityLayer";
import {
  ensurePoiSchoolLayer,
  removePoiSchoolLayer,
} from "./layers/poi/ensurePoiSchools";
import {
  ensurePoiServiceLayer,
  removePoiServiceLayer,
} from "./layers/poi/ensurePoiService";
import {
  ensurePoiTransitLayer,
  removePoiTransitLayer,
} from "./layers/poi/ensurePoiTransit";
import {
  ensurePoiShoppingLayer,
  removePoiShoppingLayer,
} from "./layers/poi/ensurePoiShopping";
import {
  ensureBoundaryUniversityLayer,
  removeBoundaryUniversityLayer,
} from "./layers/poi/ensureUniversityPolygon";
import {
  ensureBoundaryParkLayer,
  removeBoundaryParkLayer,
} from "./layers/poi/ensureParkPolygon";
import {
  ensureBikespotSafeLayer,
  removeBikespotSafeLayer,
} from "./layers/bikespot/ensureBikespotSafe";
import {
  ensureBikespotUnsafeLayer,
  removeBikespotUnsafeLayer,
} from "./layers/bikespot/ensureBikespotUnsafe";
import {
  ensureCatchmentLayer,
  removeCatchmentLayer,
} from "./layers/accessibility/ensureCatchmentLayer";

import {
  ensure3DBuildingsLayer,
  remove3DBuildingsLayer,
} from "./layers/3d/ensure3DBuildingsLayer";

import {
  ensureMaskingLayer,
  removeMaskingLayer,
} from "./layers/maskingLayer/ensureMaskingLayer";

import Map3D from "../mapConfigs/map3D";
import MapShowMasking from "../mapConfigs/mapShowMasking";
import { ensureCyclistRatioLayer, removeCyclistRatioLayer } from "./layers/currentCyclingConditions/ensureCyclistRatioLayer";
import { ensurePurposeRatioLayer, removePurposeRatioLayer } from "./layers/currentCyclingConditions/ensurePurposeRatioLayer";

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
  center = [151.2093, -33.8688],
  zoom = 10,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const currentStyleRef = useRef<string | null>(null);

  const isDark = useAtomValue<boolean>(darkModeAtom);
  const activeLayer = useAtomValue<string | null>(activeLayerAtom);

  const activeCity = useAtomValue<CityId>(activeCityAtom);
  const catchmentType = useAtomValue<string>(catchmentTypeAtom);
  const catchmentMins = useAtomValue<number>(catchmentMinsAtom);
  const cyclistRatioType = useAtomValue<CyclistRatioType>(cyclistRatioTypeAtom);
  const purposeRatioType = useAtomValue<PurposeRatioType>(purposeRatioTypeAtom);
  const networkIslandLength = useAtomValue(networkIslandLengthAtom);

  const [is3D] = useAtom<boolean>(mode3DAtom);
  const showMasking = useAtomValue<boolean>(showMaskingLayerAtom);

  // Compute style URL for current dark/light
  const styleUrlForTheme = useMemo(
    () => getDatavizStyleUrl(isDark, apiKey),
    [isDark, apiKey]
  );

  // 🔁 Re-add all "thematic" overlays based on current UI state
  // (DO NOT touch 3D buildings or masking here)
  const rehydrateCustomOverlays = useCallback(
    (map: maplibregl.Map) => {
      // Clear all toggleable thematic layers
      removeCyclistRatioLayer(map);
      removePurposeRatioLayer(map);
      removeSevereAccidentLayer(map);
      removeRoadNetworkLayer(map);
      removeExistingCyclingLayer(map);
      removeNetworkIslandLayer(map);
      removePopulationDensityLayer(map);
      removeJobDensityLayer(map);
      removePoiSchoolLayer(map);
      removePoiServiceLayer(map);
      removePoiTransitLayer(map);
      removePoiShoppingLayer(map);
      removeBoundaryUniversityLayer(map);
      removeBoundaryParkLayer(map);
      removeBikespotSafeLayer(map);
      removeBikespotUnsafeLayer(map);
      removeCatchmentLayer(map);

      switch (activeLayer) {
        case "cyclist-ratio":
          ensureCyclistRatioLayer(map, activeCity, cyclistRatioType);
          break;
        case "purpose-ratio":
          ensurePurposeRatioLayer(map, activeCity, purposeRatioType);
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
          ensureNetworkIslandLayer(map, activeCity, networkIslandLength);
          break;
        case "population-density":
          ensurePopulationDensityLayer(map, activeCity);
          break;
        case "job-density":
          ensureJobDensityLayer(map, activeCity);
          break;
        case "poi-schools": {
          ensurePoiSchoolLayer(map, activeCity);
          break;
        }
        case "poi-service": {
          ensurePoiServiceLayer(map, activeCity);
          break;
        }
        case "poi-transit": {
          ensurePoiTransitLayer(map, activeCity);
          break;
        }
        case "poi-shopping": {
          ensurePoiShoppingLayer(map, activeCity);
          break;
        }
        case "university-polygon": {
          ensureBoundaryUniversityLayer(map, activeCity);
          break;
        }
        case "park-polygon": {
          ensureBoundaryParkLayer(map, activeCity);
          break;
        }
        case "bikespot-safe": {
          ensureBikespotSafeLayer(map, activeCity);
          break;
        }
        case "bikespot-unsafe": {
          ensureBikespotUnsafeLayer(map, activeCity);
          break;
        }
        case "catchment": {
          const type = catchmentType ?? "park";
          const mins = catchmentMins ?? 5;
          ensureCatchmentLayer(map, activeCity, type, mins);
          break;
        }
        default:
          break;
      }
    },
    [activeLayer, activeCity, catchmentType, catchmentMins, cyclistRatioType, purposeRatioType, networkIslandLength]
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

    map.on("load", () => {
      map.resize();

      if (showMasking) {
        ensureMaskingLayer(map);    // mask inserted directly under 3D
      }
      rehydrateCustomOverlays(map);
    });

    return () => {
      // Clean thematic overlays
      removeSevereAccidentLayer(map);
      removeRoadNetworkLayer(map);
      removeExistingCyclingLayer(map);
      removeNetworkIslandLayer(map);
      removePopulationDensityLayer(map);
      removeJobDensityLayer(map);
      removePoiSchoolLayer(map);
      removePoiServiceLayer(map);
      removePoiTransitLayer(map);
      removePoiShoppingLayer(map);
      removeBoundaryUniversityLayer(map);
      removeBoundaryParkLayer(map);
      removeBikespotSafeLayer(map);
      removeBikespotUnsafeLayer(map);
      removeCatchmentLayer(map);

      // Also clean always-on layers
      remove3DBuildingsLayer(map);
      removeMaskingLayer(map);

      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2️⃣ Switch base style when dark mode changes (or map tiles change)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const newStyleUrl = styleUrlForTheme;
    if (currentStyleRef.current === newStyleUrl) return;

    currentStyleRef.current = newStyleUrl;
    map.setStyle(newStyleUrl, { diff: false });

    const onStyleLoad = () => {
      map.resize();
      ensure3DBuildingsLayer(map);
      map.off("style.load", onStyleLoad);
    };
    map.on("style.load", onStyleLoad);
    rehydrateCustomOverlays(map);
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

  // 5️⃣ Camera tilt for 3D mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -30 : 0,
      duration: 800,
      easing: (t) => t * (2 - t),
      essential: true,
    });
  }, [is3D]);

  // 6️⃣ 3D building *layer* – separate from camera tilt
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply3D = () => {
      if (is3D) {
        ensure3DBuildingsLayer(map);
      } else {
        remove3DBuildingsLayer(map);
      }
    };

    if (!map.isStyleLoaded()) {
      map.once("style.load", apply3D);
    } else {
      apply3D();
    }
  }, [is3D, styleUrlForTheme]);

  // 7️⃣ Masking layer – independent of activeLayer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyMask = () => {
      if (showMasking) {
        ensureMaskingLayer(map);
      } else {
        removeMaskingLayer(map);
      }
    };

    if (!map.isStyleLoaded()) {
      map.once("style.load", applyMask);
    } else {
      applyMask();
    }
  }, [showMasking, styleUrlForTheme]);

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

      {/* 3D + Masking controls in top-right */}
      <div className="flex flex-col absolute top-2 right-2 z-10">
        <Map3D />
        <MapShowMasking />
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
