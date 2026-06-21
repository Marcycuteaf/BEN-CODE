#!/usr/bin/env bash
# BEN CODE — macOS 安裝腳本
# 1) 對 CSXS 9~12 開啟 PlayerDebugMode
# 2) 在使用者 CEP extensions 資料夾建立符號連結
set -e

SRC="$(cd "$(dirname "$0")" && pwd)"
EXT_ID="com.bencode.qrbarcode"
DEST_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$DEST_DIR/$EXT_ID"

echo "==> 開啟 PlayerDebugMode (CSXS 9~12)"
for v in 9 10 11 12; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 || true
done

echo "==> 建立擴充功能連結"
mkdir -p "$DEST_DIR"
if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  echo "    已存在，先移除舊連結：$DEST"
  rm -rf "$DEST"
fi
ln -s "$SRC" "$DEST"

echo ""
echo "完成！來源：$SRC"
echo "連結：$DEST"
echo ""
echo "請重新啟動 After Effects，然後開啟："
echo "  Window ▸ Extensions ▸ BEN CODE — QR & Barcode"
