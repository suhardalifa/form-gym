# FORM — Your Personal Gym Companion

Website pencatat latihan gym dengan antarmuka minimalis putih/abu-abu dan aksen hijau lembut. Project ini dibuat dengan React, TypeScript, Tailwind CSS, Vite, Supabase Auth, PostgreSQL, dan Recharts.

> **Status implementasi:** ini adalah starter full-stack yang disiapkan untuk dijalankan dan dihubungkan ke project Supabase milikmu. Kode serta SQL tersedia di repositori lokal ini, tetapi integrasi belum dijalankan terhadap project Supabase nyata dan belum diverifikasi lewat build/test di lingkungan ini. Jangan menganggap fitur online sudah teruji sampai kamu mengikuti setup dan melakukan pengujian sendiri.

## Fitur yang tersedia dalam source

- Form login dan pendaftaran menggunakan Supabase Auth.
- Ringkasan aktivitas dan sesi terbaru.
- Katalog enam kelompok otot dengan penjelasan fungsi dan gerakan contoh.
- Detail gerakan, instruksi langkah, serta dukungan video YouTube embed / tautan HTTPS.
- Planner Senin–Minggu, toggle rest day, judul hari, pilihan gerakan dan penyimpanan ke database.
- Workout log: tanggal, durasi, catatan, gerakan, beban (kg), repetisi, banyak set.
- Grafik beban maksimum per sesi dan volume (kg × reps) menggunakan data database.
- Row Level Security (RLS) untuk data profil, planner, sesi, gerakan sesi, dan set.
- Desain responsif desktop/mobile.

### Catatan data awal
Sebelum Supabase dikonfigurasi, aplikasi menampilkan halaman autentikasi dengan pemberitahuan setup. Katalog memiliki data fallback di source untuk menjaga UI tetap terlihat, tetapi fitur simpan planner, log, dan grafik memerlukan Supabase. Data fallback bukan data latihan pengguna dan tidak dimasukkan ke grafik progres.

## Persyaratan

- Node.js LTS (disarankan versi 20 atau lebih baru)
- npm (ikut terpasang bersama Node.js)
- Visual Studio Code
- Akun Supabase

## Setup di VS Code

### 1. Ekstrak dan buka folder

1. Unduh ZIP project dan ekstrak.
2. Buka VS Code.
3. Pilih **File → Open Folder...** lalu pilih folder `form-gym`.
4. Buka terminal: **Terminal → New Terminal**.

### 2. Instal dependensi

Jalankan dari terminal pada folder project:

```bash
npm install
```

### 3. Buat project Supabase

