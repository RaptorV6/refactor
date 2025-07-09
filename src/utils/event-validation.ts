import type { OjpEvent, OjpSal } from "~/routes/(protected)/ojp/_mock-events";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateEventDrop(
  draggedEvent: OjpEvent,
  targetDate: Date,
  targetSal: OjpSal,
  targetTime: Date,
  allEvents: OjpEvent[],
): ValidationResult {
  const newEndTime = new Date(targetTime.getTime() + draggedEvent.duration * 60 * 1000);

  const rowEvents = allEvents.filter(
    (event) =>
      event.dateFrom.toDateString() === targetDate.toDateString() &&
      event.sal === targetSal &&
      event.id !== draggedEvent.id,
  );

  const overlapping = rowEvents.find((event) => {
    return targetTime < event.dateTo && newEndTime > event.dateFrom;
  });

  if (overlapping) {
    return {
      isValid: false,
      reason: "Událost se překrývá s jinou",
    };
  }

  if (draggedEvent.typ === "operace") {
    const operationsInRow = rowEvents.filter((e) => e.typ === "operace");

    if (operationsInRow.length > 0) {
      const allOperations = [
        ...operationsInRow,
        {
          dateFrom: targetTime,
          dateTo: newEndTime,
          id: "new",
          typ: "operace",
        },
      ].sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());

      for (let i = 0; i < allOperations.length - 1; i++) {
        const currentOp = allOperations[i];
        const nextOp = allOperations[i + 1];

        const cleaningBetween = rowEvents.find(
          (event) =>
            (event.typ === "uklid" || event.typ === "pauza") &&
            event.dateFrom >= currentOp.dateTo &&
            event.dateTo <= nextOp.dateFrom,
        );

        if (!cleaningBetween) {
          return {
            isValid: false,
            reason: "Mezi operacemi musí být úklid nebo pauza",
          };
        }
      }
    }
  }

  return { isValid: true };
}

export function validateOperationSequence(
  events: OjpEvent[],
  date: Date,
  sal: OjpSal,
  excludeEventId?: string,
): ValidationResult {
  const dayEvents = events.filter(
    (event) =>
      event.dateFrom.toDateString() === date.toDateString() &&
      event.sal === sal &&
      (!excludeEventId || event.id !== excludeEventId),
  );

  const operations = dayEvents
    .filter((e) => e.typ === "operace")
    .sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());

  for (let i = 0; i < operations.length - 1; i++) {
    const currentOp = operations[i];
    const nextOp = operations[i + 1];

    const cleaningBetween = dayEvents.find(
      (event) =>
        (event.typ === "uklid" || event.typ === "pauza") &&
        event.dateFrom >= currentOp.dateTo &&
        event.dateTo <= nextOp.dateFrom,
    );

    if (!cleaningBetween) {
      return {
        isValid: false,
        reason: "Mezi operacemi musí být úklid nebo pauza",
      };
    }
  }

  return { isValid: true };
}
