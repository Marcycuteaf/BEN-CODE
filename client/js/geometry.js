/*
 * BEN CODE — 幾何建構 (純函式，不依賴 DOM，方便單元測試)
 * 依賴：全域 qrcode (qrcode.js)、BenBarcode (barcode.js)
 *
 * 座標約定：所有矩形的 x / y 為「矩形中心」相對整體內容中心 (0,0) 的位置 (px)。
 * 回傳物件供「預覽 (canvas)」與「AE (host.jsx)」共用。
 */
(function (global) {
  'use strict';

  function finderZone(row, col, count) {
    if (row < 7 && col < 7) return 'TL';
    if (row < 7 && col >= count - 7) return 'TR';
    if (row >= count - 7 && col < 7) return 'BL';
    return null;
  }

  // 建立一顆「定位點」(眼睛)：外環(7模) 去掉 中間(5模) + 中心點(3模)
  function buildEye(r0, c0, module, margin, W, H, eyeRadiusPct) {
    var px = (c0 + margin) * module;
    var py = (r0 + margin) * module;
    function rect(modOffset, modSize) {
      var size = modSize * module;
      var left = px + modOffset * module;
      var top = py + modOffset * module;
      return {
        x: left + size / 2 - W / 2,
        y: top + size / 2 - H / 2,
        w: size, h: size,
        r: (eyeRadiusPct / 100) * (modSize / 2) * module
      };
    }
    return {
      ring: { outer: rect(0, 7), inner: rect(1, 5) },
      dot: rect(2, 3)
    };
  }

  function buildQR(opts) {
    var text = opts.text;
    if (!text) throw new Error('請輸入 QR Code 內容');
    var module = opts.module || 20;
    var margin = opts.margin || 0;
    var radiusPct = opts.radiusPct || 0;
    var r = (radiusPct / 100) * module;

    var styleEyes = !!opts.styleEyes;
    var eyeRadiusPct = opts.eyeRadiusPct || 0;
    var reserveLogo = !!opts.reserveLogo;
    var logoPct = opts.logoPct || 0;

    var qr = qrcode(0, opts.ec || 'M');
    qr.addData(text);
    qr.make();
    var count = qr.getModuleCount();

    var totalModules = count + margin * 2;
    var W = totalModules * module;
    var H = W;

    // 中央預留區 (模組座標範圍)
    var clearSide = reserveLogo ? Math.round(count * (logoPct / 100)) : 0;
    var clearStart = Math.floor((count - clearSide) / 2);
    var clearEnd = clearStart + clearSide;

    var rects = [];
    for (var row = 0; row < count; row++) {
      for (var col = 0; col < count; col++) {
        if (styleEyes && finderZone(row, col, count)) continue;
        if (reserveLogo && row >= clearStart && row < clearEnd && col >= clearStart && col < clearEnd) continue;
        if (qr.isDark(row, col)) {
          var left = (col + margin) * module;
          var top = (row + margin) * module;
          rects.push({
            x: left + module / 2 - W / 2,
            y: top + module / 2 - H / 2,
            w: module, h: module, r: r
          });
        }
      }
    }

    var rings = [], dots = [];
    if (styleEyes) {
      var eyesPos = [[0, 0], [0, count - 7], [count - 7, 0]];
      for (var e = 0; e < eyesPos.length; e++) {
        var eye = buildEye(eyesPos[e][0], eyesPos[e][1], module, margin, W, H, eyeRadiusPct);
        rings.push(eye.ring);
        dots.push(eye.dot);
      }
    }

    var reserve = null;
    if (reserveLogo && clearSide > 0) {
      var rsize = clearSide * module;
      reserve = { x: 0, y: 0, w: rsize, h: rsize };
    }

    return {
      kind: 'qr', name: 'QR Code',
      width: W, height: H,
      rects: rects, rings: rings, dots: dots,
      bgRect: { x: 0, y: 0, w: W, h: H, r: 0 },
      reserve: reserve,
      moduleCount: count
    };
  }

  function buildBarcode(opts) {
    var data = opts.text;
    if (!data) throw new Error('請輸入條碼資料');
    var type = opts.type || 'code128';
    var barW = opts.barW || 4;
    var height = opts.height || 120;
    var margin = (opts.margin == null) ? 10 : opts.margin;
    var ratio = opts.wideRatio || 3;

    var enc = BenBarcode.encode(type, data, { wideRatio: ratio });
    var bits = enc.bits;
    var n = bits.length;
    var totalModules = n + margin * 2;
    var W = totalModules * barW;
    var H = height;

    var rects = [];
    var i = 0;
    while (i < n) {
      if (bits.charAt(i) === '1') {
        var start = i;
        while (i < n && bits.charAt(i) === '1') i++;
        var w = (i - start) * barW;
        var left = (start + margin) * barW;
        rects.push({ x: left + w / 2 - W / 2, y: 0, w: w, h: H, r: 0 });
      } else {
        i++;
      }
    }

    return {
      kind: 'barcode', name: 'Barcode (' + type + ')',
      width: W, height: H,
      rects: rects, rings: [], dots: [],
      bgRect: { x: 0, y: 0, w: W, h: H, r: 0 },
      reserve: null,
      text: enc.text
    };
  }

  global.BenGeom = {
    buildQR: buildQR,
    buildBarcode: buildBarcode,
    finderZone: finderZone
  };
})(typeof window !== 'undefined' ? window : this);
