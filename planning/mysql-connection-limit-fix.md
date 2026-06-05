# Planning - Perbaikan Batas Koneksi MySQL / Pool Timeout

## 1. Objective (Tujuan)

Mengatasi masalah error `User 'soalgenerator_fairmileas' has exceeded the 'max_user_connections' resource (current value: 5)` dan `pool timeout: failed to retrieve a connection from pool after 10012ms`.
Masalah ini terjadi karena pengguna database pada server hosting memiliki batas maksimum koneksi (`max_user_connections`) sebesar **5**, sedangkan pool koneksi bawaan Prisma / MariaDB mencoba mengalokasikan hingga **10** koneksi. Kita perlu membatasi batas koneksi di tingkat adapter pool menjadi **4** koneksi saja agar tidak melebihi kuota server.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/lib/prisma.ts` (Menambahkan konfigurasi `connectionLimit` pada inisialisasi `PrismaMariaDb` adapter)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Memperbarui Konfigurasi Adapter `PrismaMariaDb`

- Buka file `src/lib/prisma.ts`.
- Tambahkan properti `connectionLimit: 4` ke dalam objek konfigurasi konstruktor `PrismaMariaDb`.
- Batas 4 dipilih agar aman berada di bawah limit server (yaitu 5), menyisakan 1 slot cadangan untuk keperluan administratif atau query langsung dari luar aplikasi tanpa memicu timeout atau penolakan koneksi dari MySQL.

---

## 4. Dependencies (Dependensi)

Tidak ada paket baru yang diperlukan. Ini murni modifikasi opsi konfigurasi adapter `mariadb` yang sudah terpasang.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Beban Tinggi / Antrean Pool:** Dengan membatasi koneksi menjadi 4, jika ada lebih dari 4 query paralel yang sangat berat, query berikutnya akan mengantre di pool. Namun, karena query Next.js di aplikasi ini sangat cepat (bukan long-running transactions), batas 4 koneksi ini akan sangat responsif dan tidak akan memicu timeout 10 detik.
- **Hot-Reloading:** Singleton pattern di `src/lib/prisma.ts` memastikan instance pool tidak di-recreate berulang kali saat mode development, menjaga jumlah koneksi aktif tetap di bawah limit 5.
