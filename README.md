# Asiye Özel - E-commerce Platform

Kadın elbiseleri için modern, full-stack e-ticaret platformu.

## 🛠️ Teknoloji Yığını

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool & dev server
- **React Router** - Routing
- **Axios** - HTTP client

## 📋 Gereksinimler

- Node.js (v18 veya üzeri)
- MongoDB (Local veya MongoDB Atlas)
- npm veya yarn

## 🚀 Kurulum

### 1. Backend Kurulumu

```bash
# Backend dizinine git
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle ve MongoDB bağlantı bilgilerini gir
# MONGODB_URI=mongodb://localhost:27017/asiyeozel

# Development server'ı başlat
npm run dev
```

Backend şu adreste çalışacak: `http://localhost:5000`

### 2. Frontend Kurulumu

```bash
# Frontend dizinine git
cd frontend

# Bağımlılıklar zaten yüklü (Vite tarafından)
# Eğer değilse: npm install

# .env dosyasını oluştur
cp .env.example .env

# Development server'ı başlat
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:5173`

## 📁 Proje Yapısı

```
asiyeozel/
├── backend/
│   ├── config/          # Konfigürasyon dosyaları
│   │   └── db.js        # MongoDB bağlantısı
│   ├── models/          # Mongoose modelleri (eklenecek)
│   ├── routes/          # API route'ları (eklenecek)
│   ├── controllers/     # Route controller'ları (eklenecek)
│   ├── middleware/      # Custom middleware'ler (eklenecek)
│   ├── .env             # Environment variables
│   ├── .env.example     # Environment template
│   ├── server.js        # Ana server dosyası
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  # React bileşenleri (eklenecek)
    │   ├── pages/       # Sayfa bileşenleri (eklenecek)
    │   ├── utils/       # Yardımcı fonksiyonlar
    │   │   └── api.js   # Axios instance
    │   ├── App.jsx      # Ana uygulama
    │   ├── main.jsx     # Entry point
    │   └── index.css    # Global stiller
    ├── .env             # Environment variables
    ├── .env.example     # Environment template
    ├── vite.config.js   # Vite konfigürasyonu
    └── package.json
```

## 🔌 API Endpoints

### Mevcut Endpoints

- `GET /api` - API status kontrolü
- `GET /api/health` - Health check

### Gelecek Endpoints (Planlanıyor)

- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/products` - Tüm ürünleri listele
- `GET /api/products/:id` - Tek ürün detayı
- `POST /api/products` - Yeni ürün ekle (Admin)
- `PUT /api/products/:id` - Ürün güncelle (Admin)
- `DELETE /api/products/:id` - Ürün sil (Admin)
- `POST /api/orders` - Sipariş oluştur
- `GET /api/orders` - Kullanıcı siparişleri

## 🎨 Design System

Frontend, modern ve premium bir görünüm için kapsamlı bir design system kullanıyor:

- **Renk Paleti**: Zarif ve feminen renkler
- **Tipografi**: Inter (body) & Playfair Display (headings)
- **Animasyonlar**: Smooth transitions ve hover effects
- **Responsive**: Mobile-first yaklaşım

## 🔒 Güvenlik

- JWT tabanlı authentication
- Bcrypt ile şifrelenmiş parolalar
- CORS koruması
- Environment variables ile hassas bilgilerin saklanması

## 📝 Sonraki Adımlar

1. ✅ Proje yapısı oluşturuldu
2. ✅ Backend ve Frontend kurulumu tamamlandı
3. ⏳ Database modelleri (Product, User, Order)
4. ⏳ Authentication sistemi
5. ⏳ Ürün yönetimi (CRUD)
6. ⏳ Alışveriş sepeti
7. ⏳ Sipariş sistemi
8. ⏳ Admin paneli
9. ⏳ Ödeme entegrasyonu

## 🤝 Katkıda Bulunma

Bu proje aktif geliştirme aşamasındadır.

## 📄 Lisans

Özel proje - Tüm hakları saklıdır.
