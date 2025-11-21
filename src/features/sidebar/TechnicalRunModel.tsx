// src/features/sidebar/TechnicalRunModel.tsx
import { activeLayerAtom } from "@/atoms/LayerAtom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useAtom } from "jotai";
import { Eye, EyeOff, Info, Trash2 } from "lucide-react";
import { ROAD_NETWORK_LINE_LEGEND } from "../map/layers/roadNetworks/ensureRoadNetworkLayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  clickedRoadsAtom,
  roadSegmentActiveAtom,
  submittedRoadsAtom,
  type RoadSegmentType,
} from "@/atoms/ModelAtom";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const TechnicalRunModel = () => {
  const [layerActive, setLayerActive] = useAtom<string | null>(activeLayerAtom);
  const [roads, setRoads] = useAtom(clickedRoadsAtom);
  const [segment, setSegment] = useAtom(roadSegmentActiveAtom);
  const [submitted, setSubmitted] = useAtom(submittedRoadsAtom);

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

  const handleSubmit = () => {
    if (roads.length === 0) return;

    setSubmitted((prev) => {
      const existing = prev[segment];

      const dedupedToAdd = roads.filter(
        (r) => !existing.some((e) => e.gid === r.gid && e.city === r.city)
      );

      return {
        ...prev,
        [segment]: [...existing, ...dedupedToAdd],
      };
    });

    setRoads([]);
  };

  const handleRunModel = () => {
    console.log("running model with submitted roads", submitted);
  };

  const totalPainted = submitted.painted.length;
  const totalSeparated = submitted.separated.length;
  const totalQuiet = submitted.quiet.length;
  const totalSubmitted = totalPainted + totalSeparated + totalQuiet;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-foreground flex items-center justify-between p-4">
        <span>Run Model</span>
        <Button size="icon" variant="outline">
          <Info className="h-4 w-4" />
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
          className="border border-foreground"
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

        {/* Selected roads + segment selection (UNCHANGED STYLING) */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-foreground"
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
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left w-10">#</th>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left w-20">GID</th>
                        <th className="px-2 py-1 text-right w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {roads.map((road, idx) => (
                        <tr
                          key={`${road.city}-${road.gid}-${idx}`}
                          className="border-t"
                        >
                          <td className="px-2 py-1 align-top">{idx + 1}</td>
                          <td className="px-2 py-1 align-top">
                            {road.name || (
                              <span className="italic text-muted-foreground">
                                Unnamed road
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 align-top">{road.gid}</td>
                          <td className="px-2 py-1 align-top text-right">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {roads.length > 0 && (
                <div className="flex gap-3 items-center justify-center">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="font-medium">Segment type</span>
                  </div>
                  <Select
                    value={segment}
                    onValueChange={(value) => setSegment(value as RoadSegmentType)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full border border-foreground rounded-none shadow-none">
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
                    className="w-full border border-foreground rounded-none bg-accent-foreground text-background hover:bg-accent-foreground/90"
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

        {/* Submitted Roads – summary + TABLE */}
        <Accordion
          type="single"
          defaultValue="item-1"
          className="border border-foreground"
        >
          <AccordionItem value="item-1" className="p-4">
            <AccordionTrigger className="flex justify-between [&>svg]:hidden items-center">
              <div className="flex items-center gap-2">
                <span>Submitted Roads</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="mt-5 pb-0 text-xs space-y-4">
              <span className="text-muted-foreground block">
                These submitted roads are the ones which will be sent to the
                backend when you run the model.
              </span>

              {/* Per-segment counts */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Painted: {totalPainted}
                </Badge>
                <Badge variant="outline">
                  Separated: {totalSeparated}
                </Badge>
                <Badge variant="outline">
                  Quiet: {totalQuiet}
                </Badge>
              </div>

              {/* Flattened table of all submitted roads */}
              {totalSubmitted === 0 ? (
                <p className="text-muted-foreground italic">
                  No roads have been submitted yet. Add roads from the &quot;Select
                  Roads&quot; step above.
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left w-8">#</th>
                        <th className="px-2 py-1 text-left w-20">Segment</th>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left w-20">GID</th>
                        <th className="px-2 py-1 text-left w-20">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          ...submitted.painted.map((r) => ({
                            ...r,
                            segment: "painted" as RoadSegmentType,
                          })),
                          ...submitted.separated.map((r) => ({
                            ...r,
                            segment: "separated" as RoadSegmentType,
                          })),
                          ...submitted.quiet.map((r) => ({
                            ...r,
                            segment: "quiet" as RoadSegmentType,
                          })),
                        ] as (typeof submitted.painted[number] & {
                          segment: RoadSegmentType;
                        })[]
                      ).map((road, idx) => (
                        <tr key={`${road.segment}-${road.city}-${road.gid}-${idx}`} className="border-t">
                          <td className="px-2 py-1 align-top">{idx + 1}</td>
                          <td className="px-2 py-1 align-top capitalize">
                            {road.segment}
                          </td>
                          <td className="px-2 py-1 align-top">
                            {road.name || (
                              <span className="italic text-muted-foreground">
                                Unnamed road
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 align-top">{road.gid}</td>
                          <td className="px-2 py-1 align-top capitalize">
                            {road.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Run model button */}
              <div>
                <Button
                  className="w-full border border-foreground rounded-none bg-accent-foreground text-background hover:bg-accent-foreground/90"
                  size="sm"
                  disabled={totalSubmitted === 0}
                  onClick={handleRunModel}
                >
                  Run Model
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default TechnicalRunModel;
