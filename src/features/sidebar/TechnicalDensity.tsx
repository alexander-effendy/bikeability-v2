import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"

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

      <div className="p-4 flex flex-col gap-4">
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

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Number of residents per square kilometre.
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

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Number of jobs per square kilometre.
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </div>
  )
}

export default TechnicalDensity;
