import { activeLayerAtom } from "@/atoms/LayerAtom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAtom } from "jotai";
import { Eye, EyeOff, ChevronsUpDown, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// 👇 update this import path to wherever you defined these atoms
import { catchmentTypeAtom, catchmentMinsAtom } from "@/atoms/LayerAtom";

// ---- options ----
const CATCHMENT_TYPE_OPTIONS = [
  { label: "Park", value: "park" },
  { label: "School", value: "school" },
  { label: "Service", value: "service" },
  { label: "Shopping", value: "shopping" },
  { label: "Transit", value: "transit" },
] as const;

const CATCHMENT_MINS_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

const TechnicalAccessibility = () => {
  const [layerActive, setLayerActive] = useAtom<string | null>(activeLayerAtom);

  const [typeValue, setTypeValue] = useAtom<string>(catchmentTypeAtom);
  const [minsValue, setMinsValue] = useAtom<number>(catchmentMinsAtom);

  const [typeOpen, setTypeOpen] = useState(false);
  const [minsOpen, setMinsOpen] = useState(false);

  const toggleLayer = (layerName: string) => {
    if (layerActive === layerName) {
      setLayerActive(null);
    } else {
      setLayerActive(layerName);
    }
  };

  const selectedType = CATCHMENT_TYPE_OPTIONS.find((o) => o.value === typeValue);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-foreground flex items-center p-4">
        Accessibility
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Catchment row */}
        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center gap-2"
            >
              {/* LEFT: dynamic label with two comboboxes */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type combobox */}
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs font-normal justify-between bg-background border border-border min-w-[110px]"
                      onClick={(e) => e.stopPropagation()} // don't toggle accordion
                    >
                      <span className="truncate">
                        {selectedType ? selectedType.label : "Type"}
                      </span>
                      <ChevronsUpDown className="ml-1 h-3 w-3 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-44 p-0"
                    onClick={(e) => e.stopPropagation()} // keep accordion open
                  >
                    <Command>
                      <CommandGroup>
                        {CATCHMENT_TYPE_OPTIONS.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              setTypeValue(option.value);
                              setTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                typeValue === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground">within</span>

                {/* Minutes combobox */}
                <Popover open={minsOpen} onOpenChange={setMinsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs font-normal justify-between bg-background border border-border min-w-[80px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{minsValue} mins</span>
                      <ChevronsUpDown className="ml-1 h-3 w-3 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-32 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Command>
                      <CommandGroup>
                        {CATCHMENT_MINS_OPTIONS.map((m) => (
                          <CommandItem
                            key={m}
                            value={String(m)}
                            onSelect={() => {
                              setMinsValue(m);
                              setMinsOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                minsValue === m ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {m} mins
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={(e) => {
                  e.stopPropagation(); // don't open/close accordion when toggling layer
                  toggleLayer("catchment");
                }}
                className="cursor-pointer"
              >
                {layerActive === "catchment" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground text-sm">
                Choose the destination type and the travel time to highlight mesh blocks
                within the selected catchment.
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Meshblock school example – unchanged */}
        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              <div className="flex items-center gap-2">
                <span>Mesh blocks with school connectivity (Primary)</span>
              </div>

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayer("meshblock-school-primary");
                }}
                className="cursor-pointer"
              >
                {layerActive === "meshblock-school-primary" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground text-sm">
                Unsafe spots
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default TechnicalAccessibility;
