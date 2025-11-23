import { aboutOpenAtom } from "@/atoms/GeneralAtom";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/shadcn-io/magnetic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSetAtom } from "jotai";
import { Info } from "lucide-react";

const AboutLoginButton = () => {
  const setIsOpen = useSetAtom(aboutOpenAtom);
  return (
    <div className="absolute bottom-6 right-6 z-20 flex items-center justify-center">
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Magnetic>
              <Button
                onClick={() => setIsOpen((prev) => !prev)}
                className="
                transition-shadow duration-300 hover:shadow-[0_0_12px_3px_rgba(16,185,129,0.7)]
              "
              >
                <Info className="size-5" />
              </Button>

            </Magnetic>
          </TooltipTrigger>

          {/* Tooltip positioned to the LEFT */}
          <TooltipContent side="left">
            <p>About us</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
};

export default AboutLoginButton;
