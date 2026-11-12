import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for Client Components.
 *
 * With no `baseURL`, requests go to the current origin at /api/auth.
 */
export const authClient = createAuthClient();
