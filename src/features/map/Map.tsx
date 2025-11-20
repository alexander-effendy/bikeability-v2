// src/components/Map.tsx
import React, { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAtom } from "jotai";
import { darkModeAtom } from "@/atoms/GeneralAtom";

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

const Map: React.FC<MapProps> = ({
  apiKey = import.meta.env.VITE_MAPTILER_API_KEY as string,
  center = [151.2093, -33.8688], // Sydney :)
  zoom = 10,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [dark] = useAtom<boolean>(darkModeAtom);

  // Style used only on first map creation
  const initialStyleUrl = useMemo(
    () => getDatavizStyleUrl(dark, apiKey),
    [dark, apiKey]
  );

  // Style that changes when the user switches theme
  const currentStyleUrl = useMemo(
    () => getDatavizStyleUrl(dark, apiKey),
    [dark, apiKey]
  );

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyleUrl,
      center,
      zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    // Navigation controls (zoom / rotate)
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom, initialStyleUrl]);

  // Update style when switching between dark / light
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(currentStyleUrl);
  }, [currentStyleUrl]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
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
