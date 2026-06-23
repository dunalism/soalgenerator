"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog-provider";

interface CbtLayoutProps {
  children: React.ReactNode;
  title: string;
  studentName: string;
  studentId: string;
  onExit: () => void;
  timerComponent?: React.ReactNode;
}

export default function CbtLayout({
  children,
  title,
  studentName,
  studentId,
  onExit,
  timerComponent,
}: CbtLayoutProps) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? window.navigator.onLine : true,
  );
  const { showConfirm } = useDialog();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Prevent accidental tab closing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Apakah Anda yakin ingin keluar dari halaman ujian? Progres Anda telah disimpan secara lokal.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleExitClick = () => {
    showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar ke halaman utama? Tenang, lembar progres jawaban Anda tetap aman disimpan di browser ini.",
      onExit,
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground select-none">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-xs font-semibold animate-pulse flex items-center justify-center gap-2 z-50">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            Koneksi internet terputus! Lembar jawaban Anda aman disimpan di
            browser ini. Tetap kerjakan dengan tenang.
          </span>
        </div>
      )}

      {/* CBT Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold text-lg">
              CBT
            </div>
            <div>
              <h2 className="font-heading text-sm md:text-base font-bold leading-tight line-clamp-1">
                {title || "Ujian CBT"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span>
                  {studentName} ({studentId})
                </span>
                <span className="text-border">•</span>
                {isOnline ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-0.5 font-semibold">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-0.5 font-semibold">
                    <WifiOff className="h-3 w-3" /> Offline
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Wrapper */}
            {timerComponent}

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleExitClick}
            >
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
