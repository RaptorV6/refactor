// src/routes/(protected)/ojp/ojp-horizontal-calendar.tsx
import type { QRL, Signal } from "@builder.io/qwik";

import { component$ } from "@builder.io/qwik";

import { OjpCalendarGrid } from "~/components/ojp-calendar";

import type { OjpEventPositioned, OjpSal, OjpSalInfo } from "./_mock-events";

type OjpHorizontalCalendarProps = {
  dates: { date: Date }[];
  events: OjpEventPositioned[];
  newEventTrigger: Signal<{ dateTime: Date; forceOtherSlots?: boolean; sal: OjpSal } | null>;
  onEventClick$?: QRL<(event: any) => void>;
  onEventDrop$?: QRL<(eventId: string, newDate: Date, newSal: OjpSal, newTime: Date) => void>;
  saly: OjpSalInfo[];
  timeHourFrom: number;
  times: { time: Date }[];
};

export const OjpHorizontalCalendar = component$<OjpHorizontalCalendarProps>(
  ({ dates, events, newEventTrigger, onEventClick$, onEventDrop$, saly, timeHourFrom, times }) => {
    return (
      <OjpCalendarGrid
        dates={dates}
        events={events}
        newEventTrigger={newEventTrigger}
        onEventClick$={onEventClick$}
        onEventDrop$={onEventDrop$}
        saly={saly}
        timeHourFrom={timeHourFrom}
        times={times}
      />
    );
  },
);
