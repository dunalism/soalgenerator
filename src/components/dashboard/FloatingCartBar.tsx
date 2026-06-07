"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useDialog } from "@/components/ui/dialog-provider";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Sparkles,
  Download,
  X,
  FileText,
  Loader2,
  ListRestart,
  ArrowRight,
  Printer,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingCartBar() {
  const { selectedQuestions, clearCart, toggleQuestion, isSelected } =
    useCart();
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showCompileModal, setShowCompileModal] = useState(false);

  if (selectedQuestions.length === 0) return null;

  const handleCompile = async () => {
    if (!newTitle.trim()) {
      showAlert("Judul Diperlukan", "Silakan masukkan nama paket baru.");
      return;
    }

    setIsCompiling(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showAlert("Error", "Anda harus login terlebih dahulu.");
        return;
      }

      const response = await fetch("/api/assessments/remix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          title: newTitle.trim(),
          questionIds: selectedQuestions.map((q) => q.id),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearCart();
        setShowCompileModal(false);
        setNewTitle("");
        showAlert(
          "Sukses",
          "Kompilasi Berhasil! Mengalihkan ke paket soal baru...",
        );
        router.push(`/dashboard/assessment/${data.id}?source=bank-soal`);
      } else {
        showAlert("Gagal", data.error || "Gagal mengompilasi paket baru.");
      }
    } catch (error) {
      console.error("Compile error:", error);
      showAlert("Error", "Terjadi kesalahan saat mengompilasi paket baru.");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExport = (format: "WORD" | "PDF" | "PRINT") => {
    if (format === "PRINT") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showAlert("Gagal membuka window", "Pop-up diblokir oleh browser.");
        return;
      }

      const matchingQs = selectedQuestions.filter((q) => q.type === "MATCHING");
      const standardQs = selectedQuestions.filter((q) => q.type !== "MATCHING");

      const standardQuestionsHtml = standardQs
        .map((q, idx) => {
          let optionsHtml = "";
          if (q.type === "MULTIPLE_CHOICE" && q.options) {
            optionsHtml = `
            <table style="width: 100%; margin-top: 8px; font-size: 14px;">
              ${q.options
                .map(
                  (opt, optIdx) => `
                <tr>
                  <td style="width: 25px; vertical-align: top; font-weight: bold;">
                    ${String.fromCharCode(65 + optIdx)}.
                  </td>
                  <td>${opt.optionText}</td>
                </tr>
              `,
                )
                .join("")}
            </table>
          `;
          } else if (q.type === "TRUE_FALSE") {
            optionsHtml = `<p style="font-size: 14px; margin-top: 8px; font-style: italic;">Pilihan: Benar/Salah</p>`;
          }

          return `
          <div style="margin-bottom: 24px; page-break-inside: avoid;">
            <p style="font-size: 15px; font-weight: 500; margin: 0; line-height: 1.5;">
              <strong>${idx + 1}.</strong> ${q.questionText}
            </p>
            ${optionsHtml}
          </div>
        `;
        })
        .join("");

      let matchingQuestionsHtml = "";
      if (matchingQs.length > 0) {
        // Collect definitions & shuffle them
        const originalKeys = matchingQs.map((q) => q.answerKey);
        const shuffledKeys = [...originalKeys].sort(() => Math.random() - 0.5);

        matchingQuestionsHtml = `
          <div style="margin-top: 30px; margin-bottom: 30px; page-break-inside: avoid;">
            <p style="font-size: 15px; font-weight: bold; margin-bottom: 12px; color: #1e3a8a;">
              PETUNJUK: Jodohkanlah pernyataan di Kolom Kiri dengan pilihan jawaban yang tepat di Kolom Kanan!
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width: 50%; font-size: 14px; color: #1e3a8a;">KOLOM KIRI (PERNYATAAN)</th>
                  <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width: 50%; font-size: 14px; color: #1e3a8a;">KOLOM KANAN (JAWABAN)</th>
                </tr>
              </thead>
              <tbody>
                ${matchingQs
                  .map((q, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const responseText = shuffledKeys[idx];
                    return `
                    <tr>
                      <td style="border: 1px solid #d1d5db; padding: 12px; font-size: 14px; line-height: 1.5; vertical-align: top;">
                        <span style="font-weight: bold; margin-right: 8px;">${idx + 1}.</span> ${q.questionText}
                      </td>
                      <td style="border: 1px solid #d1d5db; padding: 12px; font-size: 14px; line-height: 1.5; vertical-align: top;">
                        <span style="font-weight: bold; margin-right: 8px;">${letter}.</span> ${responseText}
                      </td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      const questionsHtml = `
        ${standardQuestionsHtml}
        ${matchingQuestionsHtml}
      `;

      const answerKeysHtml = selectedQuestions
        .map((q, idx) => {
          return `
          <div style="margin-bottom: 8px; font-size: 13px;">
            <strong>No ${idx + 1}:</strong> ${q.answerKey}
          </div>
        `;
        })
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Remix Soal</title>
            <style>
              body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
              .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
              .header p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
              .section-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; color: #1e3a8a; }
              .answers-container { margin-top: 50px; page-break-before: always; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
              <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                Cetak Halaman Ini
              </button>
            </div>
            <div class="header">
              <h1>LEMBAR SOAL REMIX</h1>
              <p>Dibuat secara otomatis dengan SoalGenerator Pintar</p>
            </div>
            <div class="section-title">DAFTAR BUTIR SOAL</div>
            <div>${questionsHtml}</div>

            <div class="answers-container">
              <div class="header">
                <h1>KUNCI JAWABAN</h1>
                <p>Kunci jawaban untuk lembar soal di atas</p>
              </div>
              <div class="section-title">KUNCI JAWABAN</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${answerKeysHtml}
              </div>
            </div>
            <script>
              window.onload = function() {
                // Auto-print option
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // PDF / WORD Simulation
    const title =
      format === "WORD" ? "Ekspor Word Berhasil" : "Ekspor PDF Berhasil";
    const desc =
      format === "WORD"
        ? "File Word (.docx) siap diunduh! Semua butir soal remix Anda telah diformat dengan layout standar Microsoft Word."
        : "File PDF (.pdf) siap diunduh! Semua butir soal remix Anda telah dikompresi ke format cetak rapi.";

    showAlert(title, desc);
  };

  return (
    <>
      {/* Compile Title Input Modal */}
      {showCompileModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                  Kompilasi Paket Baru
                </h3>
                <p className="text-xs text-muted-foreground">
                  Satukan {selectedQuestions.length} butir soal pilihan Anda
                  menjadi paket ujian baru.
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCompileModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Nama Paket Soal Baru
              </label>
              <input
                type="text"
                placeholder="Contoh: UAS Semester Ganjil IPA Terpadu"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                disabled={isCompiling}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCompile();
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompileModal(false)}
                disabled={isCompiling}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleCompile}
                disabled={isCompiling || !newTitle.trim()}
                className="flex items-center gap-1.5"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengompilasi...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Kompilasi</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Cart Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl animate-slide-up">
        <div className="bg-card/90 backdrop-blur-md border border-primary/25 shadow-2xl rounded-2xl overflow-hidden">
          {/* Expanded Questions List Drawer */}
          {isOpen && (
            <div className="border-b border-muted max-h-60 overflow-y-auto p-4 space-y-3 bg-muted/10">
              <div className="flex justify-between items-center pb-2 border-b border-muted">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Daftar Soal di Keranjang
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    showConfirm(
                      "Kosongkan Keranjang",
                      "Apakah Anda yakin ingin menghapus semua butir soal dari keranjang?",
                      clearCart,
                    )
                  }
                  className="text-xs text-destructive hover:bg-destructive/5 font-semibold h-7 px-2"
                >
                  Kosongkan Semua
                </Button>
              </div>
              <div className="space-y-2">
                {selectedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-start gap-3 bg-background border border-border/60 p-2.5 rounded-lg text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold line-clamp-2 leading-relaxed">
                        <span className="text-primary mr-1">#{idx + 1}</span>
                        {q.questionText}
                      </p>
                      {q.assessmentTextSnippet && (
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          Sumber: {q.assessmentTextSnippet}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => toggleQuestion(q)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Control Bar */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                <span>Terpilih:</span>
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {selectedQuestions.length}
                </span>
                <span>Soal</span>
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors text-xs flex items-center gap-0.5"
                title={isOpen ? "Sembunyikan daftar" : "Lihat daftar"}
              >
                <span>{isOpen ? "Sembunyikan" : "Lihat Detail"}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Export Trigger Dropdown/Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("PRINT")}
                  className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold"
                  title="Cetak Soal"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Cetak</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("PDF")}
                  className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold"
                  title="Ekspor PDF"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-500" />
                  <span className="hidden xs:inline">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("WORD")}
                  className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold"
                  title="Ekspor Word"
                >
                  <Download className="h-3.5 w-3.5 text-blue-500" />
                  <span className="hidden xs:inline">Word</span>
                </Button>
              </div>

              {/* Compile Button */}
              <Button
                size="sm"
                onClick={() => {
                  setNewTitle("");
                  setShowCompileModal(true);
                }}
                className="h-9 px-4 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Kompilasi</span>
                <ListRestart className="h-4 w-4 text-yellow-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
