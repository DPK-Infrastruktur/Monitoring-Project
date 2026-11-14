# Monitoring Progress Project

Aplikasi web satu halaman untuk memantau progress proyek: rencana vs aktual, Kurva-S, deviasi, SPI, prediksi selesai, dan ekspor laporan. Tanpa framework, tanpa server, tanpa pustaka eksternal.

## Struktur
- `index.html`  : kerangka halaman (form, kartu ringkasan, grafik, tabel, jendela pratinjau). Logo SCBD tertanam (base64).
- `css/style.css` : tema (biru #02448e, merah #e33a41), mode terang/gelap.
- `js/app.js`   : seluruh logika program.

## Cara menjalankan
Buka `index.html` di browser (klik dua kali). Untuk dipasang sebagai website, unggah seluruh folder ini ke hosting statis (Netlify Drop, GitHub Pages, Cloudflare Pages, atau server sendiri).

## Penyimpanan data
Data tersimpan di `localStorage` browser (kunci `monproyek-v2`). Cadangan/pindah data: tombol "Cadangan (JSON)" dan "Impor cadangan".
Catatan: bila dijalankan di platform Claude Artifacts, data bersama memakai koleksi `proyek` (fitur db platform); di luar itu otomatis memakai localStorage saja.

## Bagian utama di js/app.js
- `sCurve(n)`           : membuat bobot mingguan rencana berbentuk Kurva-S (total 100%).
- `calc(p)`, `projData(p)`, `metrics(p)` : perhitungan minggu berjalan, kumulatif rencana/aktual, deviasi, SPI, rata-rata aktual, kebutuhan per minggu, prediksi selesai, nilai terealisasi.
- `status(dev,tol,ac)`  : status Lebih cepat / On schedule / Waspada / Terlambat / Selesai.
- `build()`, `update()`, `chart()`, `renderOv()` : tabel mingguan, kartu ringkasan, grafik Kurva-S (SVG), daftar proyek.
- `csvOf()`, `reportHtml()`, `svgFixed()`, `buildXlsx()`, `zipStore()` : ekspor CSV, laporan HTML, PNG Kurva-S, Excel (.xlsx dengan grafik bawaan, ZIP dibuat sendiri).
- `openPreview()`, `dlSave()`, `fallback()`, `autoDownload()` : pratinjau sebelum unduh dan penyimpanan file.
- `qp()`, `flush()`, `applyRemote()` : sinkronisasi data bersama (hanya aktif di Claude Artifacts).

## Aturan perhitungan
- Deviasi = aktual kumulatif - rencana kumulatif (poin persen).
- SPI = aktual kumulatif / rencana kumulatif.
- Status: >=0 On schedule / Lebih cepat; negatif dalam toleransi = Waspada; melewati toleransi = Terlambat; aktual 100% = Selesai.
- Total aktual dibatasi 100%; total rencana harus 100% (ada peringatan).
