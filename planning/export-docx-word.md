# Rencana Implementasi Ekspor Word dengan docx.js

Dokumen ini berisi rencana detail untuk mengganti sistem ekspor Word berbasis HTML/doc dengan file `.docx` asli menggunakan library `docx.js` (`docx` di package.json).

## 1. Objective (Tujuan)

Mengimplementasikan ekspor soal ke format Microsoft Word (`.docx`) yang sesungguhnya dan profesional menggunakan library `docx.js`, yang memenuhi lima kriteria utama:

1. **Font Times New Roman 12pt asli** di seluruh dokumen.
2. **Penomoran Asli Word dengan Inden Gantung (Hanging Indent)** yang presisi agar nomor soal dan teks soal tidak bertumpuk/bergeser.
3. **Pilihan Ganda 2-Kolom Sejajar** menggunakan objek `Table` borderless resmi Word, membagi pilihan a, b, c di kiri dan d, e di kanan secara sempurna. diberlakukan hanya jika jawabannya lebih dari 27 karakter.
4. **Tabel Menjodohkan Presisi** dengan border hitam rapi menggunakan objek tabel resmi Word.
5. **Page Break Resmi Word** menggunakan objek `PageBreak` asli untuk memisahkan Lembar Soal dan Kunci Jawaban.

## 2. Affected Files (File yang Terpengaruh)

- `src/lib/export-utils.ts`: File utama yang berisi fungsi pembuat dokumen ekspor. Kita akan memodifikasi/memperbarui fungsi `downloadAsWord` untuk menggunakan library `docx` untuk membuat file `.docx` biner yang asli, lalu mengunduhnya secara client-side.

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 3.1: Impor Library `docx` dan Definisikan Konstanta

Kita akan mengimpor komponen-komponen berikut dari `docx`:

- `Document`, `Packer`, `Paragraph`, `Run`, `Table`, `TableRow`, `TableCell`, `PageBreak`, `WidthType`, `BorderStyle`, `AlignmentType`, `HeadingLevel`.
- Kita akan mendefinisikan gaya default (Normal) dengan font `Times New Roman` dan ukuran `24` (12pt dalam docx dxa/setengah poin).

### Langkah 3.2: Buat Helper untuk Paragraf dengan Hanging Indent

Untuk penomoran soal agar sejajar sempurna dan tidak menumpuk:

- Kita gunakan properti `indent` di `Paragraph`:
  ```typescript
  indent: { left: 432, hanging: 432 } // 432 dxa = 0.3 inci
  ```
- Teks paragraf akan diawali dengan nomor soal dan karakter tab `\t`:
  ```typescript
  new Paragraph({
    children: [
      new Run({ text: `${idx + 1}.\t`, bold: false }),
      new Run({ text: q.questionText }),
    ],
    indent: { left: 432, hanging: 432 },
    spacing: { after: 120, line: 360 }, // 1.5 line spacing
  });
  ```

### Langkah 3.3: Implementasi Layout Pilihan Ganda 2-Kolom Sejajar

- Untuk soal pilihan ganda yang tidak memiliki opsi panjang (panjang setiap opsi <= 27 karakter), kita buat tabel borderless 2 kolom:
  - Kolom 1 (Kiri): Menampilkan pilihan a, b, c.
  - Kolom 2 (Kanan): Menampilkan pilihan d, e.
- Tabel akan diatur tanpa border (`borders: TableBorders.NONE` atau sejenisnya) dan lebar masing-masing kolom diatur `50%`.
- Setiap opsi di dalam kolom menggunakan penomoran huruf (misal: `a.\tTeks Opsi`) dengan hanging indent yang rapi.
- Jika terdapat opsi yang panjang (> 27 karakter), kita gunakan layout vertikal 1 kolom yang juga menggunakan hanging indent rapi.

### Langkah 3.4: Implementasi Tabel Menjodohkan Resmi & Presisi

- Kolom Kiri (Pernyataan) dan Kolom Kanan (Jawaban).
- Gunakan objek `Table` dari `docx` dengan border hitam solid di sekelilingnya:
  ```typescript
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  }
  ```
- Lebar masing-masing kolom diatur `50%`.

### Langkah 3.5: Implementasi Pemisahan Bagian & Page Break

- Setiap bagian (Pilihan Ganda, Benar/Salah, Menjodohkan, Uraian) akan dipisahkan dengan sub-header yang jelas.
- Lembar Soal dan Kunci Jawaban akan dipisahkan secara tegas menggunakan objek `new PageBreak()` dari `docx` agar pemisahan halaman di Word terjamin sempurna di halaman baru, bukan hanya sekadar CSS visual.

### Langkah 3.6: Penyusunan Dokumen & Export File .docx

- Kita akan mengumpulkan semua elemen (`Paragraph`, `Table`, `PageBreak`) ke dalam array `children` pada section dokumen.
- Kita gunakan `Packer.toBlob(doc)` untuk menghasilkan blob biner `.docx` asli.
- Unduh blob tersebut menggunakan file name berformat `.docx`.

## 4. Dependencies (Dependensi)

- `docx`: Sudah terinstall versi `^9.7.1` di `package.json`. Tidak diperlukan instalasi library tambahan.

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Opsi kosong / tidak lengkap:** Pilihan ganda akan dirender dengan jumlah pilihan yang tersedia secara aman (misal 4 pilihan atau 5 pilihan).
- **Soal kosong pada suatu tipe:** Jika tidak ada soal dengan tipe tertentu (misalnya tidak ada soal TRUE_FALSE), bagian tersebut akan dilewati secara otomatis tanpa menyebabkan error.
- **Karakter khusus / HTML tag:** Teks soal mungkin mengandung tag HTML sederhana atau karakter khusus. Kita akan membersihkan tag HTML dasar (seperti `<p>`, `</p>`, `<strong>`, dll.) menggunakan regex sederhana agar tidak merusak formatting dokumen Word biner.
