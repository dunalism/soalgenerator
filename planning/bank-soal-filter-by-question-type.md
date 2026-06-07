# Rencana Perbaikan: Filter Bank Soal Berdasarkan Tipe Soal (QuestionType)

Dokumen ini berisi rencana detail untuk mengubah fitur filter tipe soal pada halaman Bank Soal agar menyaring berdasarkan tipe soal butiran (`QuestionType`) yang ada di dalam paket, bukan lagi berdasarkan tipe paket itu sendiri (`AssessmentType`). Ini memungkinkan paket campuran (`MIXED`) tetap muncul jika berisi tipe soal yang dicari.

## 1. Objective (Tujuan)

- Mengubah dropdown filter tipe soal di halaman `/bank-soal` untuk menyaring berdasarkan butir soal (`QuestionType`), bukan lagi `AssessmentType`.
- Menghapus opsi filter tipe "Campuran" (`MIXED`) dari dropdown karena "Campuran" bukan merupakan tipe butir soal melainkan tipe paket.
- Memperbarui API backend di `src/app/api/assessments/route.ts` agar menyaring `Assessment` yang memiliki relasi `questions` dengan kriteria tipe soal (`some: { type: questionType }`).

## 2. Affected Files (File yang Terpengaruh)

- `src/app/dashboard/bank-soal/page.tsx`: Modifikasi UI dropdown filter untuk menghapus opsi `MIXED`.
- `src/app/api/assessments/route.ts`: Modifikasi query Prisma untuk memfilter berdasarkan tipe butir soal tersarang (`questions.some.type`), bukan lagi `Assessment.questionType` langsung.

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 3.1: Perbarui Dropdown Filter di `page.tsx`

Di dalam `src/app/dashboard/bank-soal/page.tsx`:

- Cari elemen dropdown `<select>` untuk tipe soal (`selectedType`).
- Hapus baris `<option value="MIXED">Campuran</option>` karena kita tidak lagi melakukan penyaringan tipe paket, melainkan tipe butir soal asli (`QuestionType`).

### Langkah 3.2: Perbarui API Route `/api/assessments`

Di dalam `src/app/api/assessments/route.ts`:

- Perbarui deklarasi tipe `whereClause` agar mendukung properti `questions`:
  ```typescript
  const whereClause: {
    userId: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    questions?: {
      some: {
        type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING";
      };
    };
    OR?: Array<{
      rawInputText?: { contains: string };
      questions?: { some: { questionText: { contains: string } } };
    }>;
  } = {
    userId: userId,
  };
  ```
- Ganti logika filter `questionType`:
  ```typescript
  if (questionType) {
    whereClause.questions = {
      some: {
        type: questionType as
          | "MULTIPLE_CHOICE"
          | "TRUE_FALSE"
          | "SHORT_ANSWER"
          | "MATCHING",
      },
    };
  }
  ```
- Logika ini memastikan bahwa jika user memfilter "Pilihan Ganda", paket soal bertipe `MIXED` yang mengandung soal pilihan ganda di dalamnya akan tetap muncul!

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru.

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Kombinasi Pencarian & Filter:** Jika user menggunakan filter tipe soal sekaligus pencarian kata kunci, Prisma akan melakukan query AND secara otomatis antara filter tipe soal butiran (`questions.some.type`) dan filter kata kunci (`OR` clause). Ini sangat stabil dan didukung penuh oleh Prisma.
