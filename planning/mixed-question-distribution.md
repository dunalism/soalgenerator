# Rencana Implementasi: Distribusi Kustom Tipe Soal untuk Soal Campuran (Mixed)

Dokumen ini berisi rencana detail untuk menambahkan fitur distribusi jumlah soal kustom berdasarkan tipe (Pilihan Ganda, Benar/Salah, Menjodohkan, Uraian/Esai) ketika pengguna memilih tipe soal **Campuran (Mixed)**.

## 1. Objective (Tujuan)

- Menyediakan antarmuka (UI/UX) yang intuitif dan nyaman di `ConfigStep.tsx` bagi guru untuk menentukan jumlah spesifik dari masing-masing tipe soal saat memilih tipe soal "Campuran".
- Menjamin jumlah dari setiap jenis soal selalu sesuai (sama) dengan total `questionCount` yang dipilih untuk mencegah inkonsistensi.
- Memperbarui API backend di `src/app/api/assessments/route.ts` untuk menerima parameter distribusi tersebut dan menginstruksikan Gemini AI membuat soal sesuai dengan rasio kustom yang diinginkan pengguna.

## 2. Affected Files (File yang Terpengaruh)

- `src/components/dashboard/ConfigStep.tsx`: Antarmuka formulir konfigurasi untuk membagi jumlah soal.
- `src/app/dashboard/generate/page.tsx`: Pengelola state utama halaman generate yang akan mengoper data distribusi ke API.
- `src/app/api/assessments/route.ts`: API route yang memproses instruksi sistem prompt Gemini AI sesuai distribusi kustom tipe soal.

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 3.1: Tambahkan State Distribusi Soal di `page.tsx`

Kita akan mendefinisikan state baru di `src/app/dashboard/generate/page.tsx` untuk menampung jumlah masing-masing tipe soal ketika `questionType === "MIXED"`:

- `mixedMcCount` (Pilihan Ganda) - default: `ceil(total / 4)`
- `mixedTfCount` (Benar/Salah) - default: `floor(total / 4)`
- `mixedSaCount` (Uraian/Esai) - default: `floor(total / 4)`
- `mixedMatchCount` (Menjodohkan) - default: `floor(total / 4)`

Kita juga membuat fungsi penyeimbang (`autoDistribute(total: number)`) yang membagi rata jumlah soal ke 4 tipe tersebut, menyisakan sisa pembagian ke tipe Pilihan Ganda atau tipe lainnya secara berurutan. Fungsi ini akan dipanggil otomatis setiap kali `questionCount` berubah.

### Langkah 3.2: Perbarui Antarmuka Pengguna di `ConfigStep.tsx`

Di dalam `ConfigStep.tsx`, jika `questionType === "MIXED"`:

1. Tampilkan panel distribusi soal dengan 4 input angka (atau slider/counter):
   - **Pilihan Ganda (PG)**
   - **Benar/Salah (B/S)**
   - **Menjodohkan**
   - **Uraian/Esai**
2. Tampilkan indikator status real-time:
   - Jika jumlah sub-soal **sama** dengan total soal, tampilkan teks hijau centang: `✓ Distribusi pas: [jumlah] dari [total] soal`.
   - Jika **tidak sama**, tampilkan pesan peringatan merah: `⚠ Jumlah sub-soal ([jumlah]) tidak sama dengan total soal ([total]). Silakan sesuaikan atau klik Bagi Rata`.
3. Tambahkan tombol **"Bagi Rata"** untuk mendistribusikan total soal kembali secara seimbang dengan satu klik.
4. Disable tombol "Buat Soal Sekarang" jika jumlah sub-soal tidak sama dengan total soal.

### Langkah 3.3: Integrasikan Pengiriman Data ke API

Kirim data distribusi (`mixedMcCount`, `mixedTfCount`, `mixedSaCount`, `mixedMatchCount`) di dalam payload POST request ke `/api/assessments`.

### Langkah 3.4: Perbarui API Route `/api/assessments`

Di `src/app/api/assessments/route.ts`:

1. Ambil nilai `mixedMcCount`, `mixedTfCount`, `mixedSaCount`, dan `mixedMatchCount` dari request body.
2. Jika `questionType === "MIXED"`, sesuaikan instruksi pada `systemPrompt` agar memberi tahu Gemini AI jumlah pasti untuk tiap tipe soal:
   - "Hasilkan tepat `${mixedMcCount}` soal Pilihan Ganda..."
   - "Hasilkan tepat `${mixedTfCount}` soal Benar/Salah..."
   - "Hasilkan tepat `${mixedSaCount}` soal Uraian/Esai..."
   - "Hasilkan tepat `${mixedMatchCount}` soal Menjodohkan..."
3. Total soal yang divalidasi tetap `questionCount` (yang merupakan hasil penjumlahan sub-soal tersebut).

## 4. Dependencies (Dependensi)

Tidak ada pustaka baru yang perlu diinstal.

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Validasi Jumlah:** Validasi di sisi frontend dan backend untuk memastikan total distribusi sama dengan `questionCount`. Jika user memasukkan angka negatif atau kosong, otomatis diubah menjadi `0`.
- **Custom Question Count:** Input manual oleh user pada total jumlah soal akan memicu auto-distribusi seimbang secara real-time.
- **Rasio Pilihan Jawaban:** Jika jumlah soal pilihan ganda dalam campuran bernilai `0`, pilihan opsi count (A-D / A-E) disembunyikan agar UI tetap bersih.
