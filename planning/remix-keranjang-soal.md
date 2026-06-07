# Rencana Implementasi: Fitur "Remix / Keranjang Soal" (Custom Test Builder)

## 1. Objective

Menambahkan fitur "Remix / Keranjang Soal" (Custom Test Builder) di aplikasi SoalGenerator. Fitur ini memungkinkan guru memilih butir-butir soal secara acak dari berbagai paket soal (materi) berbeda di halaman `/bank-soal` atau halaman detail paket, mengumpulkannya ke dalam keranjang dinamis (floating bar), lalu mengompilasinya menjadi Paket Soal baru atau mengekspornya langsung ke Word/PDF.

## 2. Affected Files

Berikut adalah file yang akan dibuat atau dimodifikasi:

- [ ] `src/lib/cart-context.tsx` (Baru: Menyimpan state keranjang secara global dengan sinkronisasi ke LocalStorage)
- [ ] `src/app/dashboard/layout.tsx` (Modifikasi: Membungkus konten dashboard dengan `CartProvider`)
- [ ] `src/app/dashboard/bank-soal/page.tsx` (Modifikasi: Menampilkan tombol untuk membuka laci/lapis list soal dari assessment, sehingga guru bisa mencentang soal tanpa harus masuk ke halaman detail, jika diinginkan)
- [ ] `src/components/dashboard/AssessmentCard.tsx` (Modifikasi: Menambahkan tombol "Lihat Butir Soal" / expand, atau menampilkan daftar soal di dalam card agar guru dapat mencentang langsung)
- [ ] `src/components/dashboard/ReviewStep.tsx` (Modifikasi: Menyediakan checkbox di samping setiap butir soal jika dibuka dari halaman detail paket `/dashboard/assessment/[id]`)
- [ ] `src/components/dashboard/QuestionCard.tsx` (Modifikasi: Menambahkan properti checkbox untuk seleksi)
- [ ] `src/components/dashboard/FloatingCartBar.tsx` (Baru: UI bar melayang di bagian bawah layar yang menunjukkan jumlah soal terpilih, detail butir soal yang masuk keranjang, tombol Kompilasi, dan tombol Ekspor)
- [ ] `src/app/api/assessments/remix/route.ts` (Baru: API Endpoint untuk menerima daftar id soal atau data soal, dan membuat assessment baru berisi soal-soal tersebut)

## 3. Implementation Steps

### Langkah 1: Buat `CartContext` (`src/lib/cart-context.tsx`)

1. Definisikan tipe untuk item soal dalam keranjang (`CartItem`):
   - `id`: string (ID Soal asli)
   - `questionText`: string
   - `type`: MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
   - `options`: array dari pilihan jawaban
   - `answerKey`: string
   - `assessmentId`: string
   - `assessmentSnippet`: string (snippet materi pembentuk)
2. Buat context `CartContext` yang memuat:
   - `selectedQuestions`: `CartItem[]`
   - `toggleQuestion`: `(question: CartItem) => void`
   - `clearCart`: `() => void`
   - `isSelected`: `(id: string) => boolean`
3. Gunakan `localStorage` agar pilihan soal tidak hilang saat halaman di-reload.

### Langkah 2: Bungkus Dashboard Layout (`src/app/dashboard/layout.tsx`)

1. Import `CartProvider` dan bungkus bagian `{children}` di dalam `main` atau layout utama agar halaman detail `/assessment/[id]` dan `/bank-soal` dapat mengakses state keranjang secara real-time.
2. Sisipkan komponen `FloatingCartBar` di bagian bawah layout utama dashboard agar bar melayang selalu terlihat di halaman bank soal dan detail asesmen ketika ada soal yang terpilih.

### Langkah 3: Tambahkan Checkbox Seleksi pada Detail Paket Soal (`src/components/dashboard/ReviewStep.tsx` & `src/components/dashboard/QuestionCard.tsx`)

1. Di `QuestionCard.tsx`, tambahkan opsional prop `showCheckbox`, `checked`, dan `onCheckedChange`. Jika diaktifkan, tampilkan checkbox berdesain menarik (menggunakan Tailwind & Lucide Check/Square) di sebelah kiri nomor soal.
2. Di `ReviewStep.tsx`, berikan checkbox ini pada setiap `QuestionCard`. Hubungkan dengan `toggleQuestion` dari `CartContext`.

### Langkah 4: Tambahkan Integrasi di Halaman Utama `/bank-soal` (`src/components/dashboard/AssessmentCard.tsx`)

