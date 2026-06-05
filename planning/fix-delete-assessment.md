# Perbaikan Bug: Implementasi Fungsi DELETE untuk Paket Soal (Assessment)

## 1. Objective (Tujuan)

Memperbaiki error `405 Method Not Allowed` saat melakukan penghapusan paket soal (Assessment) dari Bank Soal. Fungsi handler `DELETE` belum didefinisikan di dalam rute `src/app/api/assessments/[id]/route.ts`.

## 2. Affected Files (File yang Terpengaruh)

- `src/app/api/assessments/[id]/route.ts` (Implementasi fungsi handler `DELETE`)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

1. **Tambahkan fungsi handler `DELETE`** di `src/app/api/assessments/[id]/route.ts`:
   - Ambil `id` dari params.
   - Gunakan Prisma untuk menghapus record `Assessment` dengan `id` tersebut:
     ```typescript
     await prisma.assessment.delete({
       where: { id },
     });
     ```
     _(Catatan: Pertemanan Cascade delete di schema.prisma otomatis akan menghapus semua Question dan Option yang berelasi dengan assessmentId tersebut)._
   - Bungkus dalam `try-catch` block sesuai panduan Prisma di `.clinerules/prisma.md` dan kembalikan response JSON:
     ```typescript
     return NextResponse.json({ success: true });
     ```

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru yang diperlukan.

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Record tidak ditemukan**: Jika ID tidak terdaftar di database, handle error `P2025` (Record not found) dari Prisma dan kembalikan status `404 Not Found` alih-alih merusak alur aplikasi.
