# Rencana Kerja: Implementasi Sistem Pencarian, Filter & Tagging Hybrid (Opsi 3)

## 1. Objective (Tujuan)

Menerapkan sistem pencarian teks cerdas dan filter tingkat lanjut pada halaman Bank Soal (`/dashboard/bank-soal`). Fitur pencarian menggunakan pola Hybrid (Opsi 3): menyaring kartu Paket Soal (Assessment) namun menampilkan cuplikan butir soal yang mengandung kata kunci pencarian secara instan di dalam kartu, guna menyajikan UX terbaik dengan performa tinggi yang mematuhi prinsip SOLID.

## 2. Affected Files (File yang Terpengaruh)

- `src/app/api/assessments/route.ts` (Modifikasi handler `GET` untuk menerima parameter query `search`, `difficulty`, dan `questionType` serta menyaring data menggunakan Prisma)
- `src/app/dashboard/bank-soal/page.tsx` (Penambahan UI pencarian, filter drop-down, integrasi status fetch, dan render cuplikan soal cocok)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Tahap 1: Backend API Sourcing (`src/app/api/assessments/route.ts`)

1. **Perbarui `GET` handler**:
   - Baca parameter query:
     - `search` (string kunci pencarian)
     - `difficulty` (EASY / MEDIUM / HARD)
     - `questionType` (MULTIPLE_CHOICE / TRUE_FALSE / SHORT_ANSWER / MIXED)
   - Susun dinamis objek `whereClause`:
     ```typescript
     const whereClause: any = { userId };
     if (difficulty) whereClause.difficulty = difficulty;
     if (questionType) whereClause.questionType = questionType;
     if (search) {
       whereClause.OR = [
         { rawInputText: { contains: search } },
         { questions: { some: { questionText: { contains: search } } } },
       ];
     }
     ```
   - Dalam query `prisma.assessment.findMany`, tambahkan `include` kondisional untuk butir soal yang cocok jika parameter `search` terisi:
     ```typescript
     include: {
       _count: { select: { questions: true } },
       questions: search ? {
         where: { questionText: { contains: search } },
         take: 2 // Ambil maksimal 2 cuplikan soal yang cocok
       } : undefined
     }
     ```
   - Jalankan build & pastikan query database terindeks dengan cepat.

### Tahap 2: Frontend UI & State Binding (`src/app/dashboard/bank-soal/page.tsx`)

2. **Tambahkan State Control**:
   - `searchQuery` (string untuk input pencarian teks)
   - `debouncedSearch` (untuk mencegah pemanggilan API berulang-ulang pada setiap ketukan keyboard)
   - `selectedDifficulty` (pilihan kesulitan)
   - `selectedType` (pilihan tipe soal)
3. **Desain Elemen Filter**:
   - Buat panel pencarian di bagian atas di bawah header:
     - Input teks pencarian dengan ikon `Search` dan tombol reset `X` jika tidak kosong.
     - Dropdown Select untuk Tipe Soal (Semua Tipe, Pilihan Ganda, dll).
     - Dropdown Select untuk Tingkat Kesulitan (Semua Tingkat, Mudah, dll).
4. **Render Cuplikan Soal Cocok di Kartu**:
   - Di dalam pemetaan `.map((assessment) => ...)`:
   - Jika `assessment.questions` ada dan memiliki panjang > 0, render bagian _"Butir Soal yang Cocok"_ dengan latar belakang soft-primary yang cantik dan list soal bercetak miring (`italic`) yang rapi.
5. **Debounce Logic & Fetch Triggering**:
   - Buat `useEffect` untuk memantau perubahan `searchQuery` dengan debounce 500ms yang mengisi `debouncedSearch`.
   - Jalankan ulang `fetchInitialAssessments` setiap kali `debouncedSearch`, `selectedDifficulty`, atau `selectedType` berubah.

## 4. Dependencies (Dependensi)

- Tidak ada dependensi baru (menggunakan Lucide-react + Tailwind yang sudah terinstal).

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Tidak ada hasil pencarian**: Jika hasil query kosong setelah difilter, tampilkan state kosong yang khusus (_"Tidak ditemukan paket soal yang cocok dengan kriteria pencarian Anda."_) dengan tombol "Reset Filter".
- **Prisma SQL Injection**: Operasi Prisma `.contains` otomatis di-sanitize oleh Prisma engine, aman dari SQL Injection.
