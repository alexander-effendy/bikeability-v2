import { darkModeAtom, technicalActiveAtom } from "@/atoms/GeneralAtom";
import { Button } from "@/components/ui/button";
import { useAtom, useSetAtom } from "jotai";
import { Bike, Accessibility, ChartColumnIncreasing } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// import TechnicalMapTiles from "./TechnicalMapTiles";
import TechnicalCurrentCyclingConditions from "./TechnicalCurrentCyclingConditions";
import TechnicalNetworkLayers from "./TechnicalNetwork";
import MapComponent from "../map/Map";
import TechnicalDensity from "./TechnicalDensity";
import TechnicalPoi from "./TechnicalPoi";
import TechnicalBikeSpot from "./TechnicalBikeSpot";
import TechnicalAccessibility from "./TechnicalAccessibility";
import { activeLayerAtom } from "@/atoms/LayerAtom";
import TechnicalRunModel from "./TechnicalRunModel";

const Technical = () => {
  const [technicalActive, setTechnicalActive] = useAtom(technicalActiveAtom);
  const setActiveLayer = useSetAtom(activeLayerAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const getTabButtonClass = (tab: string) =>
    [
      "w-full p-2 hover:opacity-80 transition-all",
      "flex items-center justify-center",
      technicalActive === tab
        ? [
          // glow / active style
          "bg-emerald-500/30 dark:bg-emerald-400/10",
          "text-emerald-600 dark:text-emerald-200",
          "",
          "shadow-md shadow-emerald-400/40",
          "rounded-md",
        ].join(" ")
        : "text-muted-foreground",
    ].join(" ");

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT ICONS BAR */}
      <TooltipProvider delayDuration={200}>
        <div className="h-full flex flex-col justify-between border-r border-sidebar-border p-1.5">
          <div className="w-10 flex flex-col items-center gap-2 py-2 shrink-0">
            {/* Cycling Conditions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("current-cycling-conditions")}
                  onClick={() => setTechnicalActive("current-cycling-conditions")}
                >
                  <ConditionsIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Current Cycling Conditions</p>
              </TooltipContent>
            </Tooltip>

            {/* Road Networks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("road-networks")}
                  onClick={() => setTechnicalActive("road-networks")}
                >
                  <NetworkIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Road Networks</p>
              </TooltipContent>
            </Tooltip>

            {/* Density */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("density")}
                  onClick={() => setTechnicalActive("density")}
                >
                  <DensityIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Density</p>
              </TooltipContent>
            </Tooltip>

            {/* POI */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("poi")}
                  onClick={() => setTechnicalActive("poi")}
                >
                  <PointIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>POI</p>
              </TooltipContent>
            </Tooltip>

            {/* BikeSpot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("bikespot")}
                  onClick={() => setTechnicalActive("bikespot")}
                >
                  <Bike />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>BikeSpot 2023</p>
              </TooltipContent>
            </Tooltip>

            {/* Accessibility */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={getTabButtonClass("accessibility")}
                  onClick={() => setTechnicalActive("accessibility")}
                >
                  <Accessibility />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Accessibility</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                    setActiveLayer('road-network')
                    setTechnicalActive("run-models")
                  }}
                  className="p-2 hover:opacity-80"
                >
                  <ChartColumnIncreasing />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Run Models</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* THEME TOGGLE – no glow logic here */}
          <div className="w-10 flex flex-col items-center gap-2 py-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleDarkMode}
                  className="p-2 hover:opacity-80"
                >
                  {darkMode ? <MoonIcon /> : <SunIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Toggle Theme</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* RIGHT SIDEBAR CONTENT */}
      <div className={`${technicalActive === 'run-models' ? 'w-120' : 'w-100'} transition-all duration-2000 border-r border-sidebar-border`}>
        {technicalActive === "current-cycling-conditions" && (
          <TechnicalCurrentCyclingConditions />
        )}
        {technicalActive === "road-networks" && <TechnicalNetworkLayers />}
        {technicalActive === "density" && <TechnicalDensity />}
        {technicalActive === "poi" && <TechnicalPoi />}
        {technicalActive === "bikespot" && <TechnicalBikeSpot />}
        {technicalActive === "accessibility" && <TechnicalAccessibility />}
        {technicalActive === "run-models" && <TechnicalRunModel />}
      </div>

      {/* MAP AREA */}
      <div className="flex-1 overflow-hidden p-4">
        <MapComponent className="border border-sidebar-border" />
      </div>
    </div>
  );
};

export default Technical;

// ICONS
const ConditionsIcon = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z"
      fill="currentColor"
    />
  </svg>
);

const NetworkIcon = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M7 7h4v4H7V7zm-2 6v-2h2v2H5zm0 0v4H1v-4h4zm8 0h-2v-2h2v2zm4 0h-4v4h4v-4zm2-2v2h-2v-2h2zm0 0h4V7h-4v4z"
      fill="currentColor"
    />
  </svg>
);

const DensityIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M20 5H4v2h16V5zm0 4H4v2h16V9zM4 13h16v2H4v-2zm16 4H4v2h16v-2z" fill="currentColor" /> </svg>
)

const PointIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M7 2h10v2H7V2zM5 6V4h2v2H5zm0 8H3V6h2v8zm2 2H5v-2h2v2zm2 2H7v-2h2v2zm2 2H9v-2h2v2zm2 0v2h-2v-2h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0-8h2v8h-2V6zm0 0V4h-2v2h2zm-5 2h-4v4h4V8z" fill="currentColor" /> </svg>
)

// ICONS
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"> <path d="M13 0h-2v4h2V0ZM0 11v2h4v-2H0Zm24 0v2h-4v-2h4ZM13 24h-2v-4h2v4ZM8 6h8v2H8V6ZM6 8h2v8H6V8Zm2 10v-2h8v2H8Zm10-2h-2V8h2v8Zm2-14h2v2h-2V2Zm0 2v2h-2V4h2Zm2 18h-2v-2h2v2Zm-2-2h-2v-2h2v2ZM4 2H2v2h2v2h2V4H4V2ZM2 22h2v-2h2v-2H4v2H2v2Z" /> </svg>  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"> <path d="M6 2h8v2h-2v2h-2V4H6V2ZM4 6V4h2v2H4Zm0 10H2V6h2v10Zm2 2H4v-2h2v2Zm2 2H6v-2h2v2Zm10 0v2H8v-2h10Zm2-2v2h-2v-2h2Zm-2-4h2v4h2v-8h-2v2h-2v2Zm-6 0v2h6v-2h-6Zm-2-2h2v2h-2v-2Zm0 0V6H8v6h2Z" /> </svg>  </svg>
);
