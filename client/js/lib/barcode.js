/*
 * BEN CODE — 輕量條碼編碼器 (Code 128 / Code 39)
 * 回傳值：{ bits: "1010...", text: "原始資料" }
 *   bits 為「模組位元字串」，'1' = 黑條 (bar)，'0' = 空白 (space)，每個字元寬 1 模組。
 * 不依賴任何外部套件，方便在 CEP / 離線環境使用。
 */
(function (global) {
  'use strict';

  // ---- Code 128 標準圖樣表 (index 0..106) ----
  var C128 = [
    '11011001100','11001101100','11001100110','10010011000','10010001100',
    '10001001100','10011001000','10011000100','10001100100','11001001000',
    '11001000100','11000100100','10110011100','10011011100','10011001110',
    '10111001100','10011101100','10011100110','11001110010','11001011100',
    '11001001110','11011100100','11001110100','11101101110','11101001100',
    '11100101100','11100100110','11101100100','11100110100','11100110010',
    '11011011000','11011000110','11000110110','10100011000','10001011000',
    '10001000110','10110001000','10001101000','10001100010','11010001000',
    '11000101000','11000100010','10110111000','10110001110','10001101110',
    '10111011000','10111000110','10001110110','11101110110','11010001110',
    '11000101110','11011101000','11011100010','11011101110','11101011000',
    '11101000110','11100010110','11101101000','11101100010','11100011010',
    '11101111010','11001000010','11110001010','10100110000','10100001100',
    '10010110000','10010000110','10000101100','10000100110','10110010000',
    '10110000100','10011010000','10011000010','10000110100','10000110010',
    '11000010010','11001010000','11110111010','11000010100','10001111010',
    '10100111100','10010111100','10010011110','10111100100','10011110100',
    '10011110010','11110100100','11110010100','11110010010','11011011110',
    '11011110110','11110110110','10101111000','10100011110','10001011110',
    '10111101000','10111100010','11110101000','11110100010','10111011110',
    '10111101110','11101011110','11110101110','11010000100','11010010000',
    '11010011100','1100011101011'
  ];
  var C128_STARTB = 104, C128_STARTC = 105, C128_STOP = 106;

  function code128(data) {
    if (data == null || data.length === 0) {
      throw new Error('Code 128：資料不可為空');
    }
    var codes = [];
    var allDigits = /^[0-9]+$/.test(data);

    if (allDigits && data.length % 2 === 0) {
      // 全為偶數位數字 → 使用 Code C (較短)
      codes.push(C128_STARTC);
      for (var i = 0; i < data.length; i += 2) {
        codes.push(parseInt(data.substr(i, 2), 10));
      }
    } else {
      // 其他情況 → 使用 Code B (可列印 ASCII 32~126)
      codes.push(C128_STARTB);
      for (var j = 0; j < data.length; j++) {
        var c = data.charCodeAt(j);
        if (c < 32 || c > 126) {
          throw new Error('Code 128B 僅支援可列印 ASCII 字元 (32~126)');
        }
        codes.push(c - 32);
      }
    }

    // 校驗碼：起始值 + Σ(值 × 位置)，位置由 1 起算，再 mod 103
    var sum = codes[0];
    for (var k = 1; k < codes.length; k++) {
      sum += codes[k] * k;
    }
    codes.push(sum % 103);
    codes.push(C128_STOP);

    var bits = '';
    for (var m = 0; m < codes.length; m++) {
      bits += C128[codes[m]];
    }
    return { bits: bits, text: data };
  }

  // ---- Code 39 圖樣表 (每字元 9 元素：B S B S B S B S B) ----
  var C39 = {
    '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn',
    '4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw',
    '8':'wnnwnnwnn','9':'nnwwnnwnn','A':'wnnnnwnnw','B':'nnwnnwnnw',
    'C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn',
    'G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
    'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww',
    'O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn',
    'S':'nnwnnnwwn','T':'nnnnwnwwn','U':'wwnnnnnnw','V':'nwwnnnnnw',
    'W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn',
    '-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn',
    '$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn'
  };

  function code39(dataRaw, wideRatio) {
    var ratio = Math.max(2, Math.round(wideRatio || 3));
    var data = String(dataRaw).toUpperCase();
    var full = '*' + data + '*';
    var bits = '';
    for (var k = 0; k < full.length; k++) {
      var ch = full[k];
      var pat = C39[ch];
      if (!pat) {
        throw new Error('Code 39 不支援的字元: "' + ch + '" (僅支援 0-9 A-Z - . 空格 $ / + %)');
      }
      for (var i = 0; i < 9; i++) {
        var w = pat.charAt(i) === 'w' ? ratio : 1;
        var isBar = (i % 2 === 0); // 0,2,4,6,8 為黑條
        for (var r = 0; r < w; r++) bits += (isBar ? '1' : '0');
      }
      if (k < full.length - 1) bits += '0'; // 字元間窄空白
    }
    return { bits: bits, text: dataRaw };
  }

  // ---- EAN-13 / UPC-A ----
  // L / G / R 7-module 圖樣 ('1' = 黑條)
  var EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  var EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  var EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  // 首位數決定左側 6 碼的奇偶 (L=偶校驗碼 / G=奇校驗碼) 排列
  var EAN_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

  function eanCheckDigit(digits12) {
    var sum = 0;
    for (var i = 0; i < 12; i++) {
      var d = digits12.charCodeAt(i) - 48;
      sum += (i % 2 === 0) ? d : d * 3; // 由左起權重 1,3,1,3...
    }
    return (10 - (sum % 10)) % 10;
  }

  function ean13(dataRaw) {
    var s = String(dataRaw).replace(/\s+/g, '');
    if (!/^\d+$/.test(s)) throw new Error('EAN-13 僅接受數字');
    if (s.length === 12) {
      s = s + eanCheckDigit(s); // 自動補校驗碼
    } else if (s.length === 13) {
      if (eanCheckDigit(s.substr(0, 12)) !== (s.charCodeAt(12) - 48)) {
        throw new Error('EAN-13 校驗碼錯誤 (第 13 碼應為 ' + eanCheckDigit(s.substr(0, 12)) + ')');
      }
    } else {
      throw new Error('EAN-13 需 12 碼 (自動補碼) 或 13 碼');
    }

    var first = s.charCodeAt(0) - 48;
    var parity = EAN_PARITY[first];
    var bits = '101'; // 起始護線
    for (var i = 1; i <= 6; i++) {
      var d = s.charCodeAt(i) - 48;
      bits += (parity.charAt(i - 1) === 'L') ? EAN_L[d] : EAN_G[d];
    }
    bits += '01010'; // 中央護線
    for (var j = 7; j <= 12; j++) {
      bits += EAN_R[s.charCodeAt(j) - 48];
    }
    bits += '101'; // 結束護線
    return { bits: bits, text: s };
  }

  function upcA(dataRaw) {
    var s = String(dataRaw).replace(/\s+/g, '');
    if (!/^\d+$/.test(s)) throw new Error('UPC-A 僅接受數字');
    // UPC-A = EAN-13 前面補 0；接受 11 碼(補校驗碼) 或 12 碼
    if (s.length === 11 || s.length === 12) {
      var r = ean13('0' + s);
      return { bits: r.bits, text: r.text.substr(1) }; // 顯示時去掉前導 0
    }
    throw new Error('UPC-A 需 11 碼 (自動補碼) 或 12 碼');
  }

  global.BenBarcode = {
    encode: function (type, data, opts) {
      opts = opts || {};
      if (type === 'code39') return code39(data, opts.wideRatio);
      if (type === 'ean13') return ean13(data);
      if (type === 'upca') return upcA(data);
      return code128(data); // 預設 Code 128
    },
    code128: code128,
    code39: code39,
    ean13: ean13,
    upca: upcA
  };
})(typeof window !== 'undefined' ? window : this);
