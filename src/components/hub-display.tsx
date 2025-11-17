"use client";

import { useEffect, useState } from "react";
import { getHubs, type Hub } from "@/lib/services/hub";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";
import { useHubStore } from "@/store/hub-store";
import { useRouter } from "next/navigation";

export function HubDisplay() {
  const router = useRouter();

  const { activeHubId, setActiveHubId } = useHubStore();

  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);

  useEffect((): void => {
    const fetchHubs = async (): Promise<void> => {
      setLoading(true);

      try {
        const res = await getHubs();

        if (res.success && res.data?.length) {
          setHubs(res.data);

          const current =
            res.data.find((h: Hub): boolean => h.id === activeHubId) ??
            res.data[0];

          setSelectedHub(current);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hubs");
      } finally {
        setLoading(false);
      }
    };

    fetchHubs();
  }, []);

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Spinner />
      </Button>
    );
  }

  if (!selectedHub) {
    return (
      <Button variant="outline" disabled className="w-full">
        No Hub Available
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full cursor-pointer">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "dark:border-border-blue !bg-dark-blue-background w-full justify-between",
          )}
        >
          {selectedHub?.name || "Select Hub"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search hubs..." />
          <CommandEmpty>No hubs found.</CommandEmpty>

          <CommandGroup>
            {hubs.map((hub: Hub) => (
              <CommandItem
                key={hub.id}
                value={hub.name}
                onSelect={async (): Promise<void> => {
                  setSelectedHub(hub);
                  setOpen(false);

                  setActiveHubId(hub.id);

                  try {
                    await fetch("/api/switch-hub", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ hubId: hub.id }),
                    });

                    router.refresh();
                  } catch (err) {
                    console.error("Failed to switch hub on server", err);
                    toast.error("Failed to switch hub");
                  }
                }}
                className={cn(
                  "cursor-pointer",
                  hub.id === selectedHub?.id
                    ? "font-semibold text-blue-600"
                    : "",
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    hub.id === selectedHub.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {hub.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
