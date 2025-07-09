// src/components/ojp-calendar/ojp-time-slot.tsx (oprava chyb)
import type { QRL, Signal } from "@builder.io/qwik";

import { useToaster } from "@akeso/ui-components";
import { $, component$, useOn, useSignal } from "@builder.io/qwik";

import type { OjpEventPositioned, OjpSal, OjpSalInfo } from "~/routes/(protected)/ojp/_mock-events";

type OjpTimeSlotProps = {
  date: Date;
  events: OjpEventPositioned[];
  newEventTrigger: Signal<{ dateTime: Date; forceOtherSlots?: boolean; sal: OjpSal } | null>;
  onEventDrop$?: QRL<(eventId: string, newDate: Date, newSal: OjpSal, newTime: Date) => void>;
  sal: OjpSalInfo;
  slotIndex: number;
  timeHourFrom: number;
};

export const OjpTimeSlot = component$<OjpTimeSlotProps>(
  ({ date, events, newEventTrigger, onEventDrop$, sal, slotIndex, timeHourFrom }) => {
    const { toastError$ } = useToaster();
    const isDropPreview = useSignal(false);
    const isValid = useSignal(true);

    useOn(
      "dblclick",
      $(() => {
        const minutesFromStart = slotIndex * 5;
        const hours = timeHourFrom + Math.floor(minutesFromStart / 60);
        const minutes = minutesFromStart % 60;

        const newDateTime = new Date(date);
        newDateTime.setHours(hours, minutes, 0, 0);

        const existingOperations = events.filter(
          (event) =>
            event.dateFrom.toDateString() === date.toDateString() && event.sal === sal.name && event.typ === "operace",
        );

        const shouldForceOtherSlots = existingOperations.length > 0;

        newEventTrigger.value = {
          dateTime: newDateTime,
          forceOtherSlots: shouldForceOtherSlots,
          sal: sal.name,
        };
      }),
    );

    useOn(
      "dragover",
      $((e: DragEvent) => {
        e.preventDefault();
        isDropPreview.value = true;
      }),
    );

    useOn(
      "dragleave",
      $((e: DragEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          isDropPreview.value = false;
        }
      }),
    );

    useOn(
      "drop",
      $((e: DragEvent) => {
        e.preventDefault();
        isDropPreview.value = false;

        const data = e.dataTransfer!.getData("application/json");
        if (data && onEventDrop$) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "ojp-event") {
              const draggedEvent = events.find((evt) => evt.id === parsed.eventId);
              if (draggedEvent) {
                const targetMinutes = slotIndex * 5;
                const targetHours = timeHourFrom + Math.floor(targetMinutes / 60);
                const targetMins = targetMinutes % 60;
                const newStartTime = new Date(date);
                newStartTime.setHours(targetHours, targetMins, 0, 0);

                onEventDrop$(parsed.eventId, date, sal.name, newStartTime);
              }
            }
          } catch {
            toastError$("Chyba při přesouvání události", { duration: 3000 });
          }
        }
      }),
    );

    return (
      <div
        class={`
          relative cursor-pointer border-r border-gray-200 transition-all duration-200
          hover:bg-blue-100 hover:bg-opacity-50
          ${isDropPreview.value ? (isValid.value ? "border-green-300 bg-green-100" : "border-red-300 bg-red-100") : ""}
        `}
        title="Poklepejte pro přidání události nebo přetáhněte událost"
      >
        {isDropPreview.value && (
          <div class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <div
              class={`rounded border px-2 py-1 text-xs font-bold shadow-lg ${
                isValid.value ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {isValid.value ? "✓ Přesunout zde" : "✗ Operace musí mít mezeru"}
            </div>
          </div>
        )}
      </div>
    );
  },
);
