"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth/auth-client";

interface SessionReadyContextType {
    isSessionReady: boolean;
    isLoading: boolean;
}

const SessionReadyContext = createContext<SessionReadyContextType>({
    isSessionReady: false,
    isLoading: true,
});

/**
 * Hook to check if the session is ready for API calls.
 * Use this in client components to defer API calls until the session is established.
 */
export function useSessionReady() {
    return useContext(SessionReadyContext);
}

interface SessionReadyProviderProps {
    children: ReactNode;
}

/**
 * Provider that tracks whether the session is ready.
 * Wrap your authenticated pages with this to prevent 403 errors on initial load.
 */
export function SessionReadyProvider({ children }: SessionReadyProviderProps) {
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                // Use the authClient to get the current session
                const session = await authClient.getSession();

                if (isMounted) {
                    // Session is ready if we have a valid user
                    setIsSessionReady(!!session?.data?.user);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error checking session:", err);
                if (isMounted) {
                    setIsSessionReady(false);
                    setIsLoading(false);
                }
            }
        };

        // Small delay to ensure cookies are synced after page navigation
        const timeoutId = setTimeout(checkSession, 50);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <SessionReadyContext.Provider value={{ isSessionReady, isLoading }}>
            {children}
        </SessionReadyContext.Provider>
    );
}
