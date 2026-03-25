# SIKANDA - Sistem Informasi Kepegawaian dan Data SDM Kesehatan Terpadu

**Enterprise Government Standard - Tingkat Kementerian**

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-Google_Apps_Script-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Struktur File (Pemisahan JS, CSS, HTML)

```
Manajemen SDM Kesehatan/
├── index.html          # Struktur HTML
├── style.css           # Semua styling CSS  
├── app.js              # Logika JavaScript
├── Code.gs             # Google Apps Script Backend
├── README.md           # Dokumentasi
└── template.csv        # Template Google Sheet
```

## ⚡ Cara Installasi

### 1. Buat Google Sheet

Buka [Google Sheets](https://sheets.google.com) dan buat sheet baru dengan nama: **SIKANDA**

Buat sheet berikut:

#### Sheet 1: DATA_SDM
Header kolom (baris 1):
```
NIK,NIP,Nama,Jenis Kelamin,Agama,Unit Kerja,Jabatan,Status,Desa,Kecamatan,Foto,KTP,STR,Ijazah,Sertifikat,Status_Data
```

#### Sheet 2: USERS
Header kolom (baris 1):
```
Username,Password,Role,Unit Kerja,NIK
```

#### Sheet 3: PENGATURAN (Opsional)
Header kolom (baris 1):
```
Key,Value
```

**Catatan: Copy ID Spreadsheet dari URL**
Contoh: `https://docs.google.com/spreadsheets/d/1DqzAil28k7V9-Kp3cf70AUvexS-PuYiC5ieqV00ZCcc/edit`
ID-nya adalah: `1DqzAil28k7V9-Kp3cf70AUvexS-PuYiC5ieqV00ZCcc`

### 2. Deploy Google Apps Script

1. Buka Google Sheet → Extensions → Apps Script
2. Hapus kode default dan copy isi file **Code.gs**
3. Edit konfigurasi di bagian atas:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';
   ```
4. Klik **Deploy** → **New deployment**
5. Select type: **Web app**
6. Execute as: **Me**
7. Who has access: **Anyone**
8. Klik **Deploy** dan copy URL Web App

### 3. Setup Frontend

1. Edit file **app.js**
2. Cari bagian CONFIG dan ganti API_URL:
   ```javascript
   const CONFIG = {
     API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     // ...
   };
   ```

### 4. Testing

1. Buka URL Web App
2. Login dengan default admin:
   - Username: `admin`
   - Password: `admin123`
3. Tambahkan data dummy untuk testing

## 🎯 Fitur Utama

### Akses Publik (Tanpa Login)
- **Dashboard** - Statistik real-time, grafik interaktif, peta sebaran
- **Data SDM** - Tabel data (read-only, tanpa NIK/NIP sensitif)
- **Profil** - Cek profil SDM melalui NIK
- **Form Biodata** - Submit data baru (status pending - perlu verifikasi admin)

### Akses Admin (Login)
- **Panel Admin** - CRUD data SDM lengkap
- **Verifikasi Data** - Setuju/tolak data masuk
- **Manajemen User** - Kelola user admin (Administrator/Operator)
- **Laporan** - Export CSV, Print

## 📊 Menu Aplikasi

| Menu | Akses | Deskripsi |
|------|--------|-----------|
| Dashboard | Publik | 6 Card + 4 Grafik + Peta |
| Data SDM | Publik | Tabel read-only |
| Profil | Publik | Cek via NIK |
| Form Biodata | Publik | Submit data baru |
| Panel Admin | Admin | Kelola data lengkap |
| Laporan | Admin | Export & Print |
| Pengaturan | Admin | Konfigurasi sistem |

## ⚡ Fitur Enterprise

- ✅ Loading skeleton dengan animasi
- ✅ Cache 5 menit untuk performa
- ✅ Error handling dengan fallback data
- ✅ Dark mode toggle
- ✅ Animasi counter stats
- ✅ Responsive design (mobile-friendly)
- ✅ Role-based access (Admin/Operator)
- ✅ Chart.js untuk visualisasi
- ✅ Modal popup interaktif
- ✅ Toast notifications
- ✅ Search & Filter real-time
- ✅ Pagination data
- ✅ Export CSV

## 🔐 Keamanan

- Input validation di server-side
- Role-based access control
- Session management
- Password tidak disimpan di frontend (otentikasi via API)
- Status data (aktif/pending) untuk verifikasi

## 🔗 API Reference

### Public APIs
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `?action=test` | GET | Test koneksi API |
| `?action=getDashboardData` | GET | Data dashboard & statistik |
| `?action=getPublicData` | GET | Data SDM (tanpa NIK sensitif) |
| `?action=getByNIK` | GET | Cari profil via NIK |
| `?action=checkNik` | GET | Cek NIK duplikat |
| `?action=submitBiodata` | POST | Submit data baru |

### Admin APIs
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `?action=loginAdmin` | POST | Login admin |
| `?action=getAllDataAdmin` | GET | Semua data (termasuk NIK) |
| `?action=addData` | POST | Tambah data |
| `?action=updateData` | POST | Update data |
| `?action=deleteData` | POST | Hapus data |
| `?action=verifyData` | POST | Verifikasi data |
| `?action=getUsers` | GET | List user |
| `?action=addUser` | POST | Tambah user |
| `?action=deleteUser` | POST | Hapus user |

### Additional APIs
| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `?action=getFilterOptions` | GET | Filter options |
| `?action=getAnalisisSDM` | GET | Analisis SDM & planning |
| `?action=saveSettings` | POST | Simpan pengaturan |
| `?action=getSettings` | GET | Ambil pengaturan |

## 👥 Role User

| Role | Akses |
|------|--------|
| Administrator | Full akses, semua unit kerja |
| Operator | Sesuai unit kerja saja |

## 🎨 Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Storage**: Google Drive
- **Charts**: Chart.js
- **Icons**: Font Awesome 6

## 📱 Responsive Breakpoints

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🔧 Troubleshooting

### Error: "Sheet tidak ditemukan"
- Pastikan nama sheet sesuai (DATA_SDM, USERS)
- Cek Spreadsheet ID benar

### Error: "Server error"
- Check deployment Apps Script
- Pastikan "Execute as" = Me
- Pastikan "Who has access" = Anyone

### Data tidak muncul
- Cek header kolom sesuai template
- Pastikan ada data di sheet
- Cek filter options

## 📄 Lisensi

MIT License - Free for use

## 👨‍💻 Developer

SiKANDA - Enterprise SDM Health Management System

---

**Catatan**: Untuk penggunaan produksi, disarankan:
1. Ganti password default admin
2. Gunakan HTTPS
3. Backup data secara berkala
4. Atur izin Google Drive dengan benar
