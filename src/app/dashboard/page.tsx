"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  ArrowRight,
  Clipboard,
} from "lucide-react";

export default function InputMateriPage() {
  const [inputType, setInputType] = useState<"TEXT" | "IMAGE">("TEXT");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Generate image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinue = () => {
    if (inputType === "TEXT" && !rawText.trim()) {
      alert("Silakan masukkan teks materi pelajaran terlebih dahulu.");
      return;
    }
    if (inputType === "IMAGE" && !selectedFile) {
      alert("Silakan unggah gambar materi pelajaran terlebih dahulu.");
      return;
    }

    // Success transition simulation or data compilation for Phase 2
    alert(
      inputType === "TEXT"
        ? `Materi berhasil disiapkan!\nTipe Input: Teks\nJumlah karakter: ${rawText.length}`
        : `Gambar berhasil disiapkan!\nTipe Input: Gambar\nNama File: ${selectedFile?.name}`,
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* progress bar */}
      <div className="flex items-center justify-between px-2 sm:px-6 py-4 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs">
            1
          </span>
          <span className="text-sm font-semibold hidden sm:inline">
            Input Materi
          </span>
        </div>
        <div className="h-[2px] bg-muted flex-1 mx-4"></div>
        <div className="flex items-center gap-2 opacity-50">
          <span className="bg-muted text-muted-foreground font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs">
            2
          </span>
          <span className="text-sm font-medium hidden sm:inline">
            Konfigurasi
          </span>
        </div>
        <div className="h-[2px] bg-muted flex-1 mx-4"></div>
        <div className="flex items-center gap-2 opacity-50">
          <span className="bg-muted text-muted-foreground font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs">
            3
          </span>
          <span className="text-sm font-medium hidden sm:inline">
            Hasil Soal
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1.5 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Tahap 1: Input Materi Pelajaran
          </CardTitle>
          <CardDescription>
            Pilih metode input materi yang ingin Anda gunakan sebagai bahan
            dasar pembuatan soal asesmen.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Metode Input Tabs */}
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-1.5 rounded-lg border border-border">
            <Button
              onClick={() => setInputType("TEXT")}
              variant={inputType === "TEXT" ? "default" : "ghost"}
              className="flex items-center gap-2 h-10 font-semibold"
            >
              <FileText className="h-4 w-4" />
              <span>Salin & Tempel Teks</span>
            </Button>
            <Button
              onClick={() => setInputType("IMAGE")}
              variant={inputType === "IMAGE" ? "default" : "ghost"}
              className="flex items-center gap-2 h-10 font-semibold"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Unggah Gambar / OCR</span>
            </Button>
          </div>

          {/* Form area */}
          {inputType === "TEXT" ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Clipboard className="h-4 w-4 text-primary" />
                Tempelkan Teks Materi Pelajaran
              </label>
              <Textarea
                placeholder="Tempelkan bab materi, rangkuman, artikel, atau modul ajar panjang Anda di sini..."
                className="min-h-[250px] resize-y p-4   "
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">
                Jumlah karakter: {rawText.length}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ImageIcon className="h-4 w-4 text-primary" />
                Unggah Tangkapan Layar (Screenshot) / Foto Materi
              </label>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/25 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                >
                  <div className="bg-background shadow p-3 rounded-full text-muted-foreground group-hover:text-primary group-hover:scale-105 transition-transform duration-300">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      Pilih berkas gambar atau seret ke sini
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, JPEG hingga 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 bg-muted/20">
                  {imagePreview && (
                    <div className="relative w-full md:w-32 h-24 rounded-lg overflow-hidden border border-border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <p className="font-semibold text-sm truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={removeSelectedFile}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus</span>
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border pt-6 pb-6 bg-muted/10">
          <p className="text-xs text-muted-foreground max-w-sm hidden sm:block">
            Materi ini akan digunakan oleh sistem AI untuk menyusun soal ujian
            secara akurat sesuai konteks.
          </p>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto h-11 px-6 font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-[0.98] ml-auto"
          >
            <span>Lanjutkan ke Konfigurasi</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
