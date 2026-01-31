/**
 * DashboardHeader - Persistent header showing user info and logout
 */

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  email: string;
  onLogout: () => void;
}

export default function DashboardHeader({ email, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Kanji Quiz</h1>
            <span className="text-sm text-gray-500">{email}</span>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
