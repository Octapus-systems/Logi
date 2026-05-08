"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * AuthProvider wraps the application with NextAuth SessionProvider
 * This enables authentication context throughout the app
 */
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
