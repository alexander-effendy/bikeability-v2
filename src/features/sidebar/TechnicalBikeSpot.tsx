import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"
import { BIKESPOT_SAFE_POI_LEGEND } from "../map/layers/bikespot/ensureBikespotSafe"
import { BIKESPOT_UNSAFE_POI_LEGEND } from "../map/layers/bikespot/ensureBikespotUnsafe"

const TechnicalBikeSpot = () => {
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
      <div className="h-10 border-b border-sidebar-border flex items-center p-4">
        BikeSpot 2023
      </div>
      <div style={{ height: 'calc(100dvh - 128px)' }} className="p-4 flex flex-col gap-4 overflow-y-auto soft-scrollbar-right">
        <section className="text-sm text-muted-foreground">
          <span>
            BikeSpot is a digital mapping campaign that allows every Australian to say
            where they feel safe or unsafe while riding their bike. Learn more at{" "}
            <a
              href="https://bikespot.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800"
            >
              bikespot.org
            </a>.
          </span>
        </section>

        <div className="flex flex-col gap-4 pt-0">
          <Accordion type="single" defaultValue="item-1" className="border border-sidebar-border">
            <AccordionItem value="item-1" className="p-4">
              <AccordionTrigger
                className="flex justify-between [&>svg]:hidden items-center"
              >
                {/* LEFT: Title */}
                <div className="flex items-center gap-2">
                  <span>Positive Spots (Safe)</span>
                </div>

                {/* RIGHT: Eye Icon (controlled by layerActive) */}
                <span
                  onClick={() => {
                    toggleLayer('bikespot-safe')
                    // e.stopPropagation();     // prevent accordion toggle
                  }}
                  className="cursor-pointer"
                >
                  {layerActive === 'bikespot-safe' ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </span>
              </AccordionTrigger>

              <AccordionContent className="mt-5 pb-0 text-xs">
                <span className="text-muted-foreground">
                  Safe spots
                </span>
                <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                  {BIKESPOT_SAFE_POI_LEGEND.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>
                        {item.label}
                        {item.min !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            {item.max == null
                              ? `(${item.min}+ )`
                              : `(${item.min} – ${item.max})`}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" defaultValue="item-1" className="border border-sidebar-border">
            <AccordionItem value="item-1" className="p-4">
              <AccordionTrigger
                className="flex justify-between [&>svg]:hidden items-center"
              >
                {/* LEFT: Title */}
                <div className="flex items-center gap-2">
                  <span>Negative Spots (Unsafe)</span>
                </div>

                {/* RIGHT: Eye Icon (controlled by layerActive) */}
                <span
                  onClick={() => {
                    toggleLayer('bikespot-unsafe')
                    // e.stopPropagation();     // prevent accordion toggle
                  }}
                  className="cursor-pointer"
                >
                  {layerActive === 'bikespot-unsafe' ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </span>
              </AccordionTrigger>

              <AccordionContent className="mt-5 pb-0 text-xs">
                <span className="text-muted-foreground">
                  Unsafe spots
                </span>
                <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                  {BIKESPOT_UNSAFE_POI_LEGEND.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>
                        {item.label}
                        {item.min !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            {item.max == null
                              ? `(${item.min}+ )`
                              : `(${item.min} – ${item.max})`}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>


              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>




    </div>
  )
}

export default TechnicalBikeSpot;
