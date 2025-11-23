// src/components/combobox/SearchBar.tsx
import { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { activeCityAtom, type CityId } from "@/atoms/GeneralAtom";
import { cn } from "@/lib/utils";

import BrisbaneLgas from "@/data/Brisbane-LGA.json";
import MelbourneLgas from "@/data/Melbourne-LGA.json";
import SydneyLgas from "@/data/Sydney-LGA.json";
import PerthLgas from "@/data/Perth-LGA.json";

type LgaItem = {
  name: string;
  extents: string; // "minLon,minLat,maxLon,maxLat"
};

const LGA_BY_CITY: Partial<Record<CityId, LgaItem[]>> = {
  brisbane: BrisbaneLgas as LgaItem[],
  melbourne: MelbourneLgas as LgaItem[],
  sydney: SydneyLgas as LgaItem[],
  perth: PerthLgas as LgaItem[],
};

type LgaSearchProps = {
  onZoomToExtent: (extents: string) => void;
};

const LgaSearch: React.FC<LgaSearchProps> = ({ onZoomToExtent }) => {
  const activeCity = useAtomValue<CityId>(activeCityAtom);

  const lgas = useMemo(() => {
    return LGA_BY_CITY[activeCity] ?? [];
  }, [activeCity]);

  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");

  if (!lgas.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-80 justify-between bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-sidebar-border",
            "rounded-none"
          )}
        >
          {selectedName || "Search LGA…"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search LGA…" />
          <CommandList className="soft-scrollbar-right max-h-72">

            <CommandEmpty>No LGA found.</CommandEmpty>
            <CommandGroup heading="Local Government Areas">
              {lgas.map((lga) => (
                <CommandItem
                  key={lga.name}
                  value={lga.name}
                  onSelect={() => {
                    setSelectedName(lga.name);
                    setOpen(false);
                    onZoomToExtent(lga.extents);
                  }}
                  className="soft-scrollbar-right"
                >
                  {lga.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LgaSearch;
