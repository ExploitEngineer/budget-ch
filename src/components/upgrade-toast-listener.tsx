"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function UpgradeToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (searchParams.get("upgrade") === "true") {
            toast.error("You are on free plan. Cannot access this feature.");

            // Remove the param from URL without refreshing
            const params = new URLSearchParams(searchParams.toString());
            params.delete("upgrade");
            const newQuery = params.toString() ? `?${params.toString()}` : "";
            router.replace(`${pathname}${newQuery}`);
        }
    }, [searchParams, router, pathname]);

    return null;
}
