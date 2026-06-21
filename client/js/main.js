/* BEN CODE — 面板主程式 (CEP / CEF JavaScript) */
(function () {
  'use strict';

  var csInterface = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;

  // ---- DOM ----
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('preview');
  var ctx = canvas.getContext('2d');
  var statusEl = $('status');

  // ---- 共用工具 ----
  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function num(id, def) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? def : v;
  }

  function roundRectPath(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---- 幾何建構 (座標為「矩形中心」相對整體中心，px) ----
  function buildQR() {
    var text = $('qr-text').value;
    if (!text) throw new Error('請輸入 QR Code 內容');
    var ec = $('qr-ec').value;
    var module = num('qr-module', 20);
    var margin = num('qr-margin', 4);
    var radiusPct = num('qr-radius', 0);
    var r = (radiusPct / 100) * module; // 0 ~ 半個模組

    var qr = qrcode(0, ec); // 0 = 自動選擇版本
    qr.addData(text);
    qr.make();
    var count = qr.getModuleCount();

    var totalModules = count + margin * 2;
    var W = totalModules * module;
    var H = W;
    var rects = [];
    for (var row = 0; row < count; row++) {
      for (var col = 0; col < count; col++) {
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
    return {
      kind: 'qr', name: 'QR Code',
      width: W, height: H,
      rects: rects, bgRect: { x: 0, y: 0, w: W, h: H, r: 0 }
    };
  }

  function buildBarcode() {
    var data = $('bc-text').value;
    if (!data) throw new Error('請輸入條碼資料');
    var type = $('bc-type').value;
    var barW = num('bc-bar', 4);
    var height = num('bc-height', 120);
    var margin = num('bc-margin', 10);
    var ratio = num('bc-ratio', 3);

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
        var runLen = i - start;
        var left = (start + margin) * barW;
        var w = runLen * barW;
        rects.push({ x: left + w / 2 - W / 2, y: 0, w: w, h: H, r: 0 });
      } else {
        i++;
      }
    }
    return {
      kind: 'barcode', name: 'Barcode',
      width: W, height: H,
      rects: rects, bgRect: { x: 0, y: 0, w: W, h: H, r: 0 }
    };
  }

  function currentMode() {
    return document.querySelector('.tab.active').getAttribute('data-tab');
  }

  function buildGeometry() {
    return currentMode() === 'qr' ? buildQR() : buildBarcode();
  }

  function currentStyle() {
    var mode = currentMode();
    if (mode === 'qr') {
      return { fg: $('qr-fg').value, bg: $('qr-bg').value, drawBg: $('qr-drawbg').checked };
    }
    return { fg: $('bc-fg').value, bg: $('bc-bg').value, drawBg: $('bc-drawbg').checked };
  }

  // ---- 預覽 ----
  function drawPreview() {
    try {
      var geom = buildGeometry();
      var style = currentStyle();
      var maxSize = 240;
      var ratio = geom.width / geom.height;
      var cw, ch;
      if (ratio >= 1) { cw = maxSize; ch = Math.max(40, Math.round(maxSize / ratio)); }
      else { ch = maxSize; cw = Math.round(maxSize * ratio); }
      canvas.width = cw;
      canvas.height = ch;
      var s = cw / geom.width; // 等比

      ctx.clearRect(0, 0, cw, ch);
      var ox = cw / 2, oy = ch / 2; // 內容中心對應畫布中心

      if (style.drawBg) {
        ctx.fillStyle = style.bg;
        var b = geom.bgRect;
        roundRectPath(ctx, ox + (b.x - b.w / 2) * s, oy + (b.y - b.h / 2) * s, b.w * s, b.h * s, b.r * s);
        ctx.fill();
      }
      ctx.fillStyle = style.fg;
      for (var k = 0; k < geom.rects.length; k++) {
        var rc = geom.rects[k];
        roundRectPath(ctx, ox + (rc.x - rc.w / 2) * s, oy + (rc.y - rc.h / 2) * s, rc.w * s, rc.h * s, rc.r * s);
        ctx.fill();
      }
      setStatus(geom.kind === 'qr'
        ? ('QR 預覽：' + geom.rects.length + ' 個模組')
        : ('條碼預覽：' + geom.rects.length + ' 條'), '');
    } catch (e) {
      setStatus(e.message || String(e), 'err');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ---- 寫入 AE ----
  function generate() {
    if (!csInterface) {
      setStatus('未偵測到 After Effects 環境 (僅能預覽)', 'err');
      return;
    }
    var geom, style;
    try {
      geom = buildGeometry();
      style = currentStyle();
    } catch (e) {
      setStatus(e.message || String(e), 'err');
      return;
    }

    var payload = {
      kind: geom.kind,
      name: geom.name,
      width: geom.width,
      height: geom.height,
      rects: geom.rects,
      bgRect: geom.bgRect,
      fg: style.fg,
      bg: style.bg,
      drawBg: style.drawBg,
      scalePercent: num('tf-scale', 100),
      targetWidth: num('tf-width', 0)
    };

    if (payload.rects.length > 6000) {
      setStatus('模組數過多 (' + payload.rects.length + ')，請調小資料或加大模組。', 'err');
      return;
    }

    var path = csInterface.getSystemPath(SystemPath.USER_DATA) + '/bencode_payload.json';
    var json = JSON.stringify(payload);

    if (window.cep && window.cep.fs && typeof window.cep.fs.writeFile === 'function') {
      var res = window.cep.fs.writeFile(path, json);
      if (res && res.err) {
        setStatus('寫入暫存檔失敗 (err ' + res.err + ')', 'err');
        return;
      }
    } else {
      setStatus('CEP 檔案 API 無法使用', 'err');
      return;
    }

    setStatus('產生中…', '');
    csInterface.evalScript('benCreateGraphicFromFile(' + JSON.stringify(path) + ')', function (ret) {
      ret = String(ret || '');
      if (ret.indexOf('OK') === 0) {
        setStatus('已在 After Effects 中產生：' + ret.replace('OK:', ''), 'ok');
      } else if (ret.indexOf('ERR') === 0) {
        setStatus(ret.replace('ERR:', '錯誤：'), 'err');
      } else {
        setStatus('回傳：' + (ret || '(空)'), 'err');
      }
    });
  }

  // ---- 事件綁定 ----
  function bind() {
    // 分頁切換
    var tabs = document.querySelectorAll('.tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function () {
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        this.classList.add('active');
        var tab = this.getAttribute('data-tab');
        $('panel-qr').classList.toggle('hidden', tab !== 'qr');
        $('panel-barcode').classList.toggle('hidden', tab !== 'barcode');
        drawPreview();
      });
    }

    // 圓角數值顯示
    $('qr-radius').addEventListener('input', function () {
      $('qr-radius-val').textContent = this.value + '%';
    });

    // 條碼類型切換 → 顯示/隱藏 寬窄比
    $('bc-type').addEventListener('change', function () {
      $('bc-ratio-row').style.opacity = (this.value === 'code39') ? '1' : '0.4';
      drawPreview();
    });

    // 任一控制項變動即更新預覽
    var inputs = document.querySelectorAll('input, select, textarea');
    for (var k = 0; k < inputs.length; k++) {
      inputs[k].addEventListener('input', drawPreview);
      inputs[k].addEventListener('change', drawPreview);
    }

    $('generate').addEventListener('click', generate);
  }

  // ---- 啟動 ----
  bind();
  drawPreview();
  setStatus('準備就緒', '');
})();
