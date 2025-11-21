import { mode3DAtom } from "@/atoms/GeneralAtom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";

const Map3D = () => {
  const [is3D, setIs3D] = useAtom<boolean>(mode3DAtom);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIs3D((prev) => !prev)}
            className={cn(
              "rounded-b-none border border-emerald-700 backdrop-blur-sm transition-all duration-200",
              // base light/dark background
              "bg-white/90 dark:bg-neutral-900/90",
              // active (3D ON) glow styling
              is3D &&
              "bg-emerald-600 text-white border-emerald-700 shadow-[0_0_14px_rgba(16,185,129,0.8)] dark:bg-emerald-900"
            )}
          >
            3D
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{is3D ? "Switch back to 2D" : "Switch to 3D"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Map3D;
