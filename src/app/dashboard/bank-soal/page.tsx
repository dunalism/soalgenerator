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
  Search,
  X,
  Filter,
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

interface MatchingQuestion {
  id: string;
  questionText: string;
}

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
  questions?: MatchingQuestion[];
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch assessments with parameters
  const fetchAssessments = useCallback(
    async (uid: string, pageNum: number, isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const queryParams = new URLSearchParams({
          userId: uid,
          page: pageNum.toString(),
          limit: "6",
        });

        if (debouncedSearch) queryParams.append("search", debouncedSearch);
        if (selectedDifficulty)
          queryParams.append("difficulty", selectedDifficulty);
        if (selectedType) queryParams.append("questionType", selectedType);

        const response = await fetch(
          `/api/assessments?${queryParams.toString()}`,
        );
        const data = await response.json();

        if (response.ok && data.success) {
          if (isLoadMore) {
            setAssessments((prev) => [...prev, ...data.assessments]);
          } else {
            setAssessments(data.assessments);
          }
          setHasMore(data.hasMore);
          setPage(pageNum);
        } else {
          console.error("Gagal mengambil data bank soal:", data.error);
        }
      } catch (error) {
        console.error("Fetch bank soal error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedDifficulty, selectedType],
  );

  // Monitor auth status & trigger initial fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        // Initial fetch with current filter state
        fetchAssessments(currentUser.uid, 1, false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAssessments]);

  // Fetch more assessments on scroll
  const fetchMoreAssessments = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;
    await fetchAssessments(userId, page + 1, true);
  }, [userId, page, hasMore, loadingMore, fetchAssessments]);

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

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("");
    setSelectedType("");
  };

  const isFiltered = searchQuery || selectedDifficulty || selectedType;

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Memverifikasi Autentikasi...
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

      {/* Search and Filters Bar */}
      <div className="bg-muted/30 p-4 rounded-xl border border-muted flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kata kunci materi atau butir soal (misal: 'oksigen')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Tipe Soal Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-background border px-3 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all cursor-pointer min-w-[140px]"
            >
              <option value="">Semua Tipe</option>
              <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
              <option value="TRUE_FALSE">Benar / Salah</option>
              <option value="SHORT_ANSWER">Isian Singkat</option>
              <option value="MIXED">Campuran</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Kesulitan Dropdown */}
          <div className="relative">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="appearance-none bg-background border px-3 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all cursor-pointer min-w-[140px]"
            >
              <option value="">Semua Kesulitan</option>
              <option value="EASY">Mudah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HARD">HOTS / Sulit</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Reset Filter Button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground h-9"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Grid of assessments */}
      {loading && assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">
            Menyaring Paket Soal Anda...
          </p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 px-4 text-center space-y-4 bg-muted/10">
          <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              {isFiltered
                ? "Tidak ada hasil pencarian"
                : "Belum ada Paket Soal tersimpan"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isFiltered
                ? "Cobalah untuk mengubah kriteria pencarian atau menyetel ulang filter."
                : "Silakan buat paket soal/asesmen baru melalui menu Dashboard."}
            </p>
          </div>
          {isFiltered ? (
            <Button onClick={resetFilters} variant="outline" className="mt-2">
              Setel Ulang Filter
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="mt-2"
            >
              Mulai Generator AI
            </Button>
          )}
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
                <CardContent className="pb-3 space-y-3">
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

                  {/* Matching questions snippet box (Hybrid Search View) */}
                  {assessment.questions && assessment.questions.length > 0 && (
                    <div className="bg-primary/[0.03] border border-primary/10 rounded-lg p-3 text-xs space-y-2 animate-fade-in">
                      <p className="font-semibold text-primary flex items-center gap-1">
                        <Search className="h-3.5 w-3.5" />
                        Soal yang mengandung "{debouncedSearch}":
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 text-muted-foreground italic">
                        {assessment.questions.map((q) => (
                          <li
                            key={q.id}
                            className="line-clamp-2 pl-1 text-[11px] leading-relaxed"
                          >
                            "{q.questionText}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
