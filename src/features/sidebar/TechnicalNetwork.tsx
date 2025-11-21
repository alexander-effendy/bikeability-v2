// src/features/sidebar/TechnicalNetworkLayers.tsx (or wherever this lives)
import { useState } from "react";
import { useAtom } from "jotai";
import { Eye, EyeOff, ChevronsUpDown, Check } from "lucide-react";

import { activeLayerAtom, networkIslandLengthAtom } from "@/atoms/LayerAtom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

import { cn } from "@/lib/utils"; // if you have this helper; if not, remove cn() and className logic
// import { ROAD_NETWORK_LINE_LEGEND } from "../map/layers/roadNetworks/ensureRoadNetworkLayer";
import { EXISTING_CYCLING_LINE_LEGEND } from "../map/layers/roadNetworks/ensureExistingCyclingLayer";
import { NETWORK_ISLAND_LINE_LEGEND } from "../map/layers/roadNetworks/ensureNetworkIslandLayer";

const connectivityOptions = [
  { value: 100, label: "100 m" },
  { value: 200, label: "200 m" },
  { value: 300, label: "300 m" },
];

const TechnicalNetworkLayers = () => {
  const [layerActive, setLayerActive] = useAtom<string | null>(activeLayerAtom);
  const [networkIslandLength, setNetworkIslandLength] = useAtom(
    networkIslandLengthAtom
  );
  const [isConnectivityOpen, setIsConnectivityOpen] = useState(false);

  const toggleLayer = (layerName: string) => {
    if (layerActive === layerName) {
      setLayerActive(null);
    } else {
      setLayerActive(layerName);
    }
  };

  const selectedConnectivity = connectivityOptions.find(
    (opt) => opt.value === networkIslandLength
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-foreground flex items-center p-4">
        Network Layers
      </div>

      <div
        style={{ height: "calc(100dvh - 128px)" }}
        className="p-4 flex flex-col gap-4 overflow-y-auto soft-scrollbar-right"
      >
        {/* --- Road Network --- */}
        {/* <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-foreground"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Road Network</span>
              </div>

              <span
                onClick={() => {
                  toggleLayer("road-network");
                }}
                className="cursor-pointer"
              >
                {layerActive === "road-network" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                The whole road network throughout the state.
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {ROAD_NETWORK_LINE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-1 dark:h-0.5 w-10 border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.label}
                      {item.min !== undefined && (
                        <span className="text-muted-foreground ml-1">
                          {item.max == null
                            ? `(${item.min}+ )`
                            : `(${item.min} – ${item.max})`}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}

        {/* --- Existing Cycling Infrastructure --- */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-foreground"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Existing Cycling Infrastructure</span>
              </div>

              <span
                onClick={() => {
                  toggleLayer("existing-cycling-infrastructure");
                }}
                className="cursor-pointer"
              >
                {layerActive === "existing-cycling-infrastructure" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Cycling Infrastructure that has been built prior to our GIS
                year.
              </span>
              <div className="space-y-2 mt-1 text-xs px-1 pt-2">
                {EXISTING_CYCLING_LINE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-1 dark:h-0.5 w-10 border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.label}
                      {item.min !== undefined && (
                        <span className="text-muted-foreground ml-1">
                          {item.max == null
                            ? `(${item.min}+ )`
                            : `(${item.min} – ${item.max})`}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* --- Cycleway Network Connectivity --- */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-foreground"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Cycleway Network Connectivity</span>
              </div>

              <span
                onClick={() => {
                  toggleLayer("cycleway-network-connectivity");
                }}
                className="cursor-pointer"
              >
                {layerActive === "cycleway-network-connectivity" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs space-y-3">
              {/* Combobox for distance limit */}
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                  Distance limit
                </span>

                <Popover
                  open={isConnectivityOpen}
                  onOpenChange={setIsConnectivityOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isConnectivityOpen}
                      className="w-full justify-between h-8 px-2 text-xs border border-foreground rounded-none"
                    >
                      {selectedConnectivity
                        ? selectedConnectivity.label
                        : "Select distance"}
                      <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandList>
                        <CommandEmpty>No distance found.</CommandEmpty>
                        <CommandGroup>
                          {connectivityOptions.map((opt) => (
                            <CommandItem
                              key={opt.value}
                              value={String(opt.value)}
                              onSelect={(currentValue) => {
                                const numeric = Number(currentValue);
                                setNetworkIslandLength(numeric);
                                setIsConnectivityOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  opt.value === networkIslandLength
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <span className="text-muted-foreground block">
                Different colours distinguish disconnected portions of the
                cycleway network. Crossing between disconnected portions
                requires a longer distance than the selected distance limit.
              </span>

              <div className="space-y-2 mt-1 text-xs px-1 pt-2">
                {NETWORK_ISLAND_LINE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-1 dark:h-0.5 w-10 border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.label}
                      {item.min !== undefined && (
                        <span className="text-muted-foreground ml-1">
                          {item.max == null
                            ? `(${item.min}+ )`
                            : `(${item.min} – ${item.max})`}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default TechnicalNetworkLayers;
