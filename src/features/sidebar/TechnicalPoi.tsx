import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"
import { PARK_POLYGON_LEGEND } from "../map/layers/poi/ensureParkPolygon"
import { SERVICE_POI_LEGEND } from "../map/layers/poi/ensurePoiService"
import { TRANSIT_POI_LEGEND } from "../map/layers/poi/ensurePoiTransit"
import { SHOPPING_POI_LEGEND } from "../map/layers/poi/ensurePoiShopping"
import { SCHOOL_POLYGON_LEGEND } from "../map/layers/poi/ensurePoiSchools"
import { UNIVERSITY_POLYGON_LEGEND } from "../map/layers/poi/ensureUniversityPolygon"

const TechnicalPoi = () => {
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
        Points of Interest
      </div>

      <div style={{ height: 'calc(100dvh - 128px)' }} className="p-4 flex flex-col gap-4 overflow-y-auto soft-scrollbar-right">
        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Parks (polygon)</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('park-polygon')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'park-polygon' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Parks
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {PARK_POLYGON_LEGEND.map((item) => (
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

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Service</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('poi-service')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'poi-service' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Urban amenities that offer services, such as hospitals, post offices, clubs and community centres
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {SERVICE_POI_LEGEND.map((item) => (
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

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Transit</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('poi-transit')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'poi-transit' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Train and metro stations, and major bus interchanges
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {TRANSIT_POI_LEGEND.map((item) => (
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

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Schools</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('poi-schools')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'poi-schools' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Primary and secondary schools
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {SCHOOL_POLYGON_LEGEND.map((item) => (
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

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Shopping</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('poi-shopping')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'poi-shopping' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Retail locations
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {SHOPPING_POI_LEGEND.map((item) => (
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

        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>University (polygon)</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('university-polygon')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'university-polygon' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                University campuses
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {UNIVERSITY_POLYGON_LEGEND.map((item) => (
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
  )
}

export default TechnicalPoi;
