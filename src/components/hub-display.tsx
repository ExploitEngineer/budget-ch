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

export function HubDisplay() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const response = await getHubs();

      if (response.success && response.data && response.data.length > 0) {
        setHubs(response.data);
        setSelectedHub(response.data[0]);
      } else {
        toast.error(response.message || "No hubs found");
      }
    } catch (error) {
      console.error("Error fetching hubs:", error);
      toast.error("Failed to load hubs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full">
        Loading...
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
      <PopoverTrigger asChild className="w-full">
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
            {hubs.map((hub) => (
              <CommandItem
                key={hub.id}
                value={hub.name}
                onSelect={() => {
                  setSelectedHub(hub);
                  setOpen(false);
                }}
                className="cursor-pointer"
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
