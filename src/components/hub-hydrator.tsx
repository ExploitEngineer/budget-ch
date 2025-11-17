"use client";

import { useEffect } from "react";
import { useHubStore } from "@/store/hub-store";

export function HubHydrator({ hubId }: { hubId: string | null }): null {
  const setActiveHubId = useHubStore((s) => s.setActiveHubId);

  useEffect((): void => {
    if (hubId) setActiveHubId(hubId);
  }, [hubId]);

  return null;
}
