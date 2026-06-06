"use client";

import { useRouter } from "next/navigation";
import { Calendar, Trash2, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface MatchingQuestion {
  id: string;
  questionText: string;
}

export interface Assessment {
  id: string;
  inputType: "TEXT" | "IMAGE";
  rawInputText: string | null;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MIXED";
  questionCount: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  createdAt: string;
  _count?: {
    questions: number;
  };
  questions?: MatchingQuestion[];
}

interface AssessmentCardProps {
  assessment: Assessment;
  debouncedSearch: string;
  onDelete: (id: string) => Promise<void> | void;
}

export function AssessmentCard({
  assessment,
  debouncedSearch,
  onDelete,
}: AssessmentCardProps) {
  const router = useRouter();

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "Mudah";
      case "MEDIUM":
        return "Sedang";
      case "HARD":
        return "HOTS / Sulit";
      default:
        return difficulty;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Pilihan Ganda";
      case "TRUE_FALSE":
        return "Benar / Salah";
      case "SHORT_ANSWER":
        return "Isian Singkat";
      case "MIXED":
        return "Campuran";
      default:
        return type;
    }
  };

  const dateStr = new Date(assessment.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const cleanText =
    assessment.rawInputText?.replace(/[\r\n]+/g, " ").trim() || "";
  const textSnippet =
    cleanText.length > 70
      ? `${cleanText.substring(0, 70)}...`
      : cleanText || "Materi Pelajaran";

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            {getTypeLabel(assessment.questionType)}
          </span>
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateStr}
          </span>
        </div>
        <CardTitle className="text-base line-clamp-2 leading-snug">
          {textSnippet}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tingkat Kesulitan:</span>
            <span className="font-semibold">
              {getDifficultyLabel(assessment.difficulty)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah Butir Soal:</span>
            <span className="font-semibold">
              {assessment._count?.questions || assessment.questionCount} Soal
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Metode Input:</span>
            <span className="font-semibold">
              {assessment.inputType === "IMAGE"
                ? "Gambar / OCR"
                : "Salin & Tempel"}
            </span>
          </div>
        </div>

        {/* Matching questions snippet box (Hybrid Search View) */}
        {assessment.questions && assessment.questions.length > 0 && (
          <div className="bg-primary/[0.03] border border-primary/10 rounded-lg p-3 text-xs space-y-2 animate-fade-in">
            <p className="font-semibold text-primary flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              Soal yang mengandung &quot;{debouncedSearch}&quot;:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground italic">
              {assessment.questions.map((q) => (
                <li
                  key={q.id}
                  className="line-clamp-2 pl-1 text-[11px] leading-relaxed"
                >
                  &quot;{q.questionText}&quot;
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t flex justify-between gap-2 bg-muted/10 rounded-b-xl">
        <Button
          onClick={() => onDelete(assessment.id)}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={() =>
            router.push(
              `/dashboard/assessment/${assessment.id}?source=bank-soal`,
            )
          }
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <span>Buka Paket</span>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
