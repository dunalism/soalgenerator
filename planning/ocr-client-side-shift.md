# Planning - Migrasi OCR ke Client-Side (Solusi Permanen Bug Module Not Found)

## 1. Objective (Tujuan)

Mengatasi error `MODULE_NOT_FOUND` pada pustaka `tesseract.js` saat dijalankan di Node.js serverless environment Next.js API. Masalah ini timbul karena bundler server (Turbopack/Webpack) tidak dapat memetakan jalur file internal worker-script di bawah direktori `.pnpm` virtual.
Solusi terbaik, tercepat, dan paling efisien secara resource server adalah **memindahkan proses OCR ke sisi Klien (Browser)**.
Keuntungan:

1. **Zero Server Load:** Ekstraksi gambar dilakukan di komputer pengguna, menghemat beban CPU/RAM server.
2. **No Payload Limits:** Tidak perlu mengirimkan data base64 gambar yang besar ke server, sehingga menghindari error HTTP 413 (Payload Too Large).
3. **Mulus di Browser:** Tesseract.js di browser secara otomatis mengunduh worker-script dari CDN publik yang sangat cepat, bebas dari masalah bundler server.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/app/api/assessments/route.ts` (Kembalikan ke fungsi bersih tanpa pemrosesan `Tesseract` server-side, sehingga API hanya menerima teks materi)
- [x] `src/app/dashboard/page.tsx` (Implementasikan impor `tesseract.js`, jalankan `Tesseract.recognize` di klien, tunjukkan progress ekstraksi teks kepada guru, dan kirimkan teks hasil OCR ke API)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Pembersihan Server API (`src/app/api/assessments/route.ts`)

- Hapus impor `Tesseract` pada backend.
- Kembalikan validasi `rawInputText` agar memvalidasi teks yang masuk baik dari input manual teks maupun hasil OCR dari client-side.
- Simpan `rawInputText` secara langsung di database MySQL (Assessment).

### Step 2: Implementasi OCR Client-Side (`src/app/dashboard/page.tsx`)

- Impor `Tesseract` dari `"tesseract.js"`.
- Tambahkan status progress teks (misal: `ocrStatus` / `isGenerating` dengan pesan deskriptif).
- Di dalam fungsi `handleGenerateQuestions()`:
  - Jika `inputType === "IMAGE"`:
    - Set loading state dengan label "Membaca teks materi dari gambar (OCR)...".
    - Jalankan `const ocrResult = await Tesseract.recognize(selectedFile, "ind+eng")` langsung di browser menggunakan berkas file asli (`selectedFile` bertipe `File`).
    - Validasi teks hasil OCR: Jika teks kosong atau kurang dari 10 karakter, tampilkan `showAlert` yang ramah menyarankan guru menggunakan gambar lain.
    - Set `rawInputText` untuk dikirimkan ke backend dengan teks hasil OCR tersebut.
- Kirim data JSON yang ringan (`rawInputText` berupa teks murni hasil ekstraksi) ke API POST `/api/assessments`.

---

## 4. Dependencies (Dependensi)

Tidak ada dependensi tambahan. Tesseract.js sudah tersedia dan kompatibel penuh dengan lingkungan browser (Client Component).

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Gambar Tanpa Teks:** Diuji di sisi klien dengan memberikan peringatan langsung sebelum menghubungi backend API, sehingga menghemat panggilan API dan kuota token AI.
- **Progress Visual:** Guru mendapatkan status pemrosesan yang transparan: "Membaca teks dari gambar..." dilanjutkan dengan "Menyusun soal dengan AI..." untuk meningkatkan kepuasan penggunaan aplikasi.
