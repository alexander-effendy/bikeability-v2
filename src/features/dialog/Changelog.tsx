import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAtom } from "jotai";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";

import { changelogOpenAtom } from "@/atoms/GeneralAtom";

export default function ChangeLogModal() {
  const [isOpen, setIsOpen] = useAtom<boolean>(changelogOpenAtom);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[95vh] sm:max-h-[90vh] soft-scrollbar-right sm:max-w-[700px] border border-sidebar-border p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-3 text-card-foreground">
            Changelog
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-button-primary">Version 1.0.1</h3>
            <Badge>Latest Release</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Released on November 21, 2025
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-card-foreground">
            <li>Added 3D Buildings Layers</li>
            <li>Toggling theme bug fixed</li>
            <li>All layers have hover popups working</li>
          </ul>
        </div>

        <Separator className="my-6 bg-muted-foreground" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-button-primary">Version 1.0.0</h3>
            <Badge>Initial Release</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Released on November 20, 2025
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-card-foreground">
            <li>Initial release with core setup</li>
            <li>Dark and light mode toggle</li>
            <li>All layers for all cities can be toggled on and off</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}