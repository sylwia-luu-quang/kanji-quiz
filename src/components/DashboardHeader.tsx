/**
 * DashboardHeader - Persistent header showing user info and logout
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/client/auth.client";

interface DashboardHeaderProps {
  email: string;
}

export default function DashboardHeader({ email }: DashboardHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Redirect to signin page
      window.location.href = "/auth/signin";
    } catch (error) {
      // Even if logout fails, redirect to signin
      // The middleware will handle invalid sessions
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Logout error:", error);
      }
      window.location.href = "/auth/signin";
    }
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Kanji Quiz</h1>
            <span className="text-sm text-gray-500">{email}</span>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
