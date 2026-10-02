/* ============================================================
   角色：Claude 像素小人
   +----------+   头身一体，两条横臂，两条短腿，两个竖条形眼睛
   ============================================================ */
(function (root) {
  'use strict';

  function gridFromSpec(w, h, spec) {
    const rows = [];
    for (let r = 0; r < h; r++) rows.push(new Array(w).fill('.'));
    for (const item of spec) {
      const ch = item[0], cells = item[1];
      for (const cell of cells) {
        const r = cell[0], c0 = cell[1], c1 = cell.length > 2 ? cell[2] : cell[1];
        for (let c = c0; c <= c1; c++) {
          if (r >= 0 && r < h && c >= 0 && c < w) rows[r][c] = ch;
        }
      }
    }
    return rows.map(r => r.join(''));
  }

  /* ---- Claude 本体：22 × 15 ---- */
  const BODY = [
    [1, 4, 17], [2, 4, 17], [3, 4, 17], [4, 4, 17], [5, 4, 17], [6, 4, 17],
    [7, 0, 21], [8, 0, 21],                                   // 两条横臂
    [9, 4, 17], [10, 4, 17], [11, 4, 17],
    [12, 5, 6], [12, 15, 16],                                 // 左腿 / 右腿
    [13, 5, 6], [13, 15, 16],
    [14, 5, 6], [14, 15, 16]
  ];
  const EYES = [
    [2, 7, 8], [3, 7, 8], [4, 7, 8], [5, 7, 8],
    [2, 13, 14], [3, 13, 14], [4, 13, 14], [5, 13, 14]
  ];
  const CLAUDE = gridFromSpec(22, 15, [['#', BODY], ['o', EYES]]);

  /* ---- 狐狸：18 × 16，尖耳 + 从背后卷起的大尾巴 ---- */
  const FOX = gridFromSpec(18, 16, [
    ['#', [
      [0, 2, 2], [1, 1, 3], [2, 1, 4],                        // 左耳
      [0, 11, 11], [1, 10, 12], [2, 9, 12],                   // 右耳
      [3, 1, 11], [4, 1, 11], [5, 1, 11],                     // 头
      [6, 3, 11], [7, 3, 11], [8, 1, 11],                     // 鼻梁收窄
      [9, 3, 11], [10, 3, 11], [11, 3, 11], [12, 3, 11], [13, 3, 11],  // 身
      [14, 3, 4], [15, 3, 4], [14, 9, 10], [15, 9, 10]        // 四条腿
    ]],
    ['m', [[6, 0, 2], [7, 0, 2]]],                            // 吻部（浅）
    ['T', [
      [5, 13, 15], [6, 14, 16], [7, 15, 17], [8, 15, 17], [9, 15, 17], [10, 15, 17],
      [11, 14, 17], [12, 13, 17], [13, 12, 17], [14, 12, 17], [15, 12, 17]
    ]],
    ['t', [[4, 14, 15], [5, 14, 15]]],                        // 尾尖（更浅）
    ['o', [[5, 5, 6], [6, 5, 6]]]                             // 眯成一条缝
  ]);

  /* ---- 调色 ---- */
  function hx(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : v;
  function mix(a, b, t) {
    const A = hx(a), B = hx(b);
    return '#' + [0, 1, 2].map(i => Math.round(cl(A[i] + (B[i] - A[i]) * t)).toString(16).padStart(2, '0')).join('');
  }
  function rgba(hex, a) { const c = hx(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  // Claude 的暖陶土色
  const CLAY = '#D97757';
  const GRAY = '#6E7683';

  function palette(o, h) {
    const gray = o.gray || 0;
    const base = mix(o.col || CLAY, GRAY, gray);
    // 只留极轻的一层体积感，主体保持平涂的色块
    const top = mix(base, '#FFE3D2', 0.11);
    const bot = mix(base, '#7A3A24', 0.12);
    const eyeDark = mix(base, '#22101A', 0.84 - gray * 0.18);
    return {
      body: (r) => {
        const t = r / (h - 1);
        return t < 0.35 ? mix(top, base, t / 0.35) : mix(base, bot, (t - 0.35) / 0.65);
      },
      eye: eyeDark
    };
  }

  // 画一个像素网格。px = 单个像素的边长
  function blit(ctx, grid, px, colFn) {
    const h = grid.length, w = grid[0].length;
    const ox = -w / 2 * px, oy = -h * px;
    for (let r = 0; r < h; r++) {
      const row = grid[r];
      let c = 0;
      while (c < w) {
        const ch = row[c];
        if (ch === '.') { c++; continue; }
        let c2 = c;
        while (c2 + 1 < w && row[c2 + 1] === ch) c2++;
        ctx.fillStyle = colFn(ch, r, c);
        ctx.fillRect(ox + c * px, oy + r * px, (c2 - c + 1) * px + 0.7, px + 0.7);
        c = c2 + 1;
      }
    }
  }

  function blob(ctx, x, y, rx, ry, color, alpha) {
    if (alpha <= 0.002) return;
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.55, rgba(color, alpha * 0.4));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const K = 9;   // s=1 时一个像素 9 像素长 → 小人高 135、宽 198

  /* ============ 画一个 Claude ============
     x,y = 脚底中心。o: gray/alpha/tilt/squash/eyes/glow/tint
     eyes: 'open' | 'half' | 'shut'
  ========================================= */
  function drawClaude(ctx, x, y, s, o) {
    o = o || {};
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0.004) return;
    const px = K * s;
    const pal = palette(o, CLAUDE.length);
    const gray = o.gray || 0;
    const eyes = o.eyes || 'open';
    const eyeOn = r => eyes === 'open' ? true : eyes === 'half' ? r >= 4 : false;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    if (o.tilt) ctx.rotate(o.tilt);
    const sq = o.squash === undefined ? 1 : o.squash;
    ctx.scale(1, sq);

    // 光晕
    const glow = o.glow === undefined ? 0.20 : o.glow;
    if (glow > 0.004) blob(ctx, 0, -CLAUDE.length * px * 0.5, 150 * s, 130 * s, mix(CLAY, GRAY, gray), glow * a, 0.95);

    // 影子
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.save();
    ctx.scale(1, 1 / sq);
    ctx.beginPath();
    ctx.ellipse(0, 2, 78 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    blit(ctx, CLAUDE, px, (ch, r) => {
      if (ch === 'o') return eyeOn(r) ? pal.eye : pal.body(r);
      return pal.body(r);
    });

    // 眼里一点高光，让它活过来：贴在眼睛顶端的一小段
    if (eyes === 'open' && gray < 0.92) {
      ctx.globalAlpha = a * (1 - gray * 0.7) * 0.82;
      ctx.fillStyle = '#FFE9D8';
      const h = CLAUDE.length;
      [7, 13].forEach(c => ctx.fillRect(-11 * px + c * px, -h * px + 2 * px, px, px * 0.62));
      ctx.globalAlpha = a;
    }
    ctx.restore();
  }

  /* ============ 画狐狸 ============ */
  function drawFox(ctx, x, y, s, o) {
    o = o || {};
    const a = o.alpha === undefined ? 1 : o.alpha;
    if (a <= 0.004) return;
    const px = K * 1.05 * s;
    const gray = o.gray || 0;
    const base = mix(o.col || '#E0A95E', GRAY, gray);
    const top = mix(base, '#FFF0CE', 0.42);
    const bot = mix(base, '#8A4E1C', 0.34);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    blob(ctx, 0, -FOX.length * px * 0.5, 190 * s, 165 * s, '#FFD79A', (o.glow === undefined ? 0.30 : o.glow) * a, 0.95);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0, 2, 86 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();

    blit(ctx, FOX, px, (ch, r) => {
      if (ch === 'o') return mix(base, '#2A1408', 0.82);
      if (ch === 'm') return mix(base, '#FFF6E2', 0.42);
      if (ch === 'T') return mix(base, '#FFF6E2', 0.60);
      if (ch === 't') return mix(base, '#FFFCF4', 0.86);
      const t = r / (FOX.length - 1);
      return t < 0.4 ? mix(top, base, t / 0.4) : mix(base, bot, (t - 0.4) / 0.6);
    });
    ctx.restore();
  }

  root.SPRITE = { drawClaude, drawFox, CLAUDE, FOX, CLAY, GRAY, mix, rgba, blob, K };
})(window);

