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
import { useDialog } from "@/components/ui/dialog-provider";
import { useCart, CartItem } from "@/lib/cart-context";

interface ReviewStepProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  title?: string | null;
  onBack: () => void;
  inputType: "TEXT" | "IMAGE";
  questionType: string;
  difficulty: string;
  onSaveToBankSoal: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

export function ReviewStep({
  questions,
  setQuestions,
  title,
  onBack,
  inputType,
  questionType,
  difficulty,
  onSaveToBankSoal,
  isSaving,
  hasChanges,
}: ReviewStepProps) {
  const { showAlert } = useDialog();
  const { isSelected, toggleQuestion } = useCart();

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleExport = (format: "PDF" | "WORD" | "PRINT") => {
    showAlert(
      "Ekspor Berhasil",
      `Asesmen berhasil diekspor ke format: ${format}!`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {title || "Paket Materi"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Review, edit, atau hapus soal sebelum melakukan ekspor akhir.
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
          questions.map((q, idx) => {
            const cartItem: CartItem = {
              id: q.id,
              questionText: q.questionText,
              type: q.type,
              options: q.options.map((opt) => ({
                id: opt.id,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
              answerKey: q.answerKey,
              assessmentId: "", // Will be filled dynamically if needed, or left empty
              assessmentTextSnippet: `Paket ${questionType} - ${difficulty}`,
            };

            return (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                showCheckbox={true}
                checked={isSelected(q.id)}
                onCheckedChange={() => toggleQuestion(cartItem)}
              />
            );
          })
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
            <span>Kembali</span>
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Dinamis Save Button */}
            <Button
              onClick={onSaveToBankSoal}
              disabled={!hasChanges || isSaving}
              variant={hasChanges ? "default" : "outline"}
              className={`w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 transition-all ${
                hasChanges
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 animate-pulse font-bold"
                  : "border-muted-foreground/20 text-muted-foreground/60 bg-muted/20 cursor-default"
              }`}
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving
                  ? "Menyimpan..."
                  : hasChanges
                    ? "Simpan Perubahan"
                    : "Soal Tersimpan"}
              </span>
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
