# 📖 WaqfTech KV-Quran API

A lightweight, high-performance Cloudflare Worker API that serves the complete Holy Quran from a Cloudflare KV namespace. Built specifically for the **WaqfTech** ecosystem to power apps like the bilingual Markdown Editor, Manara, and other Islamic technology initiatives.

---

## 🚀 Quick Start (Local Development)

This project uses the **`aube`** package manager toolchain. Ensure you have `aube` installed on your machine.

### 1. Install Dependencies
```bash
aube install
```

### 2. Run Local Development Server
To run locally using the simulated local KV state (synced with the production Quran dataset):
```bash
aube run dev --port 8787
```

### 3. Run Development Server Against Live Cloudflare KV
To test the API locally but pull actual verses live from the remote Cloudflare KV database (on the WaqfTech account):
```bash
CLOUDFLARE_ACCOUNT_ID=f1e7c7c68165026fbc0f205ffba26463 aubx wrangler dev --remote --port 8787
```

---

## 🆙 Deployment

To deploy this API directly to your Cloudflare Workers global edge network:
```bash
CLOUDFLARE_ACCOUNT_ID=f1e7c7c68165026fbc0f205ffba26463 aube run deploy
```

---

## 🔌 API Endpoints & Documentation

All responses are returned as formatted UTF-8 JSON with **CORS enabled** (`Access-Control-Allow-Origin: *`) for browser compatibility.

### 1. Root / Metadata
* **Endpoint:** `GET /`
* **Description:** Returns API details, source code links, and available endpoints.
* **Cache-Control:** `public, max-age=3600` (1 hour)

---

### 2. Get All Surahs Metadata
* **Endpoint:** `GET /api/surahs`
* **Description:** Instantly returns complete metadata (Arabic Name, English Name, Verse Count, Revelation Type) for all 114 Surahs without hitting KV.
* **Cache-Control:** `public, max-age=86400, immutable` (24 hours, immutable)
* **Response Example:**
```json
{
  "surahs": [
    {
      "number": 1,
      "name": "الفاتحة",
      "englishName": "Al-Fatihah",
      "englishNameTranslation": "The Opening",
      "numberOfAyahs": 7,
      "revelationType": "Meccan"
    },
    ...
  ],
  "total_surahs": 114
}
```

---

### 3. Get Specific Verse (Ayah)
* **Endpoint:** `GET /api/ayah/:surah/:ayah` (e.g., `/api/ayah/1/1`)
* **Description:** Retrieves the Arabic text of a single verse by Surah and Ayah number with strict index boundary checks.
* **Cache-Control:** `public, max-age=31536000, immutable` (1 year, immutable)
* **Response Example:**
```json
{
  "surah": {
    "number": 1,
    "name": "الفاتحة",
    "englishName": "Al-Fatihah",
    "englishNameTranslation": "The Opening"
  },
  "ayah": 1,
  "text": "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
  "key": "1:1"
}
```

---

### 4. Get Entire Surah
* **Endpoint:** `GET /api/surah/:surah` (e.g., `/api/surah/1`)
* **Description:** Queries KV for all keys under the Surah's prefix, fetches the verses concurrently via parallel subrequests (`Promise.all`), and returns them sorted numerically.
* **Cache-Control:** `public, max-age=31536000, immutable` (1 year, immutable)
* **Response Example:**
```json
{
  "surah": {
    "number": 1,
    "name": "الفاتحة",
    "englishName": "Al-Fatihah",
    "englishNameTranslation": "The Opening",
    "numberOfAyahs": 7,
    "revelationType": "Meccan"
  },
  "verses": [
    {
      "ayah": 1,
      "text": "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ"
    },
    {
      "ayah": 2,
      "text": "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ"
    },
    ...
  ],
  "total_verses": 7
}
```

---

## ⚡ Performance & Caching

The Holy Quran text is static and unchangeable. To maximize API performance and completely eliminate unnecessary Cloudflare KV read operation fees, **aggressive caching is built into this Worker**:
- **Surahs list** is cached for **24 hours**.
- **Individual Ayahs** and **Complete Surahs** are served with `Cache-Control: public, max-age=31536000, immutable` (1 year, immutable cache).
- Subsequent client or browser calls will instantly load the data from edge caches (0ms KV latency).

---

## ⚖️ License

Distributed under the **WaqfDPL-Isnad-1.0** (Waqf Digital Public License with Isnad) license. See the root of the repository for full license details.
