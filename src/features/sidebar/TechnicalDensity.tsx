import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"
import { POPULATION_DENSITY_LEGEND } from "@/features/map/layers/density/ensurePopulationDensityLayer";
import { JOB_DENSITY_LEGEND } from "../map/layers/density/ensureJobDensityLayer";

const TechnicalDensity = () => {
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
        Density
      </div>

      <div style={{ height: 'calc(100dvh - 128px)' }} className="p-4 flex flex-col gap-4 overflow-y-auto soft-scrollbar-right">
        <Accordion type="single" defaultValue="item-1" className="border border-foreground">
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger
              className="flex justify-between [&>svg]:hidden items-center"
            >
              {/* LEFT: Title */}
              <div className="flex items-center gap-2">
                <span>Population Density</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('population-density')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'population-density' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Number of residents per square kilometre.
              </span>

              {/* Population density legend */}
              <div className="space-y-2 mt-1 text-xs px-1 pt-2">
                {POPULATION_DENSITY_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-black/10"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.label}
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
                <span>Job Density by SA2</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('job-density')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'job-density' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                Number of jobs per square kilometre.
              </span>
              <div className="space-y-2 mt-1 text-xs px-1 pt-2">
                {JOB_DENSITY_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-black/10"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.label}
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

export default TechnicalDensity;
