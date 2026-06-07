# Rencana Perbaikan Bug: Paket Soal Kosong pada Error Gemini AI

Dokumen ini berisi rencana detail untuk memperbaiki bug di mana paket soal (`Assessment`) yang kosong tersimpan ke database ketika terjadi kesalahan/error pada API Gemini AI (seperti `503 Service Unavailable` atau error lainnya).

## 1. Objective (Tujuan)

Mencegah pembuatan record `Assessment` kosong di database ketika proses pembuatan/generasi soal oleh Gemini AI mengalami error. Pembuatan record `Assessment` dan semua relasi soalnya (`questions` dan `options`) harus dilakukan secara **atomik** hanya ketika generasi soal dari Gemini AI berhasil sepenuhnya.

## 2. Affected Files (File yang Terpengaruh)

- `src/app/api/assessments/route.ts`: Mengubah urutan eksekusi proses pembuatan asesmen pada method `POST`.

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 3.1: Analisis Masalah (Root Cause)

Pada kode saat ini:

1. `prisma.assessment.create` dipanggil terlebih dahulu untuk membuat objek `Assessment`.
2. Kemudian, Google Gemini AI dipanggil melalui `model.generateContent`.
3. Jika langkah ke-2 melemparkan error (misalnya API Key salah, rate limit, service unavailable), program akan masuk ke block `catch`.
4. Namun, record `Assessment` yang dibuat di langkah ke-1 tetap berada di database MySQL tanpa memiliki soal satu pun (`questions` kosong).

### Langkah 3.2: Solusi Restrukturisasi Kode

Kita akan mengubah alur proses `POST` menjadi:

1. **Validasi awal** input dan API key (sama seperti saat ini).
2. **Panggil Gemini AI terlebih dahulu** untuk men-generate konten soal secara terstruktur.
3. **Parse respons JSON** dari Gemini AI menjadi `questionsList`.
4. **Gunakan nested creation (pembuatan tersarang) atomik Prisma** untuk membuat `Assessment`, seluruh `Question`, dan seluruh `Option` secara sekaligus dalam satu query tunggal:
   ```typescript
   const assessment = await prisma.assessment.create({
     data: {
       userId,
       title: title || null,
       inputType: inputType === "IMAGE" ? "IMAGE" : "TEXT",
       rawInputText: rawInputText,
       imageUrl: inputType === "IMAGE" ? imageUrl : "",
       questionType: questionType || "MULTIPLE_CHOICE",
       questionCount: Number(questionCount) || 10,
       difficulty: difficulty || "MEDIUM",
       questions: {
         create: questionsList.map((q, i) => ({
           questionText: q.questionText,
           type: q.type,
           order: i + 1,
           answerKey: q.answerKey,
           options:
             q.type === "MULTIPLE_CHOICE" &&
             q.options &&
             Array.isArray(q.options)
               ? {
                   create: q.options.map((opt) => ({
                     optionText: opt.optionText,
                     isCorrect: opt.isCorrect,
                   })),
                 }
               : undefined,
         })),
       },
     },
   });
   ```

### Langkah 3.3: Manfaat Pendekatan Atomik

- **Keamanan Data:** Database tidak akan pernah dikotori oleh paket soal kosong akibat kegagalan API eksternal.
- **Konsistensi Transaksi:** Jika ada satu bagian dari proses database yang gagal (misalnya karena inkonsistensi tipe data), seluruh pembuatan assessment dibatalkan secara otomatis (rollback).
- **Performa Lebih Baik:** Hanya memerlukan satu panggilan `prisma.assessment.create` utama dengan join tersarang, mengurangi round-trip query database yang berulang di dalam perulangan `for`.

## 4. Dependencies (Dependensi)

Tidak ada pustaka baru yang perlu diinstal.

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Error Gemini AI:** Jika Gemini mengembalikan error HTTP (seperti 503, 400, dll.), ia akan ditangkap oleh block `try-catch` utama dan mengembalikan status code 500 dengan pesan error yang ramah di UI tanpa menyimpan data apa pun di database.
- **Respon JSON Gemini Tidak Valid:** Jika respons teks Gemini tidak dapat di-parse sebagai JSON atau tidak memiliki properti `questions`, proses akan dibatalkan sebelum menyentuh database.
