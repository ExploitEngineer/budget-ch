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
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function HubDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentHubId = searchParams.get("hub");

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

          // Find current hub from URL param, or default to first hub
          const current =
            res.data.find((h: Hub): boolean => h.id === currentHubId) ??
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
  }, [currentHubId]);

  // Update selected hub when URL param changes
  useEffect(() => {
    if (currentHubId && hubs.length > 0) {
      const hub = hubs.find((h) => h.id === currentHubId);
      if (hub) {
        setSelectedHub(hub);
      }
    }
  }, [currentHubId, hubs]);

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
            "dark:border-border-blue !bg-dark-blue-background w-full justify-between overflow-hidden",
          )}
        >
          <span className="truncate text-left flex-1">
            {selectedHub?.name || "Select Hub"}
          </span>
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

                  // Update cookie via server action
                  try {
                    // Update URL with hub param
                    const url = new URL(pathname, window.location.origin);
                    url.searchParams.set("hub", hub.id);
                    router.push(url.pathname + url.search);
                  } catch (err) {
                    console.error("Failed to switch hub", err);
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
