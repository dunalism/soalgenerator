# Planning - Implementasi Generator Soal dengan Gemini AI (Input Teks)

## 1. Objective (Tujuan)

Mengimplementasikan backend pembuatan soal secara nyata menggunakan Google Gemini AI (`@google/generative-ai`) berdasarkan inputan teks dari pengguna. Fitur ini akan menggantikan data soal dummy di API `/api/assessments` dengan soal interaktif berkualitas tinggi yang dihasilkan secara otomatis sesuai dengan konfigurasi yang dipilih (tipe soal, jumlah soal, dan tingkat kesulitan).

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/app/api/assessments/route.ts` (Implementasikan integrasi SDK Gemini, sistem prompt terstruktur, parsing JSON, dan penyimpanan DB)
- [x] `.env` (Panduan kepada pengguna untuk menambahkan `GEMINI_API_KEY`)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Penyiapan Environment Variable (`.env`)

- Menginstruksikan pengguna untuk menambahkan `GEMINI_API_KEY` di file `.env`:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

### Step 2: Implementasi Integrasi Gemini di `/api/assessments/route.ts`

- Impor `GoogleGenAI` atau `GoogleGenerativeAI` dari `@google/generative-ai`:
  ```typescript
  import { GoogleGenerativeAI } from "@google/generative-ai";
  ```
- Ambil kunci API dari `process.env.GEMINI_API_KEY`. Jika tidak dikonfigurasi, kirimkan respons error 500 yang jelas: "Kunci API Gemini belum dikonfigurasi."
- Susun **System Prompt** dan **User Prompt** yang kuat untuk memandu model `gemini-1.5-flash` dalam merumuskan soal berbasis materi input teks:
  - **Tingkat Kesulitan:** EASY (Fokus pada ingatan/pemahaman dasar), MEDIUM (Analisis tingkat menengah), HARD (HOTS - Higher Order Thinking Skills).
  - **Tipe Soal:** `MULTIPLE_CHOICE` (Pilihan Ganda dengan 4 opsi, 1 benar), `TRUE_FALSE` (Benar/Salah dengan kunci jawaban "Benar" atau "Salah"), `SHORT_ANSWER` (Isian Singkat).
  - **Jumlah Soal:** Sesuai dengan `questionCount`.
- Manfaatkan fitur **Structured Outputs (JSON Schema)** Gemini AI untuk memastikan response model selalu mengembalikan format JSON yang bersih dan sesuai dengan skema:
  ```typescript
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ...
    }
  });
  ```

### Step 3: Pengolahan Response dan Penyimpanan ke MySQL (Prisma)

- Parse JSON hasil dari Gemini AI.
- Iterasi hasil soal untuk dimasukkan ke database melalui Prisma menggunakan `prisma.question.create`:
  - Jika tipe soal `MULTIPLE_CHOICE`, buat record `Question` beserta relasi `Option` secara sekaligus menggunakan properti `create` Prisma.
  - Jika tipe soal `TRUE_FALSE` atau `SHORT_ANSWER`, buat record `Question` dengan `answerKey` yang sesuai dan tanpa `options`.

---

## 4. Dependencies (Dependensi)

Tidak ada paket baru yang perlu dipasang karena `@google/generative-ai` sudah tercantum di `package.json` Anda.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Kunci API Kosong:** Sistem akan memeriksa keberadaan `GEMINI_API_KEY` sebelum menghubungi model dan memberikan pesan peringatan yang informatif.
- **Format JSON Rusak:** Jika parse JSON gagal, backend akan menangkap error tersebut dan merespons dengan pesan ramah agar client dapat meminta proses ulang.
- **Keterbatasan Materi Input:** Jika teks materi terlalu pendek atau kosong, sistem akan memberikan respons validasi "Materi input terlalu pendek untuk dianalisis."
