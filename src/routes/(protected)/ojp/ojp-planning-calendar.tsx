// src/routes/(protected)/ojp/ojp-planning-calendar.tsx
import { Card } from "@akeso/ui-components";
import { $, component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";

import type { OjpDen, OjpSal } from "./_mock-events";

import { updateOjpEvent } from "./_actions";
import { getWeekEvents, useOjpPlanningData } from "./_loaders";
import { getDenFromDate } from "./_mock-events";
import { OjpCalendarHeader } from "./ojp-calendar-header";
import { OjpEventModal } from "./ojp-event-modal";
import { OjpHorizontalCalendar } from "./ojp-horizontal-calendar";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + weeks * 7);
  return result;
}

export const OjpPlanningCalendar = component$(() => {
  const staticData = useOjpPlanningData().value;

  const currentWeekStart = useSignal(staticData.weekStart);
  const eventsSignal = useSignal(getWeekEvents(staticData.weekStart));
  const refreshTrigger = useSignal(0);

  const showNewEventModal = useSignal(false);
  const showEditEventModal = useSignal(false);
  const selectedEvent = useSignal<any>(null);

  // 🆕 Track pending drag&drop updates
  const pendingUpdates = useSignal<Set<string>>(new Set());

  const newEventData = useStore<{
    dateTime?: Date;
    forceOtherSlots?: boolean;
    sal?: OjpSal;
  }>({});

  const newEventTrigger = useSignal<{ dateTime: Date; forceOtherSlots?: boolean; sal: OjpSal } | null>(null);

  const dates = useSignal(
    Array.from({ length: 5 }, (_, i) => {
      const date = new Date(currentWeekStart.value);
      date.setDate(currentWeekStart.value.getDate() + i);
      return { date };
    }),
  );

  useTask$(({ track }) => {
    const weekStart = track(() => currentWeekStart.value);
    track(() => refreshTrigger.value); // 🔧 Jen track bez assignment

    // Načti fresh data ze serveru
    const serverEvents = getWeekEvents(weekStart);

    // Pokud nemáme pending updates, použij server data
    if (pendingUpdates.value.size === 0) {
      eventsSignal.value = serverEvents;
    } else {
      // Merge server events s lokálními změnami
      const currentEvents = eventsSignal.value;
      const mergedEvents = serverEvents.map((serverEvent) => {
        // Najdi lokální verzi
        const localEvent = currentEvents.find((e) => e.id === serverEvent.id);

        // Pokud je event pending, použij lokální verzi
        if (localEvent && pendingUpdates.value.has(serverEvent.id)) {
          return localEvent;
        }

        // Jinak použij server verzi
        return serverEvent;
      });

      // Přidej i nové eventy, které nejsou na serveru
      const newLocalEvents = currentEvents.filter(
        (localEvent) => !serverEvents.some((serverEvent) => serverEvent.id === localEvent.id),
      );

      eventsSignal.value = [...mergedEvents, ...newLocalEvents];
    }

    if (selectedEvent.value) {
      const eventExists = eventsSignal.value.some((e) => e.id === selectedEvent.value?.id);
      if (!eventExists) {
        selectedEvent.value = null;
        showEditEventModal.value = false;
      }
    }

    dates.value = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { date };
    });
  });

  useTask$(({ track }) => {
    const isModalOpen = track(() => showEditEventModal.value);

    if (!isModalOpen && selectedEvent.value) {
      selectedEvent.value = null;
    }
  });

  useTask$(({ track }) => {
    const trigger = track(() => newEventTrigger.value);
    if (trigger) {
      newEventData.dateTime = trigger.dateTime;
      newEventData.sal = trigger.sal;
      newEventData.forceOtherSlots = trigger.forceOtherSlots;

      showNewEventModal.value = true;
      newEventTrigger.value = null;
    }
  });

  const handlePrevWeek = $(() => {
    currentWeekStart.value = addWeeks(currentWeekStart.value, -1);
  });

  const handleNextWeek = $(() => {
    currentWeekStart.value = addWeeks(currentWeekStart.value, 1);
  });

  const handleToday = $(() => {
    currentWeekStart.value = startOfWeek(new Date());
  });

  const handleEventClick = $((event: any) => {
    selectedEvent.value = event;
    showEditEventModal.value = true;
  });

  // src/routes/(protected)/ojp/ojp-planning-calendar.tsx
  const handleEventDrop = $((eventId: string, newDate: Date, newSal: OjpSal, newTime: Date) => {
    const event = eventsSignal.value.find((e) => e.id === eventId);
    if (!event || !(newTime instanceof Date)) {
      return;
    }

    pendingUpdates.value = new Set([...pendingUpdates.value, eventId]);

    const originalDuration = event.dateTo.getTime() - event.dateFrom.getTime();
    const newEndTime = new Date(newTime.getTime() + originalDuration);

    const newDen: OjpDen = getDenFromDate(newDate);
    const updatedEvents = eventsSignal.value.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          dateFrom: newTime,
          dateTo: newEndTime,
          den: newDen,
          sal: newSal,
        };
      }
      return e;
    });
    eventsSignal.value = updatedEvents;

    // 🔧 OPRAVA: Správné datum bez timezone problémů
    const localDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000);
    const dateString = localDate.toISOString().split("T")[0];

    const updateData = {
      casDo: newEndTime.toTimeString().slice(0, 5),
      casOd: newTime.toTimeString().slice(0, 5),
      datum: dateString, // 🔧 Použijeme local date
      id: eventId,
      operator: event.operator || "",
      poznamka: event.poznamka || "",
      sal: newSal,
      title: event.title,
      typ: event.typ,
    };

    try {
      const result = updateOjpEvent(updateData);

      const newPending = new Set(pendingUpdates.value);
      newPending.delete(eventId);
      pendingUpdates.value = newPending;

      if (!result.success) {
        eventsSignal.value = eventsSignal.value.map((e) => {
          if (e.id === eventId) {
            return event;
          }
          return e;
        });
      }
    } catch {
      const newPending = new Set(pendingUpdates.value);
      newPending.delete(eventId);
      pendingUpdates.value = newPending;

      eventsSignal.value = eventsSignal.value.map((e) => {
        if (e.id === eventId) {
          return event;
        }
        return e;
      });
    }
  });

  return (
    <Card class="flex h-[calc(100vh-12rem)] flex-col">
      <OjpCalendarHeader
        onNextWeek$={handleNextWeek}
        onPrevWeek$={handlePrevWeek}
        onToday$={handleToday}
        weekStart={currentWeekStart.value}
      />

      <div class="flex-1 overflow-auto">
        <OjpHorizontalCalendar
          dates={dates.value}
          events={eventsSignal.value}
          newEventTrigger={newEventTrigger}
          onEventClick$={handleEventClick}
          onEventDrop$={handleEventDrop}
          saly={staticData.saly}
          timeHourFrom={staticData.calendarHourFrom}
          times={staticData.times}
        />
      </div>

      <OjpEventModal
        bind:show={showNewEventModal}
        initialData={newEventData}
        mode="new"
        refreshTrigger={refreshTrigger}
      />

      <OjpEventModal
        bind:show={showEditEventModal}
        event={selectedEvent.value}
        mode="view"
        refreshTrigger={refreshTrigger}
      />
    </Card>
  );
});
