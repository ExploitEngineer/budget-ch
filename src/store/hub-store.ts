import { create } from "zustand";

interface HubState {
  activeHubId: string | null;
  setActiveHubId: (hubId: string) => void;
}

export const useHubStore = create<HubState>((set) => ({
  activeHubId: null,
  setActiveHubId: async (hubId: string): Promise<void> => {
    set({ activeHubId: hubId });

    try {
      await fetch("/api/switch-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubId }),
      });
    } catch (err) {
      console.error("Failed to update active hub on server", err);
    }
  },
}));
