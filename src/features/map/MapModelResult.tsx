import { useState } from "react";
import {
  accessibilityResultAtom,
  potentialResultAtom,
  predictionResultAtom,
} from "@/atoms/ModelAtom";
import { useAtomValue } from "jotai";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { X, BarChart3 } from "lucide-react";

const ECON_TRIP_DISTANCE_KM = 2.85;
const ECON_BENEFIT_PER_KM = 1.06;
const WEEKS_PER_YEAR = 52;

const MapModelResults = () => {
  const accessibility = useAtomValue(accessibilityResultAtom);
  const prediction = useAtomValue(predictionResultAtom);
  const potential = useAtomValue(potentialResultAtom);

  const hasAccessibility = !!accessibility;
  const hasPrediction = !!prediction;
  const hasPotential = !!potential;

  const [isOpen, setIsOpen] = useState(true);

  // nothing to show yet
  if (!hasAccessibility && !hasPrediction && !hasPotential) return null;

  // When "closed", show a tiny icon button in the same corner
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="
          absolute bottom-2 right-2 z-10
          rounded-full bg-background/95 border border-sidebar-border
          shadow-lg p-2
          flex items-center justify-center
          hover:bg-accent hover:text-accent-foreground
          transition
        "
        aria-label="Show model results"
      >
        <BarChart3 className="w-4 h-4" />
      </button>
    );
  }

  const defaultTab = hasAccessibility
    ? "accessibility"
    : hasPrediction
    ? "prediction"
    : "potential";

  // ---- Economic benefit (based on prediction) ----
  const economicAnnualBenefit =
    prediction
      ? prediction.overall.additional_trips_transport *
        ECON_TRIP_DISTANCE_KM *
        ECON_BENEFIT_PER_KM *
        WEEKS_PER_YEAR
      : null;

  return (
    <div className="absolute bottom-2 right-2 z-10 w-[430px]">
      <div
        className="
          relative
          bg-background/95 backdrop-blur
          border border-sidebar-border rounded-md shadow-lg
          p-3 text-xs text-card-foreground
          max-h-full overflow-y-auto
        "
      >
        {/* Close (X) button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 rounded-sm opacity-70 hover:opacity-100 transition"
          aria-label="Hide model results"
        >
          <X className="size-4" />
        </button>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-2 w-[95%]">
            {hasAccessibility && (
              <TabsTrigger value="accessibility">
                Accessibility
              </TabsTrigger>
            )}
            {hasPrediction && (
              <TabsTrigger value="prediction">
                Prediction
              </TabsTrigger>
            )}
            {hasPotential && (
              <TabsTrigger value="potential">
                Potential
              </TabsTrigger>
            )}
          </TabsList>

          {/* Accessibility */}
          {hasAccessibility && (
            <TabsContent value="accessibility" className="mt-1 h-[210px]">
              <Table className="w-full">
                <TableBody>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Population affected
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.population.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Jobs
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.jobs.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Parks
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.park.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Schools
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.school.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Services
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.service.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Transit
                    </TableCell>
                    <TableCell className="text-right">
                      {accessibility!.transit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          )}

          {/* Prediction */}
          {hasPrediction && (
            <TabsContent
              value="prediction"
              className="mt-1 space-y-2 h-[210px]"
            >
              <Table className="w-full">
                <TableBody>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Δ cycling participation
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction!.overall.increased_cycling_participation}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + cyclists (transport)
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction!.overall.additional_cyclists_transport}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + cyclists (recreation)
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction!.overall.additional_cyclists_recreation}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + trips (transport)
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction!.overall.additional_trips_transport}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + trips (recreation)
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction!.overall.additional_trips_recreation}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          )}

          {/* Potential */}
          {hasPotential && (
            <TabsContent value="potential" className="mt-1 h-[210px]">
              <Table className="w-full">
                <TableBody>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      Δ cycling participation
                    </TableCell>
                    <TableCell className="text-right">
                      {potential!.overall.increased_cycling_participation}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + cyclists (transport)
                    </TableCell>
                    <TableCell className="text-right">
                      {potential!.overall.additional_cyclists_transport}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + cyclists (recreation)
                    </TableCell>
                    <TableCell className="text-right">
                      {potential!.overall.additional_cyclists_recreation}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + trips (transport)
                    </TableCell>
                    <TableCell className="text-right">
                      {potential!.overall.additional_trips_transport}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pr-2 text-muted-foreground">
                      + trips (recreation)
                    </TableCell>
                    <TableCell className="text-right">
                      {potential!.overall.additional_trips_recreation}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          )}
        </Tabs>

        {/* Economic Benefits */}
        {economicAnnualBenefit !== null && (
          <div className="mt-2 border-t border-border pt-2 space-y-1">
            <div className="font-semibold text-xs">
              Economic benefits (annual)
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Estimated benefit per year
              </span>
              <span className="font-medium">
                $
                {economicAnnualBenefit.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Calculation = Additional transport cycling trips (per week) ×
              2.85 km × $1.06 per km × 52 weeks
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapModelResults;