1. Di `AssessmentCard.tsx`, berikan fungsionalitas untuk me-load secara cepat soal-soal di dalam paket (expandable panel atau list butir soal ringkas) sehingga guru tidak harus pindah halaman untuk mencentang soal.
2. Integrasikan checkbox seleksi ke list butir soal ringkas tersebut agar guru bisa mencentang 3 soal Aljabar dan 2 soal Geometri langsung dari halaman utama `/bank-soal`.

### Langkah 5: Buat Komponen Melayang `FloatingCartBar.tsx` (`src/components/dashboard/FloatingCartBar.tsx`)

1. Desain bar melayang (`fixed bottom-6 left-1/2 -translate-x-1/2`) dengan background glassmorphism (blur), shadow tebal, border emas/biru menawan.
2. Tampilkan teks: **"Terpilih: X Soal"**.
3. Tambahkan tombol:
   - **"Kompilasi Paket Baru"**: Akan memicu modal dialog untuk mengisi judul/materi paket baru, lalu memanggil API `/api/assessments/remix` untuk membuat paket assessment baru di database. Setelah berhasil, arahkan guru ke halaman review paket baru tersebut.
   - **"Ekspor Pilihan"**: Menyediakan dropdown atau tombol cepat untuk ekspor semua soal terpilih ke Word (DOCX) atau PDF.
   - **"Lihat Detail"**: Opsional drawer/popover kecil untuk melihat daftar teks soal yang telah dicentang dan menghapus item tertentu dari keranjang.

### Langkah 6: Implementasi API Kompilasi Baru (`src/app/api/assessments/remix/route.ts`)

1. Endpoint POST menerima:
   - `userId`: string
   - `title`/`rawInputText`: deskripsi ringkas paket remix (misal: "Remix Paket Soal UAS")
   - `questionIds`: string[] (ID butir soal asli yang ingin dicloning ke paket baru)
2. Di dalam API, gunakan transaksi Prisma untuk:
   - Membuat rekaman `Assessment` baru dengan tipe `MIXED` (atau disesuaikan dengan jenis soal pembentuk), difficulty `MEDIUM`, dan `questionCount` sesuai jumlah soal yang terpilih.
   - Mengambil soal-soal asli (`Question` & `Option`) berdasarkan `questionIds`.
   - Menggandakan (deep copy) butir-butir soal tersebut ke dalam record `Question` dan `Option` baru yang berelasi dengan `Assessment` baru.
3. Mengembalikan id assessment baru agar client-side bisa melakukan redirect.

### Langkah 7: Tambahkan Fungsionalitas Ekspor di Keranjang

1. Terapkan client-side ekspor ke PDF (atau simulasi format cetak rapi dengan jendela cetak print-friendly HTML/PDF browser) serta Word (DOCX).
2. Tampilkan preview sebelum ekspor jika diperlukan.

## 4. Dependencies

Semua komponen standard seperti `@radix-ui/react-checkbox` atau sejenisnya sudah terpasang atau dapat dibangun menggunakan custom button/icon bergaya checkbox buatan sendiri demi keandalan optimal tanpa merusak package manager Windows. Kita akan menggunakan library UI standar yang sudah ada (Lucide-react, Tailwind CSS, Shadcn) tanpa menginstal package eksternal baru yang berisiko.

## 5. Edge Cases & Error Handling

- **Keranjang Kosong:** `FloatingCartBar` otomatis disembunyikan jika jumlah soal terpilih adalah 0.
- **Kompilasi Tanpa Soal:** Memvalidasi di client & API agar minimal 1 soal terpilih untuk melakukan kompilasi.
- **Kompilasi Lintas Tipe:** Menangani jenis soal yang berbeda (pilihan ganda, benar salah, Uraian/Esai) secara elegan ketika disatukan ke dalam satu paket `MIXED`.
- **Relasi Database:** Memastikan deep copy soal menyalin seluruh relasi `Option` (pilihan ganda) dengan benar ke ID paket baru tanpa memengaruhi data asli.
- **Batasan Akses User:** Memastikan user hanya bisa mengompilasi soal milik mereka sendiri.

## 6. Success Criteria

1. Guru dapat memilih soal-soal acak dari paket yang berbeda di `/bank-soal` (misal: Bab 1, Bab 2) melalui checkbox.
2. Floating bar "Terpilih: X Soal" muncul secara real-time di bawah layar.
3. Tombol "Kompilasi menjadi Paket Baru" berhasil membuat paket baru di database MySQL dan mengarahkan pengguna ke halaman detail paket hasil kompilasi.
4. Tombol "Ekspor Pilihan" berhasil mengunduh berkas soal yang dipilih.
