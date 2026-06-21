/*
 * BEN CODE — ExtendScript Host (After Effects)
 * 由面板 (client/js/main.js) 透過 evalScript 呼叫。
 * 面板會把幾何/樣式資料寫入 JSON 檔，這裡讀檔後建立「向量 Shape Layer」。
 *
 * 座標約定：rects[].x / .y 為「矩形中心」相對於整體內容中心 (0,0) 的位置 (px)。
 */

function benReadFile(path) {
    var f = new File(path);
    f.encoding = 'UTF-8';
    if (!f.exists) return null;
    f.open('r');
    var s = f.read();
    f.close();
    return s;
}

function benParse(str) {
    // 資料來源為本擴充功能自身的面板，屬可信來源，使用 eval 解析。
    return eval('(' + str + ')');
}

function benHexToRgb(hex) {
    hex = String(hex).replace('#', '');
    if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }
    var r = parseInt(hex.substr(0, 2), 16) / 255;
    var g = parseInt(hex.substr(2, 2), 16) / 255;
    var b = parseInt(hex.substr(4, 2), 16) / 255;
    return [r, g, b];
}

function benEnsureComp() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        comp = app.project.items.addComp('BEN CODE', 1920, 1080, 1, 10, 30);
        comp.openInViewer();
    }
    return comp;
}

function benAddRect(vgroup, rc) {
    var rect = vgroup.addProperty('ADBE Vector Shape - Rect');
    rect.property('ADBE Vector Rect Size').setValue([rc.w, rc.h]);
    rect.property('ADBE Vector Rect Position').setValue([rc.x, rc.y]);
    rect.property('ADBE Vector Rect Roundness').setValue(rc.r || 0);
    return rect;
}

function benAddRectGroup(contents, name, rects, color) {
    var grp = contents.addProperty('ADBE Vector Group');
    grp.name = name;
    var vgroup = grp.property('ADBE Vectors Group');
    for (var i = 0; i < rects.length; i++) {
        benAddRect(vgroup, rects[i]);
    }
    // Fill 置於群組底部，填滿其上方所有矩形 → 整組單一顏色。
    var fill = vgroup.addProperty('ADBE Vector Graphic - Fill');
    fill.property('ADBE Vector Fill Color').setValue(color);
    return grp;
}

// 定位點外環：外矩形「減去」內矩形 (Merge Paths Subtract) → 真正鏤空的環
function benAddRingGroup(contents, name, rings, color) {
    for (var k = 0; k < rings.length; k++) {
        var grp = contents.addProperty('ADBE Vector Group');
        grp.name = name + ' ' + (k + 1);
        var vgroup = grp.property('ADBE Vectors Group');
        benAddRect(vgroup, rings[k].outer); // 上方 = 被減者
        benAddRect(vgroup, rings[k].inner); // 下方 = 減去
        var merge = vgroup.addProperty('ADBE Vector Filter - Merge');
        merge.property('ADBE Vector Merge Type').setValue(3); // 3 = Subtract
        var fill = vgroup.addProperty('ADBE Vector Graphic - Fill');
        fill.property('ADBE Vector Fill Color').setValue(color);
    }
}

function benImportLogo(comp, path, areaWidthPx, finalScale) {
    var f = new File(path);
    if (!f.exists) return null;
    var io = new ImportOptions(f);
    var item = app.project.importFile(io);
    var lyr = comp.layers.add(item); // 加在最上層 → 蓋在 QR 上
    lyr.name = 'Logo';
    var srcW = item.width || 1;
    var targetW = areaWidthPx * (finalScale / 100);
    var sc = (targetW / srcW) * 100;
    var tg = lyr.property('ADBE Transform Group');
    tg.property('ADBE Scale').setValue([sc, sc]);
    tg.property('ADBE Position').setValue([comp.width / 2, comp.height / 2]);
    return lyr;
}

function benCreateGraphicFromFile(path) {
    try {
        var raw = benReadFile(path);
        if (!raw) return 'ERR:找不到資料檔 ' + path;
        var data = benParse(raw);

        app.beginUndoGroup('BEN CODE — 產生' + (data.kind === 'qr' ? ' QR Code' : '條碼'));

        var comp = benEnsureComp();
        var layer = comp.layers.addShape();
        layer.name = data.name || 'BEN CODE';
        var contents = layer.property('ADBE Root Vectors Group');

        var fg = benHexToRgb(data.fg);
        var bg = benHexToRgb(data.bg);
        var eye = data.eyeColor ? benHexToRgb(data.eyeColor) : fg;

        // 列表頂端 = 畫面最前；依序：前景資料 → 定位點 → 背景。
        benAddRectGroup(contents, 'Foreground', data.rects, fg);
        if (data.rings && data.rings.length) {
            benAddRingGroup(contents, 'Finder Ring', data.rings, eye);
        }
        if (data.dots && data.dots.length) {
            benAddRectGroup(contents, 'Finder Dot', data.dots, eye);
        }
        if (data.drawBg && data.bgRect) {
            benAddRectGroup(contents, 'Background', [data.bgRect], bg);
        }

        // 置中 + 等比縮放 (錨點在內容中心，縮放以中心為基準)
        var W = data.width || 0;
        var tg = layer.property('ADBE Transform Group');
        tg.property('ADBE Anchor Point').setValue([0, 0]);
        tg.property('ADBE Position').setValue([comp.width / 2, comp.height / 2]);

        var scale = data.scalePercent || 100;
        if (data.targetWidth && data.targetWidth > 0 && W > 0) {
            scale = (data.targetWidth / W) * 100;
        }
        tg.property('ADBE Scale').setValue([scale, scale]);

        // 匯入 logo (置於中央預留區)
        if (data.logo && data.logo.path && data.reserve) {
            try { benImportLogo(comp, data.logo.path, data.reserve.w, scale); } catch (le) {}
        }

        app.endUndoGroup();
        return 'OK:' + layer.name;
    } catch (e) {
        try { app.endUndoGroup(); } catch (ee) {}
        return 'ERR:' + e.toString();
    }
}
