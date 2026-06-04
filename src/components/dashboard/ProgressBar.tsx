"use client";

import { cn } from "@/lib/utils";

type StepType = "INPUT" | "CONFIG" | "REVIEW";

interface ProgressBarProps {
  currentStep: StepType;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const isInputActive = currentStep === "INPUT";
  const isConfigActive = currentStep === "CONFIG";
  const isReviewActive = currentStep === "REVIEW";

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-card border border-border rounded-xl shadow-sm mb-6 w-full">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors duration-300",
            isInputActive
              ? "bg-primary text-primary-foreground"
              : "bg-green-500 text-white", // Completed state
          )}
        >
          {isInputActive ? "1" : "✓"}
        </span>
        <span
          className={cn(
            "text-sm font-semibold hidden sm:inline transition-colors duration-300",
            isInputActive
              ? "text-foreground"
              : "text-green-600 dark:text-green-400",
          )}
        >
          Input Materi
        </span>
      </div>

      {/* Connecting Line 1 */}
      <div
        className={cn(
          "h-[2px] flex-1 mx-4 transition-colors duration-300",
          isInputActive ? "bg-muted" : "bg-green-500",
        )}
      ></div>

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors duration-300",
            isConfigActive
              ? "bg-primary text-primary-foreground"
              : isReviewActive
                ? "bg-green-500 text-white" // Completed state
                : "bg-muted text-muted-foreground", // Upcoming state
          )}
        >
          {isReviewActive ? "✓" : "2"}
        </span>
        <span
          className={cn(
            "text-sm font-medium hidden sm:inline transition-colors duration-300",
            isConfigActive
              ? "text-foreground font-semibold"
              : isReviewActive
                ? "text-green-600 dark:text-green-400 font-semibold"
                : "text-muted-foreground",
          )}
        >
          Konfigurasi
        </span>
      </div>

      {/* Connecting Line 2 */}
      <div
        className={cn(
          "h-[2px] flex-1 mx-4 transition-colors duration-300",
          isReviewActive ? "bg-green-500" : "bg-muted",
        )}
      ></div>

      {/* Step 3 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors duration-300",
            isReviewActive
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-muted text-muted-foreground",
          )}
        >
          3
        </span>
        <span
          className={cn(
            "text-sm font-medium hidden sm:inline transition-colors duration-300",
            isReviewActive
              ? "text-foreground font-semibold"
              : "text-muted-foreground",
          )}
        >
          Hasil Soal
        </span>
      </div>
    </div>
  );
}
