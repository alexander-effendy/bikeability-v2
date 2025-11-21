import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAtom } from "jotai";
import { showMaskingLayerAtom } from "@/atoms/GeneralAtom";
import { cn } from "@/lib/utils";

const MapShowMasking = () => {
  const [showMasking, setShowMasking] = useAtom<boolean>(showMaskingLayerAtom);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowMasking((prev) => !prev)}
            className={cn(
              "rounded-t-none border border-sky-700 border-t-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm transition-all duration-200",
              showMasking &&
              "bg-sky-600 text-white border-sky-700 shadow-[0_0_14px_rgba(16,185,129,0.8)] dark:bg-sky-900"
            )}
          >
            <Layers />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Masking Layer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MapShowMasking;
