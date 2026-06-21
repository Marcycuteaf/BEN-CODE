# BEN CODE

After Effects CEP 擴充功能 — 在 AE 內產生**向量** QR Code 與條碼（Shape Layer，可無損縮放）。

**[下載最新版 ZXP](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)** · After Effects 2019–2025+ · macOS / Windows

<p align="center">
  <img src="docs/preview.png" alt="BEN CODE 面板" width="320">
</p>

---

## 功能

- **QR Code** — 文字/網址、容錯等級、模組大小、邊距、圓角、前景/背景色
- **QR 進階** — 定位點獨立樣式（顏色、圓角、Merge Paths 鏤空）、中央 Logo 預留區
- **條碼** — Code 128、Code 39、EAN-13、UPC-A（自動校驗碼）
- **Transform** — 等比縮放 %、目標寬度動態尺寸
- **輸出** — 原生 Shape Layer 向量圖形

---

## 安裝

1. 下載 [`BEN-CODE.zxp`](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)
2. 用 [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/) 安裝
3. 重啟 After Effects
4. 開啟 **Window → Extensions → BEN CODE — QR & Barcode**

<details>
<summary>開發者安裝（macOS）</summary>

```bash
git clone https://github.com/Marcycuteaf/BEN-CODE.git
cd BEN-CODE
chmod +x install-mac.sh && ./install-mac.sh
```

重啟 After Effects 後即可使用。需開啟 PlayerDebugMode。

</details>

---

## 使用方式

1. 在 AE 開啟或建立一個合成
2. 在面板輸入內容、調整 QR / 條碼參數（即時預覽）
3. 設定 Transform（縮放 % 或目標寬度）
4. 按 **「在 After Effects 中產生」**

產生結果為向量 Shape Layer，可在 AE 內任意縮放、改色、加效果。

---

## 專案結構

```
BEN-CODE/
├── CSXS/manifest.xml    # 擴充功能定義
├── client/              # 面板 UI（HTML / CSS / JS）
├── host/host.jsx        # ExtendScript：建立向量圖層
├── install-mac.sh       # macOS 開發安裝
└── package-mac.sh       # 打包 .zxp
```

---

## 打包

```bash
./package-mac.sh    # → dist/BEN-CODE.zxp
```

---

## 授權

第三方：`qrcode.js`、`CSInterface.js` — MIT

<sub>Bundle ID `com.bencode.qrbarcode`</sub>
