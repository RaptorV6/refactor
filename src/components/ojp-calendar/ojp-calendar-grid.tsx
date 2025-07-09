// src/components/ojp-calendar/ojp-calendar-grid.tsx (oprava unused vars)
import type { QRL, Signal } from "@builder.io/qwik";

import { component$, useComputed$, useSignal, useStyles$ } from "@builder.io/qwik";

import type { OjpEventPositioned, OjpSal, OjpSalInfo } from "~/routes/(protected)/ojp/_mock-events";

import { OjpStationRow } from "./ojp-station-row";

const gridStyles = `
  .ojp-calendar-grid {
    contain: layout style paint;
  }
  
  .ojp-drag-ghost {
    position: absolute;
    top: -1000px;
    left: -1000px;
    opacity: 0.8;
    transform: rotate(3deg);
    pointer-events: none;
    z-index: 9999;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

type StructureItem =
  | { date: Date; dayIndex: number; dayName: string; type: "day" }
  | { date: Date; dayIndex: number; sal: OjpSalInfo; type: "sal" };

type OjpCalendarGridProps = {
  dates: { date: Date }[];
  events: OjpEventPositioned[];
  newEventTrigger: Signal<{ dateTime: Date; forceOtherSlots?: boolean; sal: OjpSal } | null>;
  onEventClick$?: QRL<(event: any) => void>;
  onEventDrop$?: QRL<(eventId: string, newDate: Date, newSal: OjpSal, newTime: Date) => void>;
  saly: OjpSalInfo[];
  timeHourFrom: number;
  times: { time: Date }[];
};

export const OjpCalendarGrid = component$<OjpCalendarGridProps>(
  ({ dates, events, newEventTrigger, onEventClick$, onEventDrop$, saly, timeHourFrom, times }) => {
    useStyles$(gridStyles);

    const dayNames = ["PONDĚLÍ", "ÚTERÝ", "STŘEDA", "ČTVRTEK", "PÁTEK"];
    const scrollContainerRef = useSignal<HTMLDivElement>();
    const scrollLeft = useSignal(0);
    const dragGhostRef = useSignal<HTMLDivElement>();

    const gridConfig = useComputed$(() => {
      const slotWidth = 24;
      const totalSlots = times.length * 12;
      const salsWidth = 140;
      const rowHeight = 40;
      const totalGridWidth = salsWidth + totalSlots * slotWidth;
      const hoursGridTemplate = `${salsWidth}px repeat(${times.length}, ${12 * slotWidth}px)`;
      const minutesGridTemplate = `${salsWidth}px repeat(${totalSlots}, ${slotWidth}px)`;

      return {
        hoursGridTemplate,
        minutesGridTemplate,
        rowHeight,
        salsWidth,
        slotWidth,
        totalGridWidth,
        totalSlots,
      };
    });

    const structure = useComputed$(() => {
      const result: StructureItem[] = [];
      if (Array.isArray(dates)) {
        dates.forEach((date, dayIndex) => {
          result.push({
            date: date.date,
            dayIndex,
            dayName: dayNames[dayIndex] || dayNames[0],
            type: "day",
          });

          if (Array.isArray(saly)) {
            saly.forEach((sal) => {
              result.push({
                date: date.date,
                dayIndex,
                sal,
                type: "sal",
              });
            });
          }
        });
      }
      return result;
    });

    return (
      <div class="flex h-full flex-col">
        <div class="ojp-drag-ghost" id="drag-ghost" ref={dragGhostRef}>
          📅 Přesouvám událost...
        </div>

        <div
          class="flex-1 overflow-auto"
          onScroll$={(e) => {
            const target = e.target as HTMLDivElement;
            scrollLeft.value = target.scrollLeft;
          }}
          ref={scrollContainerRef}
        >
          <div class="ojp-calendar-grid" style={`min-width: ${gridConfig.value.totalGridWidth}px; width: 100%;`}>
            <div class="sticky top-0 z-30 border-b bg-white shadow-sm">
              <div
                class="grid"
                style={`grid-template-columns: ${gridConfig.value.hoursGridTemplate}; height: ${gridConfig.value.rowHeight}px; min-width: ${gridConfig.value.totalGridWidth}px;`}
              >
                <div class="sticky left-0 z-40 flex items-center justify-center border-r-2 border-gray-400 bg-gray-100 text-sm font-bold">
                  Den / Sál
                </div>
                {times.map((time) => (
                  <div
                    class="flex items-center justify-center border-r border-gray-300 bg-gray-50 text-lg font-semibold"
                    key={`hour-${time.time.getHours()}`}
                  >
                    {String(time.time.getHours()).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              <div
                class="grid text-xs"
                style={`grid-template-columns: ${gridConfig.value.minutesGridTemplate}; height: ${gridConfig.value.rowHeight / 2}px; min-width: ${gridConfig.value.totalGridWidth}px;`}
              >
                <div class="sticky left-0 z-40 border-r-2 border-gray-400 bg-gray-50"></div>
                {times.flatMap((time) =>
                  Array.from({ length: 12 }, (_, i) => (
                    <div
                      class="flex items-center justify-center border-r border-gray-200 bg-gray-50 text-gray-600"
                      key={`minute-${time.time.getHours()}-${i * 5}`}
                    >
                      {String(i * 5).padStart(2, "0")}
                    </div>
                  )),
                )}
              </div>
            </div>

            <div style={`min-width: ${gridConfig.value.totalGridWidth}px;`}>
              {structure.value.map((item: StructureItem) => {
                if (item.type === "day") {
                  return (
                    <div
                      class="grid border-b border-gray-300 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      key={`day-${item.dayIndex}`}
                      style={`grid-template-columns: ${gridConfig.value.salsWidth}px 1fr; height: ${gridConfig.value.rowHeight}px; min-width: ${gridConfig.value.totalGridWidth}px;`}
                    >
                      <div class="sticky left-0 flex items-center justify-center border-r-2 border-blue-400 bg-gradient-to-r from-blue-600 to-blue-700 font-bold">
                        {item.dayName} {item.date.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" })}
                      </div>
                      <div class="border-r border-blue-400"></div>
                    </div>
                  );
                } else {
                  return (
                    <OjpStationRow
                      date={item.date}
                      events={events}
                      gridConfig={gridConfig.value}
                      key={`sal-${item.dayIndex}-${item.sal.name}`}
                      newEventTrigger={newEventTrigger}
                      onEventClick$={onEventClick$}
                      onEventDrop$={onEventDrop$}
                      sal={item.sal}
                      timeHourFrom={timeHourFrom}
                    />
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
