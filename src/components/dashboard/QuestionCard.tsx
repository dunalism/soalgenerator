"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Edit,
  Save,
  Check,
  RotateCcw,
  Square,
  CheckSquare,
} from "lucide-react";

import { Option, Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: (id: string) => void;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  showCheckbox = false,
  checked = false,
  onCheckedChange,
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [questionText, setQuestionText] = useState(question.questionText);
  const [options, setOptions] = useState<Option[]>(question.options);
  const [answerKey, setAnswerKey] = useState(question.answerKey);

  // Check if there are real changes compared to original prop values
  const hasChanges =
    questionText !== question.questionText ||
    answerKey !== question.answerKey ||
    JSON.stringify(options) !== JSON.stringify(question.options);

  const handleSave = () => {
    // Only call parent update (triggers API hit & success alert) if there are actual changes
    if (hasChanges) {
      onUpdate({
        ...question,
        questionText,
        options,
        answerKey,
      });
    }
    setIsEditing(false);
  };

  const handleReset = () => {
    setQuestionText(question.questionText);
    setOptions(question.options);
    setAnswerKey(question.answerKey);
  };

  const handleOptionTextChange = (optId: string, newText: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optId ? { ...opt, optionText: newText } : opt,
    );
    setOptions(updatedOptions);
  };

  const handleOptionCorrectChange = (optId: string) => {
    const updatedOptions = options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optId,
    }));
    setOptions(updatedOptions);

    // Auto-update answerKey with the correct option text
    const correctOpt = updatedOptions.find((opt) => opt.isCorrect);
    if (correctOpt) {
      setAnswerKey(correctOpt.optionText);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2 select-none">
          {showCheckbox && (
            <button
              onClick={() => onCheckedChange?.(!checked)}
              className="text-primary hover:scale-105 active:scale-95 transition-transform mr-1"
              type="button"
            >
              {checked ? (
                <CheckSquare className="h-5 w-5 fill-primary/10" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
          <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {index + 1}
          </span>
          <span>
            Soal{" "}
            {question.type === "MULTIPLE_CHOICE"
              ? "Pilihan Ganda"
              : question.type === "TRUE_FALSE"
                ? "Benar/Salah"
                : question.type === "MATCHING"
                  ? "Menjodohkan (Matching)"
                  : "Uraian/Esai"}
          </span>
        </CardTitle>
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              {hasChanges && (
                <Button
                  onClick={handleReset}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  title="Reset Perubahan"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleSave}
                size="icon"
                variant="outline"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Simpan Soal"
              >
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="icon"
              variant="outline"
              className="h-8 w-8"
              title="Edit Soal"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(question.id)}
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            title="Hapus Soal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Text in Textarea (Hanya jika bukan Menjodohkan) */}
        {question.type !== "MATCHING" &&
          (isEditing ? (
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="font-medium text-base min-h-[80px] border-primary/40 focus-visible:ring-primary resize-y"
            />
          ) : (
            <p className="font-medium text-foreground text-base leading-relaxed">
              {question.questionText}
            </p>
          ))}

        {/* Layout khusus untuk Menjodohkan */}
        {question.type === "MATCHING" && (
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Left Premise */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">
                Premis / Istilah (Kolom Kiri)
              </label>
              {isEditing ? (
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="font-medium text-sm min-h-[60px] border-primary/40 focus-visible:ring-primary resize-y"
                  placeholder="Masukkan istilah / pertanyaan..."
                />
              ) : (
                <div className="bg-muted/40 border border-border/80 rounded-lg py-2.5 px-3 text-sm font-semibold text-foreground">
                  {questionText}
                </div>
              )}
            </div>

            {/* Right Matching Definition */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">
                Kunci Jawaban Pasangan (Kolom Kanan)
              </label>
              {isEditing ? (
                <Textarea
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  className="font-medium text-sm min-h-[60px] border-primary/40 focus-visible:ring-primary resize-y"
                  placeholder="Masukkan definisi / jawaban..."
                />
              ) : (
                <div className="bg-primary/[0.03] border border-primary/20 rounded-lg py-2.5 px-3 text-sm font-semibold text-primary">
                  {answerKey}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Options / Answers Area */}
        {question.type === "MULTIPLE_CHOICE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {options.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-center gap-2 border rounded-lg p-3 transition-colors ${
                  opt.isCorrect
                    ? "border-green-500/50 bg-green-500/5 dark:bg-green-500/10"
                    : "border-border hover:bg-muted/35"
                }`}
              >
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleOptionCorrectChange(opt.id)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    opt.isCorrect
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-muted-foreground/30 hover:border-primary"
                  }`}
                >
                  {opt.isCorrect && <Check className="h-3 w-3 stroke-[3px]" />}
                </button>
                {isEditing ? (
                  opt.optionText.length > 50 ? (
                    <Textarea
                      value={opt.optionText}
                      onChange={(e) =>
                        handleOptionTextChange(opt.id, e.target.value)
                      }
                      className="text-sm p-1.5 min-h-[60px] border-none bg-transparent focus-visible:ring-0 focus-visible:bg-background shadow-none resize-y"
                    />
                  ) : (
                    <Input
                      value={opt.optionText}
                      onChange={(e) =>
                        handleOptionTextChange(opt.id, e.target.value)
                      }
                      className="h-8 py-0 px-2 text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:bg-background shadow-none"
                    />
                  )
                ) : (
                  <span className="text-sm font-medium">{opt.optionText}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {question.type === "TRUE_FALSE" && (
          <div className="flex gap-4 pt-2">
            {["Benar", "Salah"].map((val) => {
              const isCorrect = answerKey.toLowerCase() === val.toLowerCase();
              return (
                <button
                  key={val}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => isEditing && setAnswerKey(val)}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    isCorrect
                      ? "border-green-500 bg-green-500/5 text-green-700 dark:text-green-400"
                      : "border-border bg-transparent hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                      isCorrect
                        ? "border-green-500 bg-green-500"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isCorrect && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span>{val}</span>
                </button>
              );
            })}
          </div>
        )}

        {question.type === "SHORT_ANSWER" && (
          <div className="pt-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Kunci Jawaban Esai
            </label>
            {isEditing ? (
              answerKey.length > 50 ? (
                <Textarea
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  className="text-sm p-2 min-h-[80px] border-primary/40 focus-visible:ring-primary resize-y animate-fade-in"
                />
              ) : (
                <Input
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  className="h-9 text-sm border-primary/40 focus-visible:ring-primary"
                />
              )
            ) : (
              <div className="bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm font-semibold">
                {question.answerKey}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
