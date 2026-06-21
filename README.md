<div align="center">

# BEN CODE

**After Effects 向量 QR Code & 條碼產生器**

[![Release](https://img.shields.io/github/v/release/Marcycuteaf/BEN-CODE?style=for-the-badge&logo=github&color=e94560)](https://github.com/Marcycuteaf/BEN-CODE/releases/latest)
[![Download ZXP](https://img.shields.io/badge/⬇_Download-ZXP-0f3460?style=for-the-badge)](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)
[![After Effects](https://img.shields.io/badge/After_Effects-2024%2B-9999FF?style=for-the-badge&logo=adobe&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![CEP](https://img.shields.io/badge/CEP-Panel-5319E7?style=for-the-badge)](https://github.com/Adobe-CEP/CEP-Resources)
[![License](https://img.shields.io/badge/License-MIT-24292f?style=for-the-badge)](LICENSE)

<br/>

在 After Effects 內，用直覺的面板產生**向量** QR Code 與條碼（原生 Shape Layer，可無損縮放）

<br/>

<img src="docs/preview.png" alt="BEN CODE 面板預覽" width="320" />

<br/>

[**⬇ 下載最新版 ZXP**](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp) · [**Release 說明**](https://github.com/Marcycuteaf/BEN-CODE/releases/latest)

</div>

---

## 功能一覽

| 類別 | 功能 |
|------|------|
| **QR Code** | 文字/網址、容錯等級、模組大小、邊距、**圓角**、前景/背景色 |
| **QR 進階** | 定位點獨立樣式（顏色 + 圓角 + Merge Paths 鏤空）、中央 Logo 預留區 |
| **條碼** | Code 128 · Code 39 · **EAN-13** · **UPC-A**（自動校驗碼） |
| **Transform** | 等比縮放 %、目標寬度動態尺寸 |
| **輸出** | 原生 **Shape Layer** 向量圖形，可任意縮放不失真 |

---

## 快速安裝

> 推薦使用 Release 頁面的 `.zxp`，**不需**開啟 PlayerDebugMode。

1. 下載 [`BEN-CODE.zxp`](https://github.com/Marcycuteaf/BEN-CODE/releases/latest/download/BEN-CODE.zxp)
2. 用 [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/) 或 Anastasiy's ZXP Installer 安裝
3. 重啟 After Effects → **Window ▸ Extensions ▸ BEN CODE — QR & Barcode**

<details>
<summary><b>開發者模式安裝（macOS）</b></summary>

```bash
git clone https://github.com/Marcycuteaf/BEN-CODE.git
cd BEN-CODE
chmod +x install-mac.sh && ./install-mac.sh
# 重啟 After Effects
```

</details>

---

## 運作原理

CEP 擴充功能分成兩半，透過 `evalScript` 溝通：

```
client/  ← 面板 (HTML/CSS/JS)：UI、即時預覽、計算幾何
   │  把「矩形清單 + 樣式」寫成 JSON 暫存檔
   ▼
host/host.jsx  ← ExtendScript：讀檔後建立向量 Shape Layer
```

- **QR**：`qrcode-generator` 算出模組矩陣 → 每個黑點是可圓角的 `Rect` 圖形
- **條碼**：自製 Code 128 / Code 39 / EAN-13 / UPC-A 編碼器 → 連續黑條合併成矩形
- 所有矩形以「內容中心」為原點，圖層錨點在中心 → 縮放永遠等比、置中

---

## 檔案結構

```
BEN-CODE/
├── CSXS/manifest.xml       # 擴充功能定義
├── client/                 # 面板 UI (HTML/CSS/JS)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js         # 預覽 + 產生
│       ├── geometry.js     # 幾何建構（QR / 條碼）
│       └── lib/            # CSInterface, qrcode, barcode
├── host/host.jsx           # ExtendScript：建立向量圖層
├── docs/preview.png        # 面板截圖
├── install-mac.sh          # macOS 開發安裝
└── package-mac.sh          # 打包 .zxp
```

---

## 使用方式

1. 在 AE 開一個合成（若無，擴充功能會自動建立 1920×1080）
2. 在面板即時預覽，調整參數
   - **QR Code**：內容、容錯、模組大小、圓角、定位點樣式、Logo 預留
   - **條碼**：資料、類型、條寬、高度、顏色
3. 設定 **Transform**（縮放 % 或目標寬度 px）
4. 按 **「在 After Effects 中產生」**

---

## 開發者除錯

`.debug` 已設定 Chrome 遠端除錯 port。AE 開著面板時：

```
http://localhost:8088
```

---

## 注意事項

- 前景矩形上限 **6000** 個，避免 AE 建立過慢
- Code 128：偶數位全數字自動用 Code C；其餘用 Code B（ASCII 32~126）
- Code 39：支援 `0-9 A-Z - . 空格 $ / + %`
- EAN-13 / UPC-A：可輸入少一位，自動補校驗碼
- 第三方授權：`qrcode.js`、`CSInterface.js` — MIT

---

## 打包發佈

```bash
./package-mac.sh    # 產出 dist/BEN-CODE.zxp
```

---

<div align="center">

Made with ❤️ for After Effects · [回報問題](https://github.com/Marcycuteaf/BEN-CODE/issues)

</div>
