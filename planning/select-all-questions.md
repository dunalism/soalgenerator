# Rencana Implementasi Fitur Select All & Auto Scroll

Dokumen perencanaan ini dibuat untuk merancang penambahan fitur pilihan masal (bulk selection) "Pilih Semua / Select All" pada halaman Bank Soal (`/dashboard/bank-soal`) dan Detail Asesmen (`/dashboard/assessment/[id]`), serta fitur tombol cepat Scroll Up & Scroll Down di halaman Detail Asesmen dengan memperhatikan penempatan agar tidak bertabrakan dengan `FloatingCartBar`.

## 1. Objective (Tujuan)

- **Kemudahan Kompilasi Soal:** Memungkinkan guru/pengguna untuk memilih semua soal dari suatu paket asesmen dengan sekali klik, baik langsung dari daftar di halaman Bank Soal (`AssessmentCard`) maupun di dalam halaman Detail Asesmen (`ReviewStep`).
- **Aksibilitas Navigasi:** Menambahkan tombol melayang (floating button) untuk Scroll Up (kembali ke atas) dan Scroll Down (langsung ke bawah) pada halaman Detail Asesmen (`/dashboard/assessment/[id]`), sehingga memudahkan navigasi pada daftar soal yang panjang tanpa bertabrakan secara visual atau fungsional dengan `FloatingCartBar` yang berada di tengah bawah.
- **Kepatuhan Terhadap Aturan Proyek:** Mengimplementasikan perubahan dengan kode yang bersih, sinkronisasi state yang murni melalui Context API, serta menjaga performa yang optimal.

## 2. Affected Files (Berkas yang Terpengaruh)

- [ ] `src/lib/cart-context.tsx` (Menambahkan fungsi bulk selection ke CartProvider)
- [ ] `src/components/dashboard/ReviewStep.tsx` (Mengintegrasikan tombol "Pilih Semua / Batal" di header review soal)
- [ ] `src/components/dashboard/AssessmentCard.tsx` (Mengintegrasikan tombol "Pilih Semua / Batal" di dalam dropdown list butir soal pada kartu paket)
- [ ] `src/app/dashboard/assessment/[id]/page.tsx` (Menambahkan tombol floating auto-scroll up & down yang elegan)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 1: Memperbarui Cart Context (`src/lib/cart-context.tsx`)

Kita akan menambahkan fungsi untuk menangani penambahan dan penghapusan item dalam jumlah banyak sekaligus (bulk) agar sinkronisasi state berjalan dengan lancar.

- Tambahkan definisi fungsi di interface `CartContextType`:
  ```typescript
  addQuestionsBulk: (questions: CartItem[]) => void;
  removeQuestionsBulk: (questionIds: string[]) => void;
  ```
- Implementasikan fungsi-fungsi tersebut di dalam `CartProvider`:
  - `addQuestionsBulk`: Menggabungkan item baru ke dalam state `selectedQuestions` tanpa menduplikasi soal dengan ID yang sama.
  - `removeQuestionsBulk`: Memfilter keluar semua item yang memiliki ID yang terdapat pada daftar `questionIds`.

### Langkah 2: Mengimplementasikan "Pilih Semua" di Halaman Detail Asesmen (`src/components/dashboard/ReviewStep.tsx`)

- Di bagian atas list soal (di dalam atau dekat dengan overview card), tambahkan tombol toggle pilihan:
  - Deteksi apakah **semua** soal pada halaman saat ini sudah terpilih (`questions.every(q => isSelected(q.id))`).
  - Jika belum semua terpilih, tampilkan tombol dengan teks **"Pilih Semua Soal"** (menggunakan icon CheckSquare). Ketika diklik, panggil `addQuestionsBulk` untuk semua soal yang ada.
  - Jika sudah semua terpilih, tampilkan tombol dengan teks **"Batal Pilih Semua"** (menggunakan icon Square). Ketika diklik, panggil `removeQuestionsBulk` untuk ID dari semua soal tersebut.

### Langkah 3: Mengimplementasikan "Pilih Semua" di Bank Soal (`src/components/dashboard/AssessmentCard.tsx`)

- Di dalam list drawer yang meluas (ketika `isExpanded` bernilai true):
  - Tepat di bawah judul **"Pilih Butir Soal:"**, tambahkan sebuah baris kontrol yang berisi status dan tombol aksi cepat.
  - Buat tombol toggle serupa: Jika semua soal di paket ini (sesuai filter tipe jika ada) sudah terpilih, tampilkan opsi **"Batal Pilih Semua"**, jika belum tampilkan **"Pilih Semua"**.
  - Panggil `addQuestionsBulk` atau `removeQuestionsBulk` dengan daftar item murni dari `detailedQuestions`.

### Langkah 4: Menambahkan Floating Auto Scroll di Detail Asesmen (`src/app/dashboard/assessment/[id]/page.tsx`)

- Buat sebuah komponen tombol melayang (atau tambahkan di file page ini langsung) yang diposisikan secara aman di sebelah **kanan bawah** layar (`fixed right-6 bottom-6 md:right-8 md:bottom-8`).
- Karena `FloatingCartBar` terletak di **tengah bawah** (`left-1/2 -translate-x-1/2`), posisi kanan bawah sangatlah aman dan tidak akan bertabrakan secara visual.
- Tombol ini akan memiliki dua status atau dua tombol kecil bertumpuk:
  1. **Scroll ke Atas (Up):** Hanya muncul/aktif jika posisi scroll window sudah melebih nilai tertentu (misal `scrollY > 300`). Ketika diklik, memicu `window.scrollTo({ top: 0, behavior: 'smooth' })`.
  2. **Scroll ke Bawah (Down):** Muncul/aktif jika posisi scroll masih jauh dari bagian bawah halaman. Ketika diklik, memicu scroll ke bagian paling bawah halaman (`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })`).
- Desain tombol harus elegan, menggunakan class Tailwind (seperti `bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-accent hover:text-accent-foreground rounded-full p-2`), dan memiliki z-index yang tepat (`z-40` agar berada di bawah modal dialog `z-[100]` tapi di atas elemen konten biasa).

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru yang perlu diinstal. Kita cukup menggunakan library bawaan dan icon dari `lucide-react` (seperti `ArrowUp`, `ArrowDown`, `CheckSquare`, `Square`).

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Tipe Soal Berbeda di Bank Soal:** Saat user memilih semua soal di `AssessmentCard` dan ada filter tipe soal aktif, tombol "Pilih Semua" hanya akan memilih soal-soal yang lolos filter tipe tersebut, mencegah terpilihnya soal yang tidak diinginkan secara tidak sengaja.
- **Deteksi Ketersediaan Dokumen/Window:** Penanganan scroll event wajib dicek di sisi client (`useEffect`) agar aman dari error server-side rendering (SSR) Next.js.
- **Perubahan State Keranjang di Tempat Lain:** Karena menggunakan satu context (`CartProvider`), keranjang soal akan tetap sinkron 100% jika user membuka/menutup kartu di `/bank-soal` lalu pergi ke `/assessment/[id]`.

---

## Pernyataan Persetujuan

Apakah rencana ini sudah sesuai dengan ekspektasi Anda? Silakan balas dengan **"lanjut"**, **"ok"**, atau **"eksekusi"** untuk memulai pengerjaan!
