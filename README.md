# BEN CODE — After Effects QR Code & 條碼產生器 (CEP 擴充功能)

在 After Effects 內，用直覺的面板產生**向量** QR Code 與條碼（真正的 Shape Layer，可無損縮放）。

- **QR Code**：內容/網址、容錯等級、模組大小、邊距、**圓角**、前景/背景色、背景圖層。
  - **定位點獨立樣式**：3 個「眼睛」可獨立設定顏色與圓角，外環以 Merge Paths 鏤空（真透明）。
  - **中央預留區 + Logo**：自動於中央留白，並可選擇圖檔由 ExtendScript 匯入、置中縮放。
- **條碼 Barcode**：Code 128 / Code 39 / **EAN-13** / **UPC-A**、**長度依資料自動調整**、條寬、高度、寬窄比、顏色、背景。
  - EAN-13 / UPC-A 會自動計算並補上**校驗碼**。
- **Transform**：等比縮放（縮放 %）與**目標寬度**動態尺寸（自動換算等比縮放）。
- 產生結果為原生 **Shape Layer**（向量），可在 AE 內任意縮放、改色、加效果。

---

## 一、運作原理（架構）

CEP 擴充功能分成兩半，透過 `evalScript` 溝通：

```
client/  ← 面板 (HTML/CSS/JS，CEF/Chromium)：UI、即時預覽、計算幾何
   │  把「矩形清單 + 樣式」寫成 JSON 暫存檔
   ▼
host/host.jsx  ← ExtendScript (AE 主程式)：讀檔後建立向量 Shape Layer
```

- **QR**：用 `qrcode-generator` 算出模組矩陣 → 每個黑點是一個（可圓角的）`Rect` 圖形。
- **條碼**：`client/js/lib/barcode.js` 自製的 Code 128 / Code 39 編碼器算出位元字串 → 連續黑條合併成矩形。
- 所有矩形以「內容中心」為原點排列，圖層錨點設在中心，因此縮放永遠等比、置中。

---

## 二、檔案結構

```
BEN-CODE/
├── CSXS/
│   └── manifest.xml         # 擴充功能定義 (ID、支援版本、面板大小)
├── client/
│   ├── index.html           # 面板 UI
│   ├── css/style.css
│   └── js/
│       ├── main.js          # 主程式：預覽 + 產生
│       └── lib/
│           ├── CSInterface.js  # Adobe 官方 CEP 介面
│           ├── qrcode.js       # QR 產生器 (kazuhikoarase, MIT)
│           └── barcode.js      # 自製 Code128 / Code39 編碼器
├── host/
│   └── host.jsx             # ExtendScript：在 AE 建立向量圖層
├── .debug                   # 開發除錯設定 (固定 port 8088)
├── install-mac.sh           # macOS 一鍵安裝 (開啟除錯模式 + 連結)
└── README.md
```

---

## 三、安裝（開發/測試）

> 因為這是「未簽章」的擴充功能，必須先開啟 **PlayerDebugMode**，AE 才會載入。

### macOS — 一鍵安裝

```bash
cd ~/Downloads/BEN-CODE
chmod +x install-mac.sh
./install-mac.sh
```

它會：
1. 對 CSXS 9~12 開啟 `PlayerDebugMode`。
2. 在 `~/Library/Application Support/Adobe/CEP/extensions/` 建立指向本資料夾的符號連結。

完成後**重新啟動 After Effects**。

### macOS — 手動

```bash
# 1) 開啟除錯模式 (依你的 AE 版本，CSXS 版本可能不同，全開最保險)
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9  PlayerDebugMode 1

# 2) 連結（或複製）到使用者擴充功能資料夾
ln -s "$(pwd)" "$HOME/Library/Application Support/Adobe/CEP/extensions/com.bencode.qrbarcode"
```

### Windows — 手動

1. 開啟「登錄編輯程式 (regedit)」，在以下路徑新增字串值（依 AE 版本選 CSXS 版本，建議都加）：
   - `HKEY_CURRENT_USER\Software\Adobe\CSXS.12`（以及 .11 / .10 / .9）
   - 新增字串值 `PlayerDebugMode`，數值資料 `1`
2. 把整個 `BEN-CODE` 資料夾複製到：
   - `C:\Users\<你>\AppData\Roaming\Adobe\CEP\extensions\com.bencode.qrbarcode`

### 開啟面板

重啟 AE 後：**選單 Window ▸ Extensions ▸ BEN CODE — QR & Barcode**。

---

## 四、使用方式

1. 在 AE 開一個合成（Composition）；若沒有，擴充功能會自動建立 1920×1080。
2. 在面板上半部即時預覽，調整參數。
   - **QR Code 分頁**：輸入網址/文字、選容錯等級、調模組大小與圓角、選顏色。
   - **條碼分頁**：輸入資料、選 Code 128 或 Code 39、調條寬/高度/顏色。長度會依資料自動變長。
3. 設定 **Transform**：
   - 「縮放 %」：直接套用到圖層 Scale。
   - 「目標寬度 (px)」：填非 0 時，會**優先**換算成等比縮放，讓成品寬度等於該值。
4. 按 **「在 After Effects 中產生」** → 在目前合成新增一個向量 Shape Layer。

> 產生後仍是純向量，可在 AE 內繼續縮放、改 Fill 顏色、套用效果，完全不失真。

---

## 五、除錯（開發者）

`.debug` 已設定 Chrome 遠端除錯 port。AE 開著面板時，用 Chrome 開：

```
http://localhost:8088
```

即可看到面板的 Console / DOM，方便除錯 `main.js`。

---

## 六、注意事項與限制

- **模組數量上限**：面板限制前景矩形 ≤ 6000 個，避免 AE 建立過慢。QR 內容很長或模組很小時請調整。
- **Code 128**：全為偶數位數字時自動用 Code C（較短）；其餘用 Code B（可列印 ASCII 32~126）。
- **Code 39**：支援 `0-9 A-Z - . 空格 $ / + %`，長度彈性，含起訖 `*`。
- 第三方授權：`qrcode.js` 與 `CSInterface.js` 皆為 MIT 授權。

---

## 七、（選用）打包成 ZXP 發佈

已附上打包腳本 `package-mac.sh`（使用 Adobe 官方 `ZXPSignCmd`）：

```bash
cd ~/Downloads/BEN-CODE
./package-mac.sh          # 產出 dist/BEN-CODE.zxp（自簽章）
```

把 `dist/BEN-CODE.zxp` 交給使用者，用 [ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/)（或 `anastasiy's ZXPInstaller`）安裝即可，**不需開 PlayerDebugMode**。

> 註：`tools/`（簽章工具與憑證）、`dist/`（輸出）已列入 `.gitignore`，不進版控。
> 自簽章的 `.zxp` 安裝時可能出現「未受信任憑證」提示，屬正常；要正式發佈需向 CA 申請程式碼簽章憑證。
