<div align="center">

<img src="https://i.pinimg.com/1200x/bb/f8/68/bbf868dc073fe05bffdca5a4f044f887.jpg" width="100%" alt="BEN CODE Banner" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4a0000,50:dc143c,100:ff4757&height=120&section=header&text=BEN%20CODE&fontSize=48&fontColor=ffffff&animation=twinkling" width="100%" />

### Vector QR Code & Barcode Generator for After Effects

[![Release](https://img.shields.io/github/v/release/Marcycuteaf/BEN-CODE?style=for-the-badge&logo=github&color=dc143c&labelColor=4a0000)](https://github.com/Marcycuteaf/BEN-CODE/releases/latest)
[![Download ZXP](https://img.shields.io/badge/Download-ZXP-ff4757?style=for-the-badge&labelColor=8b0000)](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)
[![After Effects](https://img.shields.io/badge/After_Effects-2024%2B-ff4757?style=for-the-badge&logo=adobe&logoColor=white&labelColor=8b0000)](https://www.adobe.com/products/aftereffects.html)
[![CEP](https://img.shields.io/badge/CEP-Panel-dc143c?style=for-the-badge&labelColor=4a0000)](https://github.com/Adobe-CEP/CEP-Resources)

<br/>

Generate **true vector** QR codes and barcodes directly inside After Effects — native Shape Layers, infinitely scalable, zero quality loss.

<br/>

<img src="docs/preview.png" alt="BEN CODE panel preview" width="320" />

<br/>

[**Download Latest ZXP**](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp) · [**Release Notes**](https://github.com/Marcycuteaf/BEN-CODE/releases/latest)

</div>

---

## Features

| Category | Capabilities |
|----------|-------------|
| **QR Code** | Text / URL, error correction, module size, margin, **corner radius**, foreground & background colors |
| **QR Advanced** | Custom finder-eye styling (color + radius + Merge Paths cutout), central logo reserve area |
| **Barcodes** | Code 128 · Code 39 · **EAN-13** · **UPC-A** (auto check digit) |
| **Transform** | Proportional scale %, target-width dynamic sizing |
| **Output** | Native **Shape Layer** vectors — scale, recolor, and add effects freely in AE |

---

## Quick Install

> Use the `.zxp` from Releases — **no** PlayerDebugMode required.

1. Download [`BEN-CODE.zxp`](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)
2. Install with [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/) or Anastasiy's ZXP Installer
3. Restart After Effects → **Window ▸ Extensions ▸ BEN CODE — QR & Barcode**

<details>
<summary><b>Developer install (macOS)</b></summary>

```bash
git clone https://github.com/Marcycuteaf/BEN-CODE.git
cd BEN-CODE
chmod +x install-mac.sh && ./install-mac.sh
# Restart After Effects
```

</details>

---

## How It Works

A CEP extension split into two parts, connected via `evalScript`:

```
client/  ← Panel (HTML/CSS/JS): UI, live preview, geometry
   │  Writes rectangle list + styles to a JSON temp file
   ▼
host/host.jsx  ← ExtendScript: reads file, builds vector Shape Layer
```

- **QR**: `qrcode-generator` module matrix → each dark cell becomes a rounded `Rect` shape
- **Barcode**: custom Code 128 / Code 39 / EAN-13 / UPC-A encoder → consecutive bars merged into rectangles
- All shapes centered at origin → anchor at center → scaling stays proportional

---

## Project Structure

```
BEN-CODE/
├── CSXS/manifest.xml       # Extension manifest
├── client/                 # Panel UI (HTML/CSS/JS)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js         # Preview + generate
│       ├── geometry.js     # QR / barcode geometry
│       └── lib/            # CSInterface, qrcode, barcode
├── host/host.jsx           # ExtendScript layer builder
├── docs/preview.png        # Panel screenshot
├── install-mac.sh          # macOS dev install
└── package-mac.sh          # Build .zxp
```

---

## Usage

1. Open a composition in AE (or let the panel create 1920×1080 automatically)
2. Adjust settings in the panel with live preview
   - **QR Code**: content, error correction, module size, corner radius, finder eyes, logo slot
   - **Barcode**: data, symbology, bar width, height, colors
3. Set **Transform** (scale % or target width in px)
4. Click **Generate in After Effects**

---

## Developer Debug

`.debug` enables Chrome remote debugging. With the panel open in AE:

```
http://localhost:8088
```

---

## Notes

- Foreground shape limit: **6000** rectangles (performance)
- Code 128: even-length all-digit input uses Code C; otherwise Code B (ASCII 32–126)
- Code 39: supports `0-9 A-Z - . space $ / + %`
- EAN-13 / UPC-A: accepts N−1 digits and auto-fills check digit
- Third-party: `qrcode.js`, `CSInterface.js` — MIT license

---

## Build Release

```bash
./package-mac.sh    # → dist/BEN-CODE.zxp
```

---

<div align="center">

**Page Views**

<img src="https://mayu.due.moe/get/@Marcycuteaf.BEN-CODE?theme=asoul" alt="Page views" />

<br/><br/>

Made with ❤️ for After Effects · [Report an issue](https://github.com/Marcycuteaf/BEN-CODE/issues)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4a0000,50:dc143c,100:ff4757&height=80&section=footer" width="100%" />

</div>
