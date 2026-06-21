/* BEN CODE — 面板主程式 (CEP / CEF JavaScript) */
(function () {
  'use strict';

  var csInterface = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;
  var logoPath = null; // 使用者選擇的 logo 圖檔路徑

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('preview');
  var ctx = canvas.getContext('2d');
  var statusEl = $('status');

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function num(id, def) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? def : v;
  }

  function appendRoundRect(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function currentMode() {
    return document.querySelector('.tab.active').getAttribute('data-tab');
  }

  function buildGeometry() {
    if (currentMode() === 'qr') {
      return BenGeom.buildQR({
        text: $('qr-text').value,
        ec: $('qr-ec').value,
        module: num('qr-module', 20),
        margin: num('qr-margin', 4),
        radiusPct: num('qr-radius', 0),
        styleEyes: $('qr-styleeyes').checked,
        eyeRadiusPct: num('qr-eyeradius', 0),
        reserveLogo: $('qr-reservelogo').checked,
        logoPct: num('qr-logopct', 20)
      });
    }
    return BenGeom.buildBarcode({
      text: $('bc-text').value,
      type: $('bc-type').value,
      barW: num('bc-bar', 4),
      height: num('bc-height', 120),
      margin: num('bc-margin', 10),
      wideRatio: num('bc-ratio', 3)
    });
  }

  function currentStyle() {
    if (currentMode() === 'qr') {
      return {
        fg: $('qr-fg').value, bg: $('qr-bg').value,
        drawBg: $('qr-drawbg').checked,
        eyeColor: $('qr-styleeyes').checked ? $('qr-eyecolor').value : null
      };
    }
    return { fg: $('bc-fg').value, bg: $('bc-bg').value, drawBg: $('bc-drawbg').checked, eyeColor: null };
  }

  // ---- 預覽 ----
  function drawPreview() {
    try {
      var geom = buildGeometry();
      var style = currentStyle();
      var maxSize = 240;
      var aspect = geom.width / geom.height;
      var cw, ch;
      if (aspect >= 1) { cw = maxSize; ch = Math.max(40, Math.round(maxSize / aspect)); }
      else { ch = maxSize; cw = Math.round(maxSize * aspect); }
      canvas.width = cw; canvas.height = ch;
      var s = cw / geom.width;
      var ox = cw / 2, oy = ch / 2;

      ctx.clearRect(0, 0, cw, ch);

      function fillRects(list, color, evenoddPairs) {
        if (!list.length) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < list.length; i++) {
          var rc = list[i];
          appendRoundRect(ctx, ox + (rc.x - rc.w / 2) * s, oy + (rc.y - rc.h / 2) * s, rc.w * s, rc.h * s, rc.r * s);
        }
        ctx.fill();
      }

      if (style.drawBg) fillRects([geom.bgRect], style.bg);

      var eyeColor = style.eyeColor || style.fg;
      // 定位點外環 (evenodd 鏤空)
      if (geom.rings && geom.rings.length) {
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        for (var k = 0; k < geom.rings.length; k++) {
          var o = geom.rings[k].outer, inr = geom.rings[k].inner;
          appendRoundRect(ctx, ox + (o.x - o.w / 2) * s, oy + (o.y - o.h / 2) * s, o.w * s, o.h * s, o.r * s);
          appendRoundRect(ctx, ox + (inr.x - inr.w / 2) * s, oy + (inr.y - inr.h / 2) * s, inr.w * s, inr.h * s, inr.r * s);
        }
        ctx.fill('evenodd');
      }
      if (geom.dots && geom.dots.length) fillRects(geom.dots, eyeColor);

      fillRects(geom.rects, style.fg);

      // 中央預留區提示框
      if (geom.reserve) {
        ctx.strokeStyle = 'rgba(120,170,255,0.9)';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        var rv = geom.reserve;
        ctx.strokeRect(ox + (rv.x - rv.w / 2) * s, oy + (rv.y - rv.h / 2) * s, rv.w * s, rv.h * s);
        ctx.setLineDash([]);
      }

      var info = geom.kind === 'qr'
        ? ('QR ' + geom.moduleCount + '×' + geom.moduleCount + '，' + geom.rects.length + ' 模組')
        : ('條碼 ' + geom.rects.length + ' 條（資料 ' + geom.text + '）');
      setStatus(info, '');
    } catch (e) {
      setStatus(e.message || String(e), 'err');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ---- 產生到 AE ----
  function generate() {
    if (!csInterface) { setStatus('未偵測到 After Effects 環境 (僅能預覽)', 'err'); return; }
    var geom, style;
    try { geom = buildGeometry(); style = currentStyle(); }
    catch (e) { setStatus(e.message || String(e), 'err'); return; }

    var payload = {
      kind: geom.kind, name: geom.name,
      width: geom.width, height: geom.height,
      rects: geom.rects, rings: geom.rings, dots: geom.dots,
      bgRect: geom.bgRect, reserve: geom.reserve,
      fg: style.fg, bg: style.bg, eyeColor: style.eyeColor, drawBg: style.drawBg,
      scalePercent: num('tf-scale', 100), targetWidth: num('tf-width', 0)
    };
    if (geom.kind === 'qr' && $('qr-reservelogo').checked && logoPath) {
      payload.logo = { path: logoPath };
    }

    var total = payload.rects.length + (payload.dots ? payload.dots.length : 0) + (payload.rings ? payload.rings.length * 2 : 0);
    if (total > 6000) { setStatus('幾何元素過多 (' + total + ')，請調小資料或加大模組。', 'err'); return; }

    var path = csInterface.getSystemPath(SystemPath.USER_DATA) + '/bencode_payload.json';
    if (window.cep && window.cep.fs && typeof window.cep.fs.writeFile === 'function') {
      var res = window.cep.fs.writeFile(path, JSON.stringify(payload));
      if (res && res.err) { setStatus('寫入暫存檔失敗 (err ' + res.err + ')', 'err'); return; }
    } else { setStatus('CEP 檔案 API 無法使用', 'err'); return; }

    setStatus('產生中…', '');
    csInterface.evalScript('benCreateGraphicFromFile(' + JSON.stringify(path) + ')', function (ret) {
      ret = String(ret || '');
      if (ret.indexOf('OK') === 0) setStatus('已在 After Effects 中產生：' + ret.replace('OK:', ''), 'ok');
      else if (ret.indexOf('ERR') === 0) setStatus(ret.replace('ERR:', '錯誤：'), 'err');
      else setStatus('回傳：' + (ret || '(空)'), 'err');
    });
  }

  // ---- Logo 檔案選擇 ----
  function pickLogo() {
    if (!csInterface || !window.cep || !window.cep.fs) { setStatus('此環境無法開啟檔案對話框', 'err'); return; }
    var result = window.cep.fs.showOpenDialog(false, false, '選擇 Logo 圖檔', '',
      ['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'ai', 'eps', 'psd']);
    if (result && result.data && result.data.length) {
      logoPath = result.data[0];
      var nameOnly = logoPath.replace(/^.*[\\\/]/, '');
      $('qr-logo-name').textContent = '已選：' + nameOnly;
      if (!$('qr-reservelogo').checked) { $('qr-reservelogo').checked = true; drawPreview(); }
    }
  }

  function clearLogo() {
    logoPath = null;
    $('qr-logo-name').textContent = '（未選擇，產生時於中央留白供手動放置）';
  }

  // ---- 事件 ----
  function bind() {
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

    $('qr-radius').addEventListener('input', function () { $('qr-radius-val').textContent = this.value + '%'; });
    $('qr-eyeradius').addEventListener('input', function () { $('qr-eyeradius-val').textContent = this.value + '%'; });
    $('qr-logopct').addEventListener('input', function () { $('qr-logopct-val').textContent = this.value + '%'; });

    $('bc-type').addEventListener('change', function () {
      $('bc-ratio-row').style.opacity = (this.value === 'code39') ? '1' : '0.4';
      drawPreview();
    });

    $('qr-logo-pick').addEventListener('click', pickLogo);
    $('qr-logo-clear').addEventListener('click', function () { clearLogo(); });

    var inputs = document.querySelectorAll('input, select, textarea');
    for (var k = 0; k < inputs.length; k++) {
      inputs[k].addEventListener('input', drawPreview);
      inputs[k].addEventListener('change', drawPreview);
    }
    $('generate').addEventListener('click', generate);
  }

  bind();
  drawPreview();
  setStatus('準備就緒', '');
})();
