# PDF QR Studio — Non-Expiring PDF QR Code System

A modern, high-performance web system built with React & Vite for uploading single or multiple PDF documents and generating permanent, non-expiring QR codes.

---

## 🚀 Key Features

- **Multi-File PDF Upload**: Drag & drop one or multiple PDFs at once with individual upload progress bars.
- **Permanent, Non-Expiring Links**: Connects directly to free Supabase Cloud Storage (public bucket) to ensure QR codes work from any smartphone, camera, or network worldwide without ever expiring.
- **Instant Demo Mode**: Test and preview QR codes immediately without setup using the built-in sample generator.
- **Customizable QR Codes**:
  - Live color palette (Dark Slate, Electric Indigo, Emerald, Navy, Crimson, or custom hex).
  - High error-correction level (**Level H - 30% recovery**), ensuring physical prints remain scannable even if smudged or scratched.
  - Center PDF brand icon badge (toggleable).
- **Multiple Export Formats**:
  - **PNG (Ultra HD)**: Up to 2048x2048 crisp raster image.
  - **SVG**: Lossless vector format for print shops and merchandise.
  - **Batch ZIP Download**: Export all generated QR codes into a single organized ZIP package.
  - **A4 Printable Sticker Sheet**: Formats all or selected QR codes into a print-ready grid with titles and scan instructions (`window.print()`).
- **Interactive PDF Viewer**: Embedded modal preview for any uploaded document.
- **Persistent History**: Keeps records in your browser storage so you never lose your QR codes.

---

## 🛠️ How to Run Locally

The project is located in `D:\qr-pdf-system`:

```bash
cd D:\qr-pdf-system
npm install
npm run dev
```

Open the displayed localhost URL (e.g. `http://localhost:5173/`) in your browser.

---

## ☁️ 2-Minute Supabase Cloud Setup (For Worldwide Non-Expiring Links)

1. Create a free account at [supabase.com](https://supabase.com) (includes 1GB free storage, ~5,000 PDFs).
2. Create a new project.
3. In the left menu, click **Storage** > **New bucket** > Name it `pdfs` > Check **Public bucket**.
4. Go to **Project Settings** > **API**:
   - Copy **Project URL** (e.g. `https://xyz.supabase.co`)
   - Copy **anon public key**
5. In the PDF QR Studio interface, click **Cloud Setup** in the top bar, paste your credentials, and click **Test Connection** & **Save**.

Your QR codes will now be permanently hosted and accessible worldwide!
