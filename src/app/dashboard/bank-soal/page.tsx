"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Loader2,
  BookOpen,
  AlertCircle,
  Calendar,
  Trash2,
  FileText,
  ChevronRight,
  Brain,
} from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Assessment {
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
}

export default function BankSoalPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch initial assessments
  useEffect(() => {
    const fetchInitialAssessments = async (uid: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/assessments?userId=${uid}&page=1&limit=6`,
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setAssessments(data.assessments);
          setHasMore(data.hasMore);
          setPage(1);
        } else {
          console.error("Gagal mengambil data bank soal:", data.error);
        }
      } catch (error) {
        console.error("Fetch bank soal error:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        fetchInitialAssessments(currentUser.uid);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch more assessments on scroll
  const fetchMoreAssessments = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await fetch(
        `/api/assessments?userId=${userId}&page=${nextPage}&limit=6`,
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setAssessments((prev) => [...prev, ...data.assessments]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      } else {
        console.error("Gagal memuat paket soal lanjutan:", data.error);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, hasMore, loadingMore]);

  // Sentinel ref for infinite scroll
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMoreAssessments();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchMoreAssessments],
  );

  // Delete entire assessment
  const handleDeleteAssessment = async (id: string) => {
    showConfirm(
      "Hapus Paket Soal",
      "Apakah Anda yakin ingin menghapus seluruh paket soal ini? Semua butir soal di dalamnya akan dihapus permanen.",
      async () => {
        try {
          const response = await fetch(`/api/assessments/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setAssessments((prev) => prev.filter((item) => item.id !== id));
            showAlert("Sukses", "Paket soal berhasil dihapus!");
          } else {
            const data = await response.json();
            showAlert("Gagal", data.error || "Gagal menghapus paket soal.");
          }
        } catch (error) {
          console.error("Delete error:", error);
          showAlert(
            "Error Koneksi",
            "Terjadi kesalahan koneksi saat menghapus paket soal.",
          );
        }
      },
    );
  };

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

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Memuat Bank Soal Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bank Soal</h2>
            <p className="text-sm text-muted-foreground">
              Daftar Paket Soal terstruktur yang telah Anda buat menggunakan
              asisten AI.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <span>Buat Soal Baru</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid of assessments */}
      {assessments.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 px-4 text-center space-y-4 bg-muted/10">
          <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Belum ada Paket Soal tersimpan
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Silakan buat paket soal/asesmen baru melalui menu Dashboard.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mt-2"
          >
            Mulai Generator AI
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessments.map((assessment) => {
            const dateStr = new Date(assessment.createdAt).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            );

            // Extract snippet of the text input as subtitle
            const cleanText =
              assessment.rawInputText?.replace(/[\r\n]+/g, " ").trim() || "";
            const textSnippet =
              cleanText.length > 70
                ? `${cleanText.substring(0, 70)}...`
                : cleanText || "Materi Pelajaran";

            return (
              <Card
                key={assessment.id}
                className="flex flex-col h-full hover:shadow-md transition-shadow"
              >
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
                <CardContent className="pb-3">
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tingkat Kesulitan:
                      </span>
                      <span className="font-semibold">
                        {getDifficultyLabel(assessment.difficulty)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Jumlah Butir Soal:
                      </span>
                      <span className="font-semibold">
                        {assessment._count?.questions ||
                          assessment.questionCount}{" "}
                        Soal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Metode Input:
                      </span>
                      <span className="font-semibold">
                        {assessment.inputType === "IMAGE"
                          ? "Gambar / OCR"
                          : "Salin & Tempel"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t flex justify-between gap-2 bg-muted/10 rounded-b-xl">
                  <Button
                    onClick={() => handleDeleteAssessment(assessment.id)}
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/assessment/${assessment.id}`)
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
          })}
        </div>
      )}

      {/* Sentinel indicator for scroll down pagination */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-8 flex items-center justify-center gap-2"
        >
          {loadingMore && (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">
                Memuat paket soal berikutnya...
              </p>
            </>
          )}
        </div>
      )}

      {/* End of content indicator */}
      {!hasMore && assessments.length > 0 && (
        <div className="text-center py-8 text-xs font-medium text-muted-foreground border-t">
          Semua paket soal Anda telah berhasil dimuat.
        </div>
      )}
    </div>
  );
}
