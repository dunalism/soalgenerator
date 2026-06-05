"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question, QuestionCard } from "./QuestionCard";
import {
  ArrowLeft,
  Save,
  FileText,
  Download,
  PlusCircle,
  Sparkles,
} from "lucide-react";

interface ReviewStepProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onBack: () => void;
  inputType: "TEXT" | "IMAGE";
  questionType: string;
  difficulty: string;
  onSaveToBankSoal: () => void;
  isSaving: boolean;
}

export function ReviewStep({
  questions,
  setQuestions,
  onBack,
  inputType,
  questionType,
  difficulty,
  onSaveToBankSoal,
  isSaving,
}: ReviewStepProps) {
  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAddQuestion = () => {
    const newId = `q-new-${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      questionText: "Ketik soal kustom baru Anda di sini...",
      type: "MULTIPLE_CHOICE",
      options: [
        { id: `${newId}-o1`, optionText: "Pilihan Jawaban A", isCorrect: true },
        {
          id: `${newId}-o2`,
          optionText: "Pilihan Jawaban B",
          isCorrect: false,
        },
        {
          id: `${newId}-o3`,
          optionText: "Pilihan Jawaban C",
          isCorrect: false,
        },
        {
          id: `${newId}-o4`,
          optionText: "Pilihan Jawaban D",
          isCorrect: false,
        },
      ],
      answerKey: "Pilihan Jawaban A",
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleExport = (format: "PDF" | "WORD" | "PRINT") => {
    alert(`Asesmen berhasil diekspor ke format: ${format}!`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Soal Berhasil Dihasilkan oleh AI!
            </h3>
            <p className="text-sm text-muted-foreground">
              Review, edit, tambah, atau hapus soal sebelum melakukan ekspor
              akhir.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-background border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Input: {inputType === "TEXT" ? "Teks" : "Gambar / OCR"}
              </span>
              <span className="bg-background border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Tipe: {questionType}
              </span>
              <span className="bg-background border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Kesulitan: {difficulty}
              </span>
              <span className="bg-background border px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary">
                Total: {questions.length} Soal
              </span>
            </div>
          </div>

          <Button
            onClick={handleAddQuestion}
            variant="outline"
            className="flex items-center gap-2 h-10 border-dashed border-primary/50 text-primary hover:bg-primary/5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Soal</span>
          </Button>
        </CardContent>
      </Card>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="border-dashed py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">
              Belum ada soal tersedia. Silakan tambah soal baru.
            </p>
          </Card>
        ) : (
          questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))
        )}
      </div>

      {/* Footer / Exports Card */}
      <Card>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 bg-muted/15">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Edit Konfigurasi</span>
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={onSaveToBankSoal}
              disabled={isSaving}
              variant="outline"
              className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 border-primary/45 text-primary hover:bg-primary/5"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan ke Bank Soal"}</span>
            </Button>
            <Button
              onClick={() => handleExport("WORD")}
              variant="outline"
              className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Unduh Word (.docx)</span>
            </Button>
            <Button
              onClick={() => handleExport("PDF")}
              className="w-full sm:w-auto h-11 px-6 font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Unduh PDF</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
