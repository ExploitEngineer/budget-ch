/**
 * @deprecated Hub state is now managed via URL query parameter (?hub=id)
 * Use useHubNavigation hook instead for hub-related navigation
 * This store is kept for backward compatibility but should not be used in new code
 */
import { create } from "zustand";

interface HubState {
  activeHubId: string | null;
  setActiveHubId: (hubId: string) => void;
}

export const useHubStore = create<HubState>((set) => ({
  activeHubId: null,
  setActiveHubId: (hubId: string): void => {
    // No-op: Hub is now managed via URL query parameter
    // This is kept for backward compatibility only
    set({ activeHubId: hubId });
  },
}));
