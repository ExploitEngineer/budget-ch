# Hub Switching Implementation

## Overview

Hub switching is now implemented using **URL query parameters** as the source of truth. This approach provides a single source of truth, makes hub state bookmarkable and shareable, and eliminates synchronization issues between multiple state management systems.

## Architecture

### Flow Diagram

```
User selects hub → URL updated (?hub=id) → Middleware syncs to cookie → Server reads cookie → Data filtered by hub
```

### Key Components

1. **URL Query Parameter** (`?hub=hubId`)
   - Primary source of truth for client-side hub selection
   - Preserved across navigation
   - Bookmarkable and shareable

2. **Middleware** (`src/middleware.ts`)
   - Syncs URL query parameter to httpOnly cookie
   - Enables server-side access to active hub ID
   - Validates hub ID format

3. **getContext()** (`src/lib/auth/actions.ts`)
   - Reads hub ID from cookie (synced from URL)
   - Validates hub exists and user has access
   - Falls back to user's default hub if no param provided
   - Returns hub context for all server actions

4. **useHubNavigation Hook** (`src/hooks/use-hub-navigation.ts`)
   - Client-side hook for hub navigation
   - Provides `switchHub()`, `navigateWithHub()`, `getUrlWithHub()`
   - Automatically preserves hub parameter in navigation

## Implementation Details

### Middleware

The middleware intercepts requests to `/me/*` routes and:
- Extracts `hub` query parameter from URL
- Validates hub ID format
- Sets httpOnly cookie for server-side access

```typescript
// src/middleware.ts
const hubId = request.nextUrl.searchParams.get("hub");
if (hubId) {
  response.cookies.set("activeHubId", hubId, { ... });
}
```

### Server-Side Hub Resolution

`getContext()` follows this priority:
1. Read hub ID from cookie (synced from URL)
2. Validate hub exists and user has access
3. Fallback to user's default hub (owned hub or first member hub)

```typescript
// src/lib/auth/actions.ts
let activeHubId = cookieHeader?.split("; ")
  .find((c) => c.startsWith("activeHubId="))
  ?.split("=")[1] ?? null;

// Validate and fallback logic...
if (!activeHubId) {
  activeHubId = await getDefaultHubId(userId);
}
```

### Client-Side Navigation

Use the `useHubNavigation` hook to:
- Switch hubs: `switchHub(hubId)` - updates URL with new hub param
- Navigate preserving hub: `navigateWithHub(path)` - preserves current hub
- Get URLs with hub: `getUrlWithHub(path)` - returns URL with hub param

```typescript
// Example usage
const { switchHub, navigateWithHub, getUrlWithHub } = useHubNavigation();

// Switch to a different hub
switchHub("hub-123");

// Navigate to a page preserving hub
navigateWithHub("/me/dashboard");

// Get URL with hub for Link components
<Link href={getUrlWithHub("/me/transactions")}>Transactions</Link>
```

## Hub Display Component

The `HubDisplay` component:
- Reads current hub from URL query parameter
- Updates when URL changes
- Switches hub by updating URL (which triggers middleware sync)

```typescript
// src/components/hub-display.tsx
const currentHubId = searchParams.get("hub");
const { switchHub } = useHubNavigation();

// On hub selection
onSelect={() => {
  switchHub(hub.id); // Updates URL, middleware syncs to cookie
}}
```

## Navigation Links

All navigation links preserve the hub parameter:

```typescript
// src/components/nav-main.tsx
const { getUrlWithHub } = useHubNavigation();

<Link href={getUrlWithHub(item.url)}>
  {item.title}
</Link>
```

## Default Hub Behavior

When no hub parameter is provided:
1. `getContext()` falls back to user's default hub
2. Server-side data is filtered by default hub
3. URL remains without hub param (user can switch via HubDisplay)

**Note:** For better UX, consider adding a client-side redirect to include default hub in URL on first load.

## Benefits

1. **Single Source of Truth**: URL parameter is the authoritative source
2. **No Sync Issues**: Eliminates race conditions between cookie, store, and local state
3. **Bookmarkable**: Users can bookmark specific hub views
4. **Shareable**: Hub-specific URLs can be shared
5. **Browser Navigation**: Back/forward buttons work correctly
6. **Simpler State Management**: No need for complex Zustand store synchronization

## Migration Notes

### Deprecated Components

- `src/lib/services/hub-switch.ts` - Server action no longer needed
- `src/store/hub-store.ts` - Marked as deprecated, kept for backward compatibility
- `src/components/hub-hydrator.tsx` - Removed (no longer needed)

### Breaking Changes

- Hub switching now requires URL navigation (use `useHubNavigation` hook)
- Direct cookie manipulation no longer works for hub switching
- Server actions should use `getContext()` to get hub ID

## Testing Checklist

- [ ] Hub switching updates URL correctly
- [ ] Navigation preserves hub parameter
- [ ] Server-side data filters by correct hub
- [ ] Default hub works when no param provided
- [ ] Hub access validation works
- [ ] Accept invitation redirects with hub param
- [ ] Browser back/forward works correctly
- [ ] Bookmarked URLs work correctly

