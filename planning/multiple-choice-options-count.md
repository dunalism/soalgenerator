# Rencana Implementasi: Kustomisasi Jumlah Pilihan Jawaban (4 atau 5 Opsi) untuk Pilihan Ganda

## 1. Objective

Menambahkan pengaturan baru agar guru dapat menentukan jumlah pilihan jawaban (opsi) pada soal pilihan ganda, yaitu 4 pilihan (A-D) atau 5 pilihan (A-E). Pilihan ini akan dikirim ke API generator AI Gemini untuk menyusun soal dengan jumlah opsi yang sesuai.

## 2. Affected Files

Berikut adalah file yang akan dibuat atau dimodifikasi:

- [ ] `planning/multiple-choice-options-count.md` (Baru: Dokumen perencanaan)
- [ ] `src/app/dashboard/generate/page.tsx` (Modifikasi: Menyimpan state `optionsCount` dan meneruskannya ke POST `/api/assessments`)
- [ ] `src/components/dashboard/ConfigStep.tsx` (Modifikasi: Menampilkan pilihan "Jumlah Pilihan Jawaban" ketika tipe soal yang dipilih adalah Pilihan Ganda atau Campuran)
- [ ] `src/app/api/assessments/route.ts` (Modifikasi: Membaca `optionsCount` dari body request, menyesuaikan JSON Schema Gemini dan System Prompt sesuai jumlah opsi yang diinginkan)

## 3. Implementation Steps

### Langkah 1: Tambahkan State di `generate/page.tsx`

1. Definisikan state `optionsCount` dengan nilai bawaan `4`:
   ```typescript
   const [optionsCount, setOptionsCount] = useState<number>(4);
   ```
2. Teruskan state ini beserta `setOptionsCount` ke dalam komponen `<ConfigStep />`.
3. Kirimkan parameter `optionsCount` dalam request body saat memanggil `/api/assessments` di fungsi `handleGenerateQuestions`.

### Langkah 2: Perbarui UI di `ConfigStep.tsx`

1. Tambahkan properti `optionsCount` dan `setOptionsCount` ke dalam `ConfigStepProps`.
2. Jika `questionType === "MULTIPLE_CHOICE"` atau `questionType === "MIXED"`, tampilkan form pengaturan baru: **"Jumlah Pilihan Jawaban"**.
3. Gunakan selector atau tab tombol sederhana untuk memilih antara:
   - **4 Pilihan (A, B, C, D)**
   - **5 Pilihan (A, B, C, D, E)**

### Langkah 3: Sesuaikan Prompt dan Schema AI di `/api/assessments/route.ts`

1. Tangkap parameter `optionsCount` dari body request (default ke `4` jika tidak disertakan).
2. Perbarui deskripsi properti `options` di dalam `responseSchema` Gemini:
   - Deskripsi dinamis: `"Pilihan jawaban (wajib ada tepat ${optionsCount} pilihan jika tipe soal MULTIPLE_CHOICE, kosongkan jika TRUE_FALSE atau SHORT_ANSWER)"`.
3. Perbarui `systemPrompt` bagian MULTIPLE_CHOICE agar meminta persis jumlah opsi yang dipilih:
   - `"Setiap soal wajib memiliki tepat ${optionsCount} pilihan jawaban ('options') di mana hanya ada 1 pilihan yang benar ('isCorrect' bernilai true)."`

## 4. Dependencies

Tidak memerlukan instalasi package eksternal baru. Semua dikendalikan lewat parameter input HTML dan API prompt Gemini AI.

## 5. Edge Cases & Error Handling

- **Tipe Soal Benar/Salah & Isian:** Pilihan jumlah opsi ini otomatis disembunyikan jika tipe soal yang dipilih bukan Pilihan Ganda (`MULTIPLE_CHOICE`) atau Campuran (`MIXED`).
- **Nilai Kosong/Default:** Jika request tidak menyertakan `optionsCount` (misal dari script lama), endpoint API otomatis menetapkan nilai default `4`.
- **Validasi Nilai:** Membatasi nilai `optionsCount` hanya boleh `4` atau `5` di tingkat API.
