import { activeLayerAtom } from "@/atoms/LayerAtom"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// import { Switch } from "@/components/ui/switch"
import { useAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"

const TechnicalCurrentCyclingConditions = () => {
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
                <span>Cycling Metrics</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('cycling-metrics')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'cycling-metrics' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Percentage of residents cycling for various purposes. This percentage is reproduced based on a cycling survey (2022-2023).
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
                <span>Severe Cycling Crashes</span>
              </div>

              {/* RIGHT: Eye Icon (controlled by layerActive) */}
              <span
                onClick={() => {
                  toggleLayer('severe-cycling-crashes')
                  // e.stopPropagation();     // prevent accordion toggle
                }}
                className="cursor-pointer"
              >
                {layerActive === 'severe-cycling-crashes' ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5">
              <span className="text-muted-foreground">
                Crashes involving cyclists reported to police (2016-2020).
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </div>
  )
}

export default TechnicalCurrentCyclingConditions
