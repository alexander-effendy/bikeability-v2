// shadcn UI
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAtom } from "jotai";
import { activeCityAtom, type CityId } from "@/atoms/GeneralAtom";


// ---- City combobox ----
const CITY_OPTIONS: { label: string; value: CityId }[] = [
  { label: "Sydney", value: "sydney" },
  { label: "Melbourne", value: "melbourne" },
  { label: "Brisbane", value: "brisbane" },
  { label: "Perth", value: "perth" },
];

const CityCombobox: React.FC = () => {
  const [activeCity, setActiveCity] = useAtom(activeCityAtom);
  const [open, setOpen] = useState(false);

  const selected = CITY_OPTIONS.find((o) => o.value === activeCity);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-64 justify-between bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-foreground",
            "rounded-none"
          )}
        >
          <span className="truncate">
            {selected ? selected.label : "Select city..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-none border border-foreground">
        <Command>
          <CommandGroup>
            {CITY_OPTIONS.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  setActiveCity(option.value);
                  setOpen(false);
                }}
                style={{
                  fontFamily:
                    "Space Mono, Inconsolata, Menlo, Monaco, Consolas, 'Courier New', Courier, monospace",
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeCity === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CityCombobox;