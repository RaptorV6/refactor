import type { OjpEventPositioned } from "~/routes/(protected)/ojp/_mock-events";

export interface CalendarConfig {
  intervalMinutes: number;
  rowHeight: number;
  salsWidth: number;
  slotWidth: number;
  timeHourFrom: number;
  totalSlots: number;
}

export interface EventPosition {
  heightPx: number;
  leftPx: number;
  topPx: number;
  widthPx: number;
}

export function calculateEventPosition(event: OjpEventPositioned, config: CalendarConfig): EventPosition {
  const startTotalMinutes = (event.dateFrom.getHours() - config.timeHourFrom) * 60 + event.dateFrom.getMinutes();
  const duration = event.duration || 30;

  const startInterval = startTotalMinutes / config.intervalMinutes;
  const endInterval = (startTotalMinutes + duration) / config.intervalMinutes;

  const leftPx = config.salsWidth + startInterval * config.slotWidth;
  const widthPx = (endInterval - startInterval) * config.slotWidth;

  const left = (event.columnIndex / event.columnCount) * 96;
  const width = (1 / event.columnCount) * 96;

  return {
    heightPx: config.rowHeight - 8,
    leftPx: leftPx + (left * widthPx) / 100,
    topPx: 4,
    widthPx: widthPx * (width / 100),
  };
}

export function calculateTimeSlotPosition(
  slotIndex: number,
  config: CalendarConfig,
): { hours: number; minutes: number; timeString: string } {
  const totalMinutes = slotIndex * config.intervalMinutes;
  const hours = config.timeHourFrom + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours,
    minutes,
    timeString: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

export function isSlotVisible(
  slotIndex: number,
  scrollLeft: number,
  viewportWidth: number,
  config: CalendarConfig,
): boolean {
  const slotLeft = config.salsWidth + slotIndex * config.slotWidth;
  const slotRight = slotLeft + config.slotWidth;

  const viewportLeft = scrollLeft + config.salsWidth;
  const viewportRight = scrollLeft + viewportWidth;

  return slotRight > viewportLeft && slotLeft < viewportRight;
}
