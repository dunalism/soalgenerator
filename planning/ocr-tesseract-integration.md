# Planning - Integrasi OCR dengan Tesseract.js untuk Pembuatan Soal Berbasis Gambar

## 1. Objective (Tujuan)

Mengimplementasikan fitur pembuatan soal berbasis gambar (OCR) secara nyata. Pengguna dapat mengunggah gambar/screenshot materi pelajaran pada Tahap 1, dan sistem akan mengekstrak teks materi tersebut menggunakan pustaka **Tesseract.js** pada sisi backend. Teks materi yang berhasil diekstrak kemudian akan disimpan secara persisten di database MySQL dan diteruskan ke Google Gemini AI untuk digenerasikan menjadi soal ujian yang interaktif.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/app/api/assessments/route.ts` (Implementasikan penangkapan base64 image, ekstraksi teks dengan Tesseract.js, penyimpanan teks OCR ke database, dan generasi soal dengan Gemini)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Impor Tesseract.js pada Backend

- Di dalam file `src/app/api/assessments/route.ts`, impor modul `Tesseract`:
  ```typescript
  import Tesseract from "tesseract.js";
  ```

### Step 2: Deteksi Input Type & Proses OCR

- Saat request `POST` diterima, periksa `inputType`:
  - Jika `inputType === "IMAGE"`:
    - Verifikasi apakah parameter `imageUrl` (yang berisi string base64) telah dikirimkan.
    - Konversikan string base64 dari `imageUrl` menjadi buffer Node.js dengan cara membuang header metadata data URI (misalnya `data:image/png;base64,`).
    - Jalankan fungsi `Tesseract.recognize(imageBuffer, "ind+eng")` untuk mendeteksi teks dalam Bahasa Indonesia dan Bahasa Inggris secara akurat.
    - Validasi hasil OCR: Jika teks yang dihasilkan kurang dari 10 karakter, kirim respons error 400 kepada pengguna agar mengunggah gambar yang lebih jelas.
    - Set variabel `finalInputText` dengan hasil ekstraksi teks OCR tersebut.
  - Jika `inputType === "TEXT"`:
    - Jalankan validasi standar teks input materi minimal 10 karakter.

### Step 3: Penyimpanan Asesmen & Generasi Soal

- Buat record `Assessment` baru di MySQL menggunakan `finalInputText` sebagai isi kolom `rawInputText`. Langkah ini memastikan bahwa hasil OCR tersimpan secara permanen sehingga apabila guru merefresh halaman Review, data materi hasil OCR tetap dapat dibaca.
- Teruskan `finalInputText` ke sistem prompt Google Gemini AI untuk penyusunan soal ujian sesuai dengan konfigurasi guru.

---

## 4. Dependencies (Dependensi)

Tidak ada pustaka baru yang perlu dipasang. `tesseract.js` versi `^7.0.0` sudah terpasang di dalam berkas `package.json` proyek Anda.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Gambar Tanpa Teks / Buram:** Jika Tesseract tidak mendeteksi tulisan yang valid (teks hasil OCR < 10 karakter), backend akan mengembalikan respons HTTP 400 dengan pesan kesalahan terperinci: "Gagal mendeteksi teks materi dari gambar. Pastikan gambar memiliki teks tulisan yang jelas."
- **Format Gambar Tidak Didukung:** Konversi base64 ke Buffer menggunakan regular expression untuk membersihkan metadata Data URI sehingga mendukung berbagai format gambar standar seperti PNG, JPG, dan JPEG secara andal.
- **Keterlambatan Ekstraksi Tesseract:** Proses OCR pada server Node.js memerlukan sedikit waktu pemrosesan. Kami akan memastikan log error dicatat dengan baik untuk membantu proses debugging jika terjadi kendala overhead.
