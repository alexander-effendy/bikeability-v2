import { Separator } from "@/components/ui/separator";
import { useAtom } from "jotai";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";

import { aboutOpenAtom } from "@/atoms/GeneralAtom";

export default function AboutModal() {
  const [isOpen, setIsOpen] = useAtom<boolean>(aboutOpenAtom);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[95vh] sm:max-h-[90vh] overflow-y-auto soft-scrollbar-right sm:max-w-[700px] border border-sidebar-border p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-3 text-card-foreground">
            NCDAP Bikeability - Scenario Builder
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mb-4">
            
          </DialogDescription>
        </DialogHeader>

        {/* About this project */}
        <div className="space-y-2">
          <h3>About</h3>
          <p className="text-sm text-card-foreground">
            The Cycling Infrastructure Scenario Planning Tool is designed to allow transport planners and community members to rapidly explore a wide range of possible bike infrastructure scenarios. It uses a wide range of new and existing data (including demographics, current cycling attitudes, preferences and behaviours and geographic information such as existing infrastructure networks and the locations of job centres, housing developments, open space and schools) to build a population model of each greater city area. The tool allows users to create new bike infrastructure, and the population model predicts how many people are likely to start riding – as well as how many new destinations (including work locations, shopping centres, and parks) can be reached by bike – as a result of the new paths and lanes. In this way, the Tool helps councils and communities prioritise effective routes that allow more people to ride safely and comfortably for commute, utility, and recreation trips.
          </p>
        </div>

        <Separator className="my-6 bg-muted-foreground" />

        {/* Methodology */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-button-primary">
            Methodology
          </h3>
          <p className="text-sm text-card-foreground">
            New cycling infrastructure increases cycling participation, and the effectiveness of such infrastructure depends on both its location and the amount of new infrastructure provided. The bikeability tool provides quantitative comparisons between different cycling infrastructure investment scenarios to help make more informed decisions. The modeling approach is centred on two pieces: a synthetic population model of each greater city area, and discrete choice models calibrated to predict the likelihood of an individual to cycle. The synthetic population model is based on Australian Bureau of Statistics (ABS) census data, and includes representation for each city population. Discrete choice models are calibrated using data from a cycling survey, which includes data on individual preference, attitudinal variables, social demographics and areal level variables describing the characteristics of where a respondent lives. In order for models to be applied to the each city, these individual attributes are reproduced in the synthetic population data. Discrete choice models predict the likelihood of an individual to cycle for different purposes. As a first step towards estimating how cycling participation can be affected by external intervention, discrete choice models are applied to the synthetic population data to reproduce the current base level of cycling participation. This base level of cycling participation serves as the benchmark for comparing the effectiveness of different cycling investment and policy intervention scenarios.
          </p>
          <p className="text-xs text-muted-foreground">
            All results are modelled estimates and should be interpreted as
            indicative, not exact forecasts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