1. Masuk ke [Supabase](https://supabase.com/) dan buat project baru.
2. Tunggu database selesai dibuat.
3. Buka **Project Settings → API** (nama menu dapat sedikit berbeda pada tampilan dashboard).
4. Salin Project URL dan publishable key / anon key. **Jangan gunakan `service_role` key di frontend.**

### 4. Buat tabel dan seed katalog

1. Di Supabase, buka **SQL Editor → New query**.
2. Buka file `supabase/schema.sql` dari VS Code.
3. Salin seluruh isi file tersebut ke SQL Editor, lalu jalankan.
4. Pastikan query selesai tanpa error. SQL membuat tabel, indeks, trigger profil, policy RLS, serta data katalog awal.

Jika ingin menjalankan ulang SQL, perhatikan bahwa kebijakan akan dibuat ulang dan seed otot aman dijalankan berulang. Seed gerakan menambahkan gerakan yang belum ada; ia tidak menghapus gerakan yang sudah ada.

### 5. Isi variabel environment

1. Duplikat `.env.example` dan beri nama `.env.local`.
2. Ganti placeholder dengan Project URL dan publishable/anon key dari project-mu:

```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

3. Jangan pernah memasukkan `service_role` key ke file `VITE_*`, source frontend, GitHub, atau screenshot publik.
4. Restart server Vite setelah mengubah environment.

### 6. Jalankan website

```bash
npm run dev
```

Terminal akan menampilkan alamat lokal (biasanya `http://localhost:5173`). Buka alamat tersebut di browser. Biarkan terminal tetap berjalan selama development.

### 7. Tes autentikasi dan alur utama

1. Buat akun dari halaman **Buat akun**.
2. Jika konfirmasi email aktif di Supabase, buka email dan konfirmasi dulu; setelah itu login.
3. Buka **Katalog otot**, pastikan katalog tampil.
4. Buka **Planner mingguan**, atur hari latihan/rest day, pilih gerakan, lalu simpan.
5. Buka **Catat latihan**, tambahkan gerakan, isi beban dan reps, lalu simpan.
6. Buka **Progres** untuk memeriksa apakah data dari sesi tadi tampil di grafik.
7. Buat akun kedua dan pastikan akun tersebut tidak dapat melihat data planner atau workout akun pertama. Ini penting untuk memeriksa RLS.

## Video latihan

- Isi kolom `video_url` pada tabel `exercises` dengan URL HTTPS yang kamu miliki hak untuk gunakan atau embed yang diizinkan.
- Isi `video_provider` dengan `youtube` untuk YouTube; aplikasi akan memakai domain embed `youtube-nocookie.com`.
- URL lain ditampilkan sebagai tautan eksternal. URL TikTok tidak otomatis di-embed; gunakan mekanisme resmi yang diizinkan oleh TikTok bila memang dibutuhkan.
- Jangan mengunduh atau mengunggah ulang video kreator lain tanpa izin/lisensi.
- Katalog seed sengaja tidak memasukkan URL video palsu.

Contoh SQL untuk menambahkan URL YouTube milikmu pada satu gerakan (ganti URL sesuai video yang benar-benar boleh digunakan):

```sql
update public.exercises
set video_url = 'https://www.youtube.com/watch?v=VIDEO_ID',
    video_provider = 'youtube'
where name = 'Bench Press';
```

## Perintah lain

```bash
npm run typecheck  # pemeriksaan TypeScript
npm run build      # build production
npm run preview    # preview hasil build (jalankan setelah build)
```

Build dan typecheck perlu dijalankan lokal setelah setup; status keberhasilannya belum dikonfirmasi pada saat ZIP ini dibuat.

## Struktur folder

```text
form-gym/
├── src/
│   ├── components/      # autentikasi dan navigasi
│   ├── lib/             # client Supabase, tipe, katalog fallback
│   ├── pages/           # ringkasan, katalog, planner, log, progres
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── supabase/
│   └── schema.sql       # skema, RLS, trigger, seed katalog
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Keamanan dan batasan yang perlu diketahui

- Browser hanya menggunakan Supabase publishable/anon key; akses data pengguna dibatasi dengan RLS.
- Data katalog bisa dibaca tanpa login. SQL ini tidak menyediakan panel admin/CMS untuk mengelola katalog; video atau gerakan baru dapat diatur melalui Supabase Dashboard atau ditambahkan ke project.
- Penyimpanan workout membuat sesi terlebih dahulu lalu menyimpan gerakan dan set. Untuk aplikasi produksi, pertimbangkan transaksi database/RPC agar kegagalan di tengah proses tidak meninggalkan sesi parsial.
- Grafik beban maksimum adalah ringkasan semua gerakan dalam satu sesi, bukan progres terpisah per gerakan. Interpretasikan sebagai metrik ringkas, bukan perbandingan kekuatan antar gerakan.
- Belum termasuk upload video ke Supabase Storage, password reset UI, penghapusan/edit sesi, dan panel admin.
- Ini bukan saran medis. Gunakan teknik aman dan pilih beban sesuai kemampuan.
- Jangan publikasikan `.env.local`.

## Troubleshooting

**Website menampilkan pesan Supabase belum dikonfigurasi**
- Pastikan `.env.local` berada di root project, nama variabel persis seperti contoh, dan server Vite sudah direstart.

**Login/daftar gagal**
- Periksa URL/key project, status Supabase, pengaturan konfirmasi email, dan pesan error yang ditampilkan aplikasi.

**Katalog online kosong**
- Pastikan `supabase/schema.sql` berhasil dijalankan dan tabel `muscle_groups` serta `exercises` memiliki data.

**Planner tidak bisa disimpan**
- Pastikan user login, schema telah dijalankan, dan cek error pada halaman. Periksa policy RLS di SQL Editor.

**Build gagal**
- Jalankan `npm install` kembali, lalu `npm run typecheck` dan `npm run build`; catat pesan error lengkap untuk debugging.

## Lisensi

Source starter ini disediakan untuk pembelajaran dan pengembangan proyek. Periksa lisensi serta izin aset/font/video pihak ketiga sebelum dipakai pada produk publik.
