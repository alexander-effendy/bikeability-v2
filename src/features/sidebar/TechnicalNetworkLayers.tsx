import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"

const TechnicalNetworkLayers = () => {
  const [layerActive, setLayerActive] = useAtom<string | null>(activeLayerAtom);
  const toggleLayer = (layerName: string) => {
    if (layerActive === layerName) {
      setLayerActive(null);
    } else {
      setLayerActive(layerName);
    }
  }
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-foreground flex items-center p-4">
        Current Cycling Conditions
      </div>

      <div className="p-4 flex flex-col gap-4">
        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Road Network</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('road-network')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'road-network' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                The whole road network throughout the state.
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Existing Cycling Infrastructure</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('existing-cycling-infrastructure')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'existing-cycling-infrastructure' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Cycling Infrastructure that has been built prior to our GIS year.
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Cycleway Network Connectivity</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('cycleway-network-connectivity')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'cycleway-network-connectivity' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Different colours distinguish disconnected islands. Crossing between colours requires a longer distance than the set distance limit.
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </div>
  )
}

export default TechnicalNetworkLayers
