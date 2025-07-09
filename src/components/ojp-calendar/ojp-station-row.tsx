// src/components/ojp-calendar/ojp-station-row.tsx (oprava chyb)
import type { QRL, Signal } from "@builder.io/qwik";

import { component$, useComputed$ } from "@builder.io/qwik";

import type { OjpEventPositioned, OjpSal, OjpSalInfo } from "~/routes/(protected)/ojp/_mock-events";

import { OjpStationHeader } from "./ojp-station-header";
import { OjpTimeSlot } from "./ojp-time-slot";

type OjpStationRowProps = {
  date: Date;
  events: OjpEventPositioned[];
  gridConfig: {
    minutesGridTemplate: string;
    rowHeight: number;
    salsWidth: number;
    slotWidth: number;
    totalGridWidth: number;
    totalSlots: number;
  };
  newEventTrigger: Signal<{ dateTime: Date; forceOtherSlots?: boolean; sal: OjpSal } | null>;
  onEventClick$?: QRL<(event: any) => void>;
  onEventDrop$?: QRL<(eventId: string, newDate: Date, newSal: OjpSal, newTime: Date) => void>;
  sal: OjpSalInfo;
  timeHourFrom: number;
};

export const OjpStationRow = component$<OjpStationRowProps>(
  ({ date, events, gridConfig, newEventTrigger, onEventClick$, onEventDrop$, sal, timeHourFrom }) => {
    const rowEvents = useComputed$(() =>
      events.filter((event) => event.dateFrom.toDateString() === date.toDateString() && event.sal === sal.name),
    );

    const vykonyCount = useComputed$(() => rowEvents.value.filter((event) => event.typ === "operace").length);

    return (
      <div
        class="relative grid border-b border-gray-200"
        style={`grid-template-columns: ${gridConfig.minutesGridTemplate}; height: ${gridConfig.rowHeight}px; min-width: ${gridConfig.totalGridWidth}px;`}
      >
        <OjpStationHeader sal={sal} vykonyCount={vykonyCount.value} />

        {Array.from({ length: gridConfig.totalSlots }, (_, slotIndex) => (
          <OjpTimeSlot
            date={date}
            events={events}
            key={`slot-${slotIndex}`}
            newEventTrigger={newEventTrigger}
            onEventDrop$={onEventDrop$}
            sal={sal}
            slotIndex={slotIndex}
            timeHourFrom={timeHourFrom}
          />
        ))}

        {rowEvents.value.map((event) => (
          <div
            class="absolute z-10"
            key={event.id}
            style={`
              left: ${gridConfig.salsWidth + (((event.dateFrom.getHours() - timeHourFrom) * 60 + event.dateFrom.getMinutes()) / 5) * gridConfig.slotWidth}px;
              width: ${(event.duration / 5) * gridConfig.slotWidth}px;
              top: 4px;
              bottom: 4px;
            `}
          >
            <button
              class="group absolute inset-0 flex flex-col overflow-hidden rounded-lg border-2 p-1 text-xs font-semibold hover:cursor-grab active:cursor-grabbing"
              onClick$={() => {
                if (onEventClick$) {
                  onEventClick$(event);
                }
              }}
              style={`
                background-color: ${event.typ === "svatek" || event.typ === "uklid" || event.typ === "pauza" ? "#e5e7eb" : sal.bgColor};
                border-color: ${event.typ === "svatek" || event.typ === "uklid" || event.typ === "pauza" ? "#9ca3af" : sal.color};
                color: ${event.typ === "svatek" || event.typ === "uklid" || event.typ === "pauza" ? "#374151" : "#000"};
              `}
              type="button"
            >
              <div class="pointer-events-none overflow-hidden text-center leading-tight">{event.title}</div>
            </button>
          </div>
        ))}
      </div>
    );
  },
);
