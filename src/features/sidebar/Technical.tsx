import { technicalActiveAtom } from "@/atoms/GeneralAtom";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import TechnicalMapTiles from "./TechnicalMapTiles";
import TechnicalCurrentCyclingConditions from "./TechnicalCurrentCyclingConditions";
import TechnicalNetworkLayers from "./TechnicalNetworkLayers";
import MapComponent from "../map/Map";

const Technical = () => {
  const [technicalActive, setTechnicalActive] = useAtom(technicalActiveAtom);

  return (
    <div className="flex flex-1 overflow-hidden">
      
      {/* LEFT ICONS BAR */}
      <TooltipProvider delayDuration={200}>
        <div className="w-10 flex flex-col items-center border-r border-foreground gap-2 py-2 shrink-0">
          {/* Cycling Conditions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full p-2 hover:opacity-80"
                onClick={() => setTechnicalActive("current-cycling-conditions")}
              >
                <ConditionsIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Cycling Conditions</p>
            </TooltipContent>
          </Tooltip>

          {/* Road Networks */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full p-2 hover:opacity-80"
                onClick={() => setTechnicalActive("road-networks")}
              >
                <NetworkIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Road Networks</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* RIGHT SIDEBAR CONTENT */}
      <div className="w-100 border-r border-foreground overflow-auto shrink-0">
        {technicalActive === "maptiles" && <TechnicalMapTiles />}
        {technicalActive === "current-cycling-conditions" && (
          <TechnicalCurrentCyclingConditions />
        )}
        {technicalActive === "road-networks" && <TechnicalNetworkLayers />}
      </div>

      {/* MAP AREA */}
      <div className="flex-1 overflow-hidden p-4">
        <MapComponent className="border border-foreground"/>
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
