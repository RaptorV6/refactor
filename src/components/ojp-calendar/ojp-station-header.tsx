// src/components/ojp-calendar/ojp-station-header.tsx
import { component$ } from "@builder.io/qwik";

import type { OjpSalInfo } from "~/routes/(protected)/ojp/_mock-events";

type OjpStationHeaderProps = {
  sal: OjpSalInfo;
  vykonyCount: number;
};

export const OjpStationHeader = component$<OjpStationHeaderProps>(({ sal, vykonyCount }) => {
  return (
    <div
      class="sticky left-0 flex items-center justify-center border-r-2 border-gray-300 text-xs"
      style={`background-color: ${sal.bgColor}; color: ${sal.color};`}
    >
      <div class="text-center">
        <div class="font-semibold">{sal.displayName}</div>
        <div class="text-xs opacity-75">{vykonyCount} výkonů</div>
      </div>
    </div>
  );
});
