"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { QuestionCard, Question } from "@/components/dashboard/QuestionCard";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";

export default function BankSoalPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Monitor auth status & fetch initial questions to prevent cascading state ESLint warning
  useEffect(() => {
    const fetchInitialQuestions = async (uid: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/bank-soal?userId=${uid}&page=1`);
        const data = await response.json();

        if (response.ok && data.success) {
          setQuestions(data.questions);
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
        fetchInitialQuestions(currentUser.uid);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch more questions on scroll
  const fetchMoreQuestions = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await fetch(
        `/api/bank-soal?userId=${userId}&page=${nextPage}`,
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setQuestions((prev) => [...prev, ...data.questions]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      } else {
        console.error("Gagal memuat soal lanjutan:", data.error);
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
          fetchMoreQuestions();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchMoreQuestions],
  );

  // Update question handler
  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await fetch("/api/bank-soal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedQuestion),
      });

      if (response.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
        );
      } else {
        const data = await response.json();
        alert(data.error || "Gagal memperbarui soal.");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Terjadi kesalahan koneksi saat memperbarui soal.");
    }
  };

  // Delete question handler
  const handleDeleteQuestion = async (id: string) => {
    if (
      !confirm("Apakah Anda yakin ingin menghapus soal ini dari Bank Soal?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/bank-soal?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Gagal menghapus soal.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan koneksi saat menghapus soal.");
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
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bank Soal</h2>
          <p className="text-sm text-muted-foreground">
            Daftar kumpulan soal yang telah Anda buat dan simpan.
          </p>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-5">
        {questions.length === 0 ? (
          <div className="border border-dashed rounded-xl py-16 px-4 text-center space-y-3 bg-muted/10">
            <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Belum ada soal tersimpan
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {
                'Silakan buat asesmen baru di Dashboard lalu klik "Simpan ke Bank Soal" pada halaman review.'
              }
            </p>
          </div>
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

      {/* Sentinel indicator for scroll down pagination */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-6 flex items-center justify-center gap-2"
        >
          {loadingMore && (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">
                Memuat soal berikutnya...
              </p>
            </>
          )}
        </div>
      )}

      {/* End of content indicator */}
      {!hasMore && questions.length > 0 && (
        <div className="text-center py-8 text-xs font-medium text-muted-foreground border-t">
          Semua soal Anda telah berhasil dimuat.
        </div>
      )}
    </div>
  );
}
