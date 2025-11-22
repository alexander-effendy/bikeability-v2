import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import { useMe, useLogout } from "@/features/auth/useAuthQueries";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { data: user } = useMe();
  const { mutateAsync: doLogout, isPending: isLoggingOut } = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await doLogout(); // clears session on backend + removes "me" cache
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const displayName = user?.name || user?.email || "User";

  return (
    <TooltipProvider delayDuration={200}>

      <div className="w-full h-12 flex items-center justify-between px-4 top-0 left-0 z-50 border-b border-sidebar-border">
        <span>NCDAP Bikeability v2.0</span>

        <div className="flex items-center gap-3">
          {/* Logged-in user */}
          {user && (
            <span className="text-sm text-foreground/80">
              <span className="text-xs">{displayName}</span>
            </span>
          )}

          {/* Logout button */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-2 hover:opacity-80"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogoutIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Sign out</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>

  );
};

export default Navbar;

// ICONs
const LogoutIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M5 3h16v4h-2V5H5v14h14v-2h2v4H3V3h2zm16 8h-2V9h-2V7h-2v2h2v2H7v2h10v2h-2v2h2v-2h2v-2h2v-2z" fill="currentColor" /> </svg>
)