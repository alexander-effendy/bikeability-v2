import { changelogOpenAtom } from "@/atoms/GeneralAtom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useSetAtom } from "jotai";

const Footer = () => {
  const setOpenLog = useSetAtom(changelogOpenAtom);
  return (
    <div className="w-full h-10 px-4 flex items-center justify-end bottom-0 left-0 z-40 border-t border-sidebar-border text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenLog((prev) => !prev)}
              className="p-2 hover:opacity-80"
              variant="ghost"
              size="icon"
            >
              <LampIcon />
            </Button>
          </TooltipTrigger>

          <TooltipContent side="left">
            <p>Log</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span>version 1.0.2</span>
    </div>
  );
};

export default Footer;

const LampIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 2h8v2H8V2ZM6 6V4h2v2H6Zm0 6H4V6h2v6Zm2 2H6v-2h2v2Zm2 0H8v4h8v-4h2v-2h2V6h-2V4h-2v2h2v6h-2v2h-2v2h-4v-2Zm2-2v2h-2v-2h2Zm0-2h2v2h-2v-2Zm0-2v2h-2V8h2Zm0 0V6h2v2h-2Zm4 14v-2H8v2h8Z" />
  </svg>
);
