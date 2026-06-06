# Rencana Kerja: Refactoring Bank Soal - Pemisahan Komponen untuk Clean Code

## 1. Objective (Tujuan)

Melakukan refactoring pada `src/app/dashboard/bank-soal/page.tsx` guna memenuhi standard `.clinerules/component.md` dengan mengekstrak elemen UI besar/repetitif menjadi komponen terpisah yang modular dan bersih, khususnya mengekstrak item Paket Soal dalam loop `.map()` menjadi komponen `AssessmentCard`.

## 2. Affected Files (File yang Terpengaruh)

- `src/components/dashboard/AssessmentCard.tsx` (File baru: Komponen representasi satu Paket Soal modular)
- `src/app/dashboard/bank-soal/page.tsx` (Refactor untuk mengimpor dan menggunakan komponen baru, memperpendek panjang baris kode file utama)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Tahap 1: Ekstraksi Komponen `AssessmentCard`

1. **Buat file baru `src/components/dashboard/AssessmentCard.tsx`**:
   - Definisikan tipe antarmuka `AssessmentCardProps` yang menerima:
     - `assessment`: Obyek Assessment dengan relasi questions opsional.
     - `debouncedSearch`: string pencarian aktif untuk highlighting cuplikan soal.
     - `onDelete`: handler callback untuk menghapus assessment.
   - Salin seluruh JSX kartu, termasuk Helper label (`getDifficultyLabel` dan `getTypeLabel`).
   - Gunakan hook `useRouter` dari `next/navigation` di dalam komponen kartu ini untuk menavigasi ke detail.

### Tahap 2: Integrasi Komponen di Bank Soal Page

2. **Modifikasi `src/app/dashboard/bank-soal/page.tsx`**:
   - Impor komponen `AssessmentCard` yang baru dibuat.
   - Hapus helper lokal `getDifficultyLabel` dan `getTypeLabel` jika tidak diperlukan lagi di file utama.
   - Di dalam peta `.map((assessment) => ...)` rujukan grid kartu, ganti markup JSX raksasa lama dengan satu baris pemanggilan komponen:
     ```typescript
     <AssessmentCard
       key={assessment.id}
       assessment={assessment}
       debouncedSearch={debouncedSearch}
       onDelete={handleDeleteAssessment}
     />
     ```

## 4. Dependencies (Dependensi)

Tidak ada dependensi eksternal baru (menggunakan modul Next.js / Tailwind standar).

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Kompatibilitas Tipe Data**: Pastikan definisi interface `Assessment` di `page.tsx` dan `AssessmentCard.tsx` sinkron agar tidak menimbulkan error TypeScript saat build.
