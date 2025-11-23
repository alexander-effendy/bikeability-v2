// src/features/sidebar/TechnicalRunModel.tsx
import { activeLayerAtom } from "@/atoms/LayerAtom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useAtom, useAtomValue } from "jotai";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { ROAD_NETWORK_LINE_LEGEND } from "../map/layers/roadNetworks/ensureRoadNetworkLayer";
import { Button } from "@/components/ui/button";

import {
  accessibilityResultAtom,
  clickedRoadsAtom,
  computedRoadsAtom,
  potentialResultAtom,
  type PotentialResultData,
  predictionResultAtom,
  type PredictionResultData,
  roadSegmentActiveAtom,
  submittedRoadsAtom,
  type AccessibilityResultData,
  type RoadSegmentType,
  type SubmittedRoadsState,
} from "@/atoms/ModelAtom";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

import {
  computeLengthFromSegmentFID,
  calculateAccessibility,
  calculatePredictionModel,
  calculatePotentialModel,
} from "@/api/routes/model";

import { activeCityAtom, type CityId } from "@/atoms/GeneralAtom";
import { normaliseResponse } from "@/lib/modelHelper";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const TechnicalRunModel = () => {
  const [layerActive, setLayerActive] = useAtom<string | null>(activeLayerAtom);
  const [roads, setRoads] = useAtom(clickedRoadsAtom);
  const [segment, setSegment] = useAtom<RoadSegmentType>(roadSegmentActiveAtom);
  const [submitted, setSubmitted] =
    useAtom<SubmittedRoadsState>(submittedRoadsAtom);
  const [computedRoads, setComputedRoads] = useAtom(computedRoadsAtom);
  const activeCity = useAtomValue<CityId>(activeCityAtom);

  const [accessibilityResult, setAccessibilityResult] =
    useAtom<AccessibilityResultData | null>(accessibilityResultAtom);
  const [predictionResult, setPredictionResult] =
    useAtom<PredictionResultData | null>(predictionResultAtom);
  const [potentialResult, setPotentialResult] =
    useAtom<PotentialResultData | null>(potentialResultAtom);

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    console.log(accessibilityResult);
  }, [accessibilityResult]);

  useEffect(() => {
    console.log(predictionResult);
  }, [predictionResult]);

  useEffect(() => {
    console.log(potentialResult);
  }, [potentialResult]);

  useEffect(() => {
    console.log(submitted);
  }, [submitted]);

  const toggleLayer = (layerName: string) => {
    if (layerActive === layerName) {
      setLayerActive(null);
    } else {
      setLayerActive(layerName);
    }
  };

  const handleRemoveRoad = (gid: number, city: string) => {
    setRoads((prev) => prev.filter((r) => !(r.gid === gid && r.city === city)));
  };

  const handleSubmit = async () => {
    if (roads.length === 0) return;

    // 1️⃣ Build "next" version of submittedRoads (so we can both set it and send it)
    const newEntries = roads.map((r) => ({ gid: r.gid }));

    const existingForSegment = submitted[segment];
    const dedupedToAdd = newEntries.filter(
      (r) => !existingForSegment.some((e) => e.gid === r.gid)
    );

    const nextSubmitted = {
      ...submitted,
      [segment]: [...existingForSegment, ...dedupedToAdd],
    };

    // Update Jotai atom so it stays persistent
    setSubmitted(nextSubmitted);

    // 2️⃣ Build bikepathtype payload from nextSubmitted
    const bikepathtype = {
      painted: nextSubmitted.painted,
      quiet: nextSubmitted.quiet,
      separated: nextSubmitted.separated,
    };

    // 3️⃣ Call backend to compute length
    try {
      const result = await computeLengthFromSegmentFID({
        userid: 1,
        location: activeCity,
        bikepathtype,
      });

      const res = normaliseResponse(result);
      console.log(res);
      setComputedRoads(res);
    } catch (error) {
      console.error("Failed to compute length", error);
      // maybe toast / UI error handling here
    }

    // 4️⃣ Clear current selection
    setRoads([]);
  };

  const handleRunModels = async () => {
    if (computedRoads.length === 0) {
      console.warn("No computed roads to run models on.");
      return;
    }

    setIsRunning(true);

    // Build "changes" payload in the format expected by the backend
    const changes = computedRoads.reduce(
      (acc, row, index) => {
        const key = String(index);
        acc.sa1_code21[key] = row.sa1_code21;
        acc.painted[key] = row.painted;
        acc.separated[key] = row.separated;
        acc.quiet[key] = row.quiet;
        return acc;
      },
      {
        sa1_code21: {} as Record<string, string>,
        painted: {} as Record<string, number>,
        separated: {} as Record<string, number>,
        quiet: {} as Record<string, number>,
      }
    );

    const accessibilityPayload = {
      userid: 1,
      location: activeCity,
      modelyear: "2025",
      changes,
    };

    const predictionPayload = {
      userid: 1,
      location: activeCity,
      modelyear: "2025",
      scenarios: "perceptions1%",
      changes,
    };

    const potentialPayload = {
      userid: 1,
      location: activeCity,
      modelyear: "2025",
      scenarios: "cbd_perceptions",
      changes,
    };

    try {
      const [accessRes, predRes, potRes] = await Promise.all([
        calculateAccessibility(accessibilityPayload),
        calculatePredictionModel(predictionPayload),
        calculatePotentialModel(potentialPayload),
      ]);

      setAccessibilityResult(accessRes);
      setPredictionResult(predRes);
      setPotentialResult(potRes);
    } catch (err) {
      console.error("Failed to run models", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearAll = () => {
    // Clear clicked roads
    setRoads([]);

    // Reset submitted roads
    setSubmitted({
      painted: [],
      separated: [],
      quiet: [],
    });

    // Clear computed roads
    setComputedRoads([]);

    // Clear model results
    setAccessibilityResult(null);
    setPredictionResult(null);
    setPotentialResult(null);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-sidebar-border flex items-center justify-between p-4">
        <span>Run Model</span>
        <Button
          size="sm"
          variant="outline"
          className="h-5.5 px-3 text-xs"
          onClick={handleClearAll}
        >
          Clear all
        </Button>
      </div>

      <div
        style={{ height: "calc(100dvh - 128px)" }}
        className="p-4 flex flex-col gap-4 overflow-y-auto soft-scrollbar-right"
      >
        {/* Road network visibility */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-sidebar-border"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Road Network</span>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayer("road-network");
                }}
                className="cursor-pointer"
              >
                {layerActive === "road-network" ? (
                  <Eye className="size-5" />
                ) : (
                  <EyeOff className="size-5" />
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs">
              <span className="text-muted-foreground">
                The whole road network throughout the city.
              </span>
              <div className="space-y-1 mt-1 text-xs px-1 pt-2">
                {ROAD_NETWORK_LINE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-1 dark:h-0.5 w-10 border"
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

        {/* Selected roads + segment selection */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-sidebar-border"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Select Roads</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs space-y-4">
              <span className="text-muted-foreground block">
                Click on the roads on the map to select them. Selected roads will
                be highlighted in cyan. You can then assign them to a segment
                type and submit for modelling.
              </span>

              {roads.length === 0 ? (
                <p className="text-muted-foreground italic">
                  No roads selected yet. Click on road segments on the map to add
                  them here.
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table className="w-full text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 py-1 text-left w-10">
                          #
                        </TableHead>
                        <TableHead className="px-2 py-1 text-left">
                          Name
                        </TableHead>
                        <TableHead className="px-2 py-1 text-left w-20">
                          GID
                        </TableHead>
                        <TableHead className="px-2 py-1 text-right w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roads.map((road, idx) => (
                        <TableRow
                          key={`${road.city}-${road.gid}-${idx}`}
                          className="border-t"
                        >
                          <TableCell className="px-2 py-1 align-top">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="px-2 py-1 align-top">
                            {road.name || (
                              <span className="italic text-muted-foreground">
                                Unnamed road
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1 align-top">
                            {road.gid}
                          </TableCell>
                          <TableCell className="px-2 py-1 align-top text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() =>
                                handleRemoveRoad(road.gid, road.city)
                              }
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {roads.length > 0 && (
                <div className="flex gap-3 items-center justify-center">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="font-medium">Segment type</span>
                  </div>
                  <Select
                    value={segment}
                    onValueChange={(value) =>
                      setSegment(value as RoadSegmentType)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-full border border-sidebar-border rounded-none shadow-none">
                      <SelectValue placeholder="Choose segment type" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="painted">Painted</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                      <SelectItem value="quiet">Quiet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {roads.length > 0 && (
                <div>
                  <Button
                    className="w-full border border-sidebar-border rounded-none bg-accent-foreground text-background hover:bg-accent-foreground/90"
                    size="sm"
                    disabled={roads.length === 0}
                    onClick={handleSubmit}
                  >
                    Add these roads to the next step
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Computed Roads – summary + TABLE */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-sidebar-border"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Computed Road Lengths</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs space-y-4">
              {computedRoads.length === 0 ? (
                <p className="text-muted-foreground italic">
                  No computed lengths yet. Add roads and submit them to see
                  length by SA1.
                </p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="border rounded-md p-3 space-y-1 bg-background/40">
                    <p className="font-medium">Summary (total metres)</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">
                          Painted
                        </span>
                        <span>
                          {computedRoads
                            .reduce((sum, r) => sum + r.painted, 0)
                            .toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Separated
                        </span>
                        <span>
                          {computedRoads
                            .reduce((sum, r) => sum + r.separated, 0)
                            .toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Quiet
                        </span>
                        <span>
                          {computedRoads
                            .reduce((sum, r) => sum + r.quiet, 0)
                            .toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border rounded-md overflow-hidden">
                    <Table className="w-full text-xs">
                      <TableHeader>
                        <TableRow className="bg-background/60">
                          <TableHead className="px-2 py-1 text-left">
                            SA1 code
                          </TableHead>
                          <TableHead className="px-2 py-1 text-right">
                            Painted (m)
                          </TableHead>
                          <TableHead className="px-2 py-1 text-right">
                            Separated (m)
                          </TableHead>
                          <TableHead className="px-2 py-1 text-right">
                            Quiet (m)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {computedRoads.map((row) => (
                          <TableRow key={row.sa1_code21} className="border-t">
                            <TableCell className="px-2 py-1 align-top">
                              {row.sa1_code21}
                            </TableCell>
                            <TableCell className="px-2 py-1 align-top text-right">
                              {row.painted.toFixed(1)}
                            </TableCell>
                            <TableCell className="px-2 py-1 align-top text-right">
                              {row.separated.toFixed(1)}
                            </TableCell>
                            <TableCell className="px-2 py-1 align-top text-right">
                              {row.quiet.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="pt-2">
                    <Button
                      className="w-full border border-sidebar-border rounded-none bg-primary text-foreground hover:bg-primary/90"
                      size="sm"
                      onClick={handleRunModels}
                      disabled={computedRoads.length === 0 || isRunning}
                    >
                      {isRunning && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isRunning ? "Running..." : "Run model"}
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default TechnicalRunModel;
