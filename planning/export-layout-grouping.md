# Rencana Implementasi: Fitur Ekspor Terstruktur (Otomatis Grouping, Urutan Statis, dan Format Times New Roman)

## 1. Objective

Mengembangkan sistem ekspor soal (PDF/Cetak dan Word) yang terorganisir secara otomatis tanpa memerlukan interaksi modal tambahan yang merumitkan user experience. Sistem ekspor ulasan paket soal (`ReviewStep`) dan keranjang remix (`FloatingCartBar`) akan secara otomatis mengelompokkan dan mengurutkan butir-butir soal ke dalam 4 bagian statis profesional (Pilihan Ganda, Benar/Salah, Menjodohkan, Uraian/Esai) lengkap dengan tata letak Times New Roman Size 12pt yang rapi sesuai standar kertas ujian sekolah.

## 2. Affected Files

Berikut adalah daftar file yang akan dimodifikasi:

- [x] `planning/export-layout-grouping.md` (Modifikasi: Dokumen perencanaan)
- [ ] `src/components/dashboard/ReviewStep.tsx` (Modifikasi: Menerapkan fungsi ekspor terstruktur otomatis untuk Word dan PDF/Cetak)
- [ ] `src/components/dashboard/FloatingCartBar.tsx` (Modifikasi: Menerapkan fungsi ekspor terstruktur otomatis untuk Word dan PDF/Cetak)

## 3. Implementation Steps

### Langkah 1: Logika Pemilahan & Pengurutan Otomatis (Automatic Grouping & Ordering)

Saat tombol ekspor/cetak diklik (baik di `ReviewStep` maupun `FloatingCartBar`), fungsi ekspor akan langsung memilah butir soal menjadi 4 bagian dengan urutan statis permanen:

1. **Bagian A: Pilihan Ganda** (Tipe `MULTIPLE_CHOICE`)
   - Petunjuk pengerjaan: **"Bagian A: Pilihan Ganda"** — _"Pilihlah salah satu jawaban yang paling tepat!"_
   - Opsi jawaban `a, b, c, d, e` menggunakan huruf kecil.
   - **Tata Letak Opsi (Batas 27 Karakter):**
     - Jika semua opsi pada suatu soal berukuran 27 karakter atau kurang: Ditampilkan berdampingan dalam format 2-kolom. Sisi kiri berisi `a., b., c.`, sisi kanan berisi `d., e.` secara sejajar.
     - Jika ada opsi yang melebihi 27 karakter: Ditampilkan lurus berurutan ke bawah (1 opsi per baris).
2. **Bagian B: Benar/Salah** (Tipe `TRUE_FALSE`)
   - Petunjuk pengerjaan: **"Bagian B: Benar/Salah"** — _"Lingkarilah huruf B jika pernyataan benar atau S jika salah!"_
   - Format: Di sebelah kanan teks soal ditampilkan opsi `[ B  -  S ]` secara presisi menggunakan layout flex/tabel transparan.
3. **Bagian C: Menjodohkan** (Tipe `MATCHING`)
   - Petunjuk pengerjaan: **"Bagian C: Menjodohkan"** — _"Pasangkanlah pernyataan di Kolom Kiri dengan jawaban yang sesuai di Kolom Kanan!"_
   - Format: Kolom Kiri (Premis) bernomor urut (`1, 2...`), Kolom Kanan (Pilihan Respon) diacak dan berindeks HURUF BESAR (`A, B, C...`).
4. **Bagian D: Uraian/Esai** (Tipe `SHORT_ANSWER`)
   - Petunjuk pengerjaan: **"Bagian D: Uraian/Esai"** — _"Jawablah pertanyaan berikut dengan jelas!"_
   - Format: Hanya menampilkan teks soal saja secara berurutan **tanpa menyediakan ruang kosong** atau garis titik-titik di bawahnya.

### Langkah 2: Aturan Penomoran & Kunci Jawaban

1. **Reset Penomoran per Bagian:** Penomoran untuk setiap kelompok soal baru selalu **dimulai kembali dari nomor 1**.
2. **Kunci Jawaban di Halaman Baru:** Halaman Kunci Jawaban diletakkan di bagian paling akhir dokumen dengan menggunakan pemisah halaman `page-break-before: always;`.

### Langkah 3: Penyelarasan Desain & Estetika Cetak (Times New Roman 12)

1. **Ekspor Word (DOCX):** Memformat file HTML dengan CSS tersemat dan mengunduhnya sebagai berkas `.doc`/`.docx` melalui teknik MIME-type (`application/msword`).
2. **Cetak / PDF:** Menggunakan template styling `@media print` dengan jenis font `Times New Roman`, ukuran `12pt`, warna teks hitam pekat, serta properti `page-break-inside: avoid` pada setiap butir soal untuk mencegah keterpotongan halaman yang buruk.

## 4. Dependencies

Tidak memerlukan package eksternal baru.

## 5. Edge Cases & Error Handling

- Jika suatu tipe soal tidak ada dalam kumpulan soal aktif saat ini, bagian tersebut otomatis diloncati tanpa memengaruhi urutan bagian lainnya.
- Memastikan pengacakan kolom kanan pada soal Menjodohkan tidak merusak pemetaan kunci jawaban yang benar pada halaman Kunci Jawaban.
