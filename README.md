# BAJET VIRAL.MY — Affiliate Store

Aplikasi katalog affiliate 2-dalam-1: storefront awam + dashboard admin. Frontend HTML/CSS/JS, database dan storage menggunakan Supabase, hosting percuma melalui GitHub Pages.

## Fail projek
- `index.html` — paparan kedai dan dashboard.
- `style.css` — reka bentuk responsif.
- `app.js` — fungsi katalog, carian, login, CRUD dan upload gambar.
- `config.js` — URL projek dan anon/public key Supabase.
- `supabase-setup.sql` — jadual, RLS dan polisi storage.

## A. Sediakan Supabase
1. Buka https://supabase.com dan daftar akaun percuma.
2. Cipta projek baharu, pilih rantau terdekat yang tersedia. Simpan database password di tempat selamat.
3. Tunggu projek selesai disediakan.
4. Buka **SQL Editor > New query**.
5. Buka fail `supabase-setup.sql`, salin semua kandungan SQL utama dan Run. Baris arahan yang bermula `--` ialah komen; arahan kemas kini admin di hujung fail dijalankan kemudian.
6. Pergi ke **Project Settings > API** (atau bahagian API Keys). Salin **Project URL** dan **anon/public key**. Jangan salin `service_role` atau secret key.

## B. Cipta akaun admin dengan selamat
1. Di Supabase buka **Authentication > Users > Add user**.
2. Masukkan email anda dan kata laluan yang kuat. Cipta pengguna.
3. Buka **SQL Editor** dan jalankan arahan ini dengan email anda:
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'EMAIL_ANDA@example.com';
   ```
4. Pastikan satu baris dikemas kini. Jangan beri role admin kepada pengguna awam.
5. Jika ada pilihan pendaftaran awam, matikan **Allow new users to sign up** di Authentication > Settings. Admin dicipta secara manual sahaja.
6. Selepas menukar role, log keluar dan log masuk semula untuk mendapatkan token baharu.

## C. Sambungkan aplikasi
1. Buka `config.js`.
2. Gantikan:
   - `PASTE_SUPABASE_PROJECT_URL_HERE` dengan Project URL.
   - `PASTE_SUPABASE_ANON_PUBLIC_KEY_HERE` dengan anon/public key.
3. Simpan fail. Anon/public key boleh berada di frontend kerana polisi RLS mengehadkan akses. **Jangan sekali-kali letakkan service_role key di sini atau dalam GitHub.**

## D. Deploy percuma menggunakan GitHub
1. Log masuk ke https://github.com.
2. Tekan **New repository**.
3. Nama repo: `bajet-viral-my` dan pilih **Public** (GitHub Pages percuma untuk repo public).
4. Cipta repository.
5. Tekan **Add file > Upload files**.
6. Muat naik `index.html`, `style.css`, `app.js`, `config.js` dan folder/fail berkaitan. `README.md` dan `supabase-setup.sql` boleh turut dimuat naik.
7. Tekan **Commit changes**.
8. Pergi ke **Settings > Pages**.
9. Di **Build and deployment**, pilih **Deploy from a branch**.
10. Branch: `main`; folder: `/ (root)`; tekan **Save**.
11. Tunggu beberapa minit. URL biasanya `https://USERNAME.github.io/bajet-viral-my/`.

## E. Uji aplikasi
1. Buka URL GitHub Pages. Kedai awam patut muncul (kosong sehingga produk dimasukkan).
2. Tekan **Admin**, log masuk dengan email/kata laluan admin.
3. Tambah produk: nama, harga, kategori, platform, link affiliate, gambar (URL atau upload), penerangan.
4. Tekan **Simpan produk**. Produk aktif akan muncul di kedai awam.
5. Uji butang **BELI SEKARANG**. Ia membuka link affiliate di tab baharu.
6. Cuba buka laman dalam browser lain/incognito untuk mengesahkan paparan awam.

## Nota keselamatan dan operasi
- RLS mesti kekal aktif. Jangan buang polisi keselamatan.
- Jangan kongsi kata laluan admin. Jangan masukkan `service_role` key ke `config.js`.
- Pautan affiliate perlu menggunakan URL penuh `https://...`.
- Upload gambar menerima JPG, PNG atau WEBP sehingga 5MB.
- Produk yang tidak aktif disembunyikan daripada pelanggan tetapi masih boleh diurus admin.
- Jika mengubah `config.js`, commit perubahan ke GitHub dan tunggu Pages deploy semula.
- Ini versi asas: tiada checkout dalam aplikasi. Pembelian berlaku di Shopee/TikTok melalui pautan affiliate.
- GitHub Pages ialah hosting statik; Supabase menyediakan database, authentication dan storage. Pelan percuma mempunyai had penggunaan dan boleh berubah mengikut polisi penyedia.
