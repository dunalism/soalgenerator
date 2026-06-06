# Rencana Implementasi: Penambahan Tipe Soal "Menjodohkan" (Matching)

## 1. Objective

Menambahkan tipe soal baru yaitu **Menjodohkan (MATCHING)** ke dalam sistem SoalGenerator. Guru dapat memilih tipe soal "Menjodohkan" saat membuat asesmen baru. Sistem AI Gemini akan menghasilkan serangkaian pasangan premis (kiri) dan respon (kanan) yang tepat. Di halaman review dan cetak, butir-butir soal ini akan disajikan secara interaktif serta rapi dalam format kolom kiri-kanan yang siap dicetak.

## 2. Affected Files

Berikut adalah daftar file yang akan dimodifikasi:

- [ ] `prisma/schema.prisma` (Modifikasi: Tambahkan `MATCHING` pada enum `AssessmentType` dan `QuestionType`)
- [ ] `src/components/dashboard/ConfigStep.tsx` (Modifikasi: Tambahkan opsi "Menjodohkan" di dropdown Tipe Soal)
- [ ] `src/app/api/assessments/route.ts` (Modifikasi: Izinkan tipe `MATCHING` di API parser, perbarui Prompt AI Gemini dan Schema JSON untuk menghasilkan format menjodohkan)
- [ ] `src/components/dashboard/QuestionCard.tsx` (Modifikasi: Terapkan visualisasi editor untuk tipe soal `MATCHING` di mana terdapat kolom Premis Kiri dan Pasangan Jawaban Kanan)
- [ ] `src/components/dashboard/FloatingCartBar.tsx` (Modifikasi: Sesuaikan lembar cetak agar menyusun soal Menjodohkan secara berdampingan Kolom A dan Kolom B yang diacak)

## 3. Implementation Steps

### Langkah 1: Perbarui Schema Prisma & Database

1. Buka `prisma/schema.prisma` dan tambahkan `MATCHING` ke dalam:
   - `enum AssessmentType`
   - `enum QuestionType`
2. Jalankan perintah `pnpm prisma db push` untuk mensinkronkan database MySQL.
3. Jalankan `pnpm prisma generate` untuk memperbarui type declaration di Prisma Client.

### Langkah 2: Tambahkan Pilihan di UI Generator (`ConfigStep.tsx`)

1. Di `ConfigStep.tsx`, tambahkan opsi baru pada Select tipe soal:
   ```typescript
   <SelectItem value="MATCHING">Menjodohkan (Matching)</SelectItem>
   ```

### Langkah 3: Perbarui Logika Generator AI (`src/app/api/assessments/route.ts`)

1. Perbarui tipe parameter `questionType` di endpoint API agar mendukung `MATCHING`.
2. Di dalam Prompt Sistem Gemini, berikan instruksi spesifik untuk tipe `MATCHING`:
   - Jika tipe soal `MATCHING`, `questionText` bertindak sebagai **Premis/Pertanyaan (Kolom Kiri)**, sedangkan `answerKey` bertindak sebagai **Respon/Pasangan Jawaban yang Tepat (Kolom Kanan)**.
   - Pilihan ganda/`options` dikosongkan.
3. Pastikan AI menghasilkan pasangan menjodohkan yang relevan dan memiliki hubungan yang logis dari materi input.

### Langkah 4: Desain Visualisasi Soal Menjodohkan (`QuestionCard.tsx`)

1. Di `QuestionCard.tsx`, jika `question.type === "MATCHING"`, tampilkan UI editor khusus:
   - Input/Textarea kiri untuk **Premis / Istilah (Kolom Kiri)**.
   - Input/Textarea kanan untuk **Kunci Pasangan / Definisi (Kolom Kanan)**.
   - Desain kartu dengan visualisasi anak panah atau jembatan penghubung yang menunjukkan hubungan antara kiri dan kanan agar guru mudah membacanya.

### Langkah 5: Terapkan Layout Cetak Profesional (`FloatingCartBar.tsx` & `ReviewStep.tsx` PDF)

1. Guru sangat menyukai format cetak konvensional untuk soal menjodohkan.
2. Di fungsi cetak (`handleExport` di `FloatingCartBar.tsx`), kelompokkan butir-butir soal bertipe `MATCHING`.
3. Tampilkan soal Menjodohkan dalam bentuk tabel/kolom berdampingan:
   - **Kolom Kiri (Premis):** Berisi nomor 1, 2, 3... dengan teks premis.
   - **Kolom Kanan (Pilihan Respon):** Diacak secara otomatis (misalnya A, B, C...) sehingga siswa harus menjodohkan nomor di kiri dengan huruf di kanan.
   - Sertakan petunjuk pengisian yang rapi.

## 4. Dependencies

Tidak memerlukan package eksternal baru. Integrasi visual akan dibangun menggunakan CSS Flexbox/Grid bawaan Tailwind CSS dan komponen React standar.

## 5. Edge Cases & Error Handling

- **Acakan Kolom Kanan:** Pada lembar cetak, pastikan pilihan jawaban kolom kanan benar-benar diacak posisinya dan tidak sejajar langsung dengan pasangan aslinya agar ujian berfungsi dengan baik.
- **Kompilasi Remix:** Jika butir soal menjodohkan digabung dalam keranjang remix, sistem kompilasi `/api/assessments/remix` akan secara otomatis menggandakannya ke dalam paket baru bertipe `MIXED` dengan aman.
- **Fallback Data Kosong:** Menangani render jika database memiliki record bertipe `MATCHING` dengan data opsi yang kosong secara anggun.
