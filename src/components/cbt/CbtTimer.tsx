"use client";

import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";

interface CbtTimerProps {
  durationMinutes: number;
  token: string;
  startedAt: number; // timestamp when exam session started
  onTimeUp: () => void;
}

export default function CbtTimer({
  durationMinutes,
  token,
  startedAt,
  onTimeUp,
}: CbtTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    // Check if there is already a saved remaining time in localStorage
    if (typeof window !== "undefined") {
      const savedTime = localStorage.getItem(`cbt-timer-${token}`);
      if (savedTime) {
        const parsed = parseInt(savedTime, 10);
        if (parsed > 0) return parsed;
      }
    }
    // Otherwise calculate based on starting time and duration
    const totalDurationSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const calculatedLeft = totalDurationSeconds - elapsedSeconds;
    return calculatedLeft > 0 ? calculatedLeft : 0;
  });

  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        if (typeof window !== "undefined") {
          localStorage.setItem(`cbt-timer-${token}`, nextTime.toString());
        }
        if (nextTime <= 0) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token, timeLeft]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeLeft < 300; // less than 5 minutes

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base ${
        isLowTime
          ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
          : "border-border bg-muted/50 text-foreground"
      }`}
    >
      <Clock
        className={`h-4 w-4 ${isLowTime ? "text-destructive" : "text-muted-foreground"}`}
      />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
