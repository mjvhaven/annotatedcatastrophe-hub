// Hex Map Maker - Main Application
(function() {
  'use strict';

  // ============ CONSTANTS ============
  const HEX_SIZE = 20; // base radius of a hexagon
  const DEFAULT_COLORS = ['#7c3aed', '#dc2626', '#059669', '#2563eb', '#ca8a04', '#db2777'];
  const TOKEN_SHAPES = [
    { id: 'circle', draw: (ctx, x, y, s, c) => { ctx.beginPath(); ctx.arc(x, y, s*0.8, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'square', draw: (ctx, x, y, s, c) => { const r = s*0.7; ctx.fillStyle = c; ctx.fillRect(x-r, y-r, r*2, r*2); } },
    { id: 'triangle', draw: (ctx, x, y, s, c) => { ctx.beginPath(); ctx.moveTo(x, y-s*0.9); ctx.lineTo(x+s*0.8, y+s*0.6); ctx.lineTo(x-s*0.8, y+s*0.6); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'diamond', draw: (ctx, x, y, s, c) => { ctx.beginPath(); ctx.moveTo(x, y-s*0.9); ctx.lineTo(x+s*0.7, y); ctx.lineTo(x, y+s*0.9); ctx.lineTo(x-s*0.7, y); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'star', draw: (ctx, x, y, s, c) => { const pts = 5, inn = s*0.4, out = s*0.9; ctx.beginPath(); for(let i=0;i<pts*2;i++){const r=i%2?inn:out,a=(i*Math.PI/pts)-Math.PI/2;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=c;ctx.fill();} },
    { id: 'x', draw: (ctx, x, y, s, c) => { ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.5);ctx.lineTo(x+s*0.5,y+s*0.5);ctx.moveTo(x+s*0.5,y-s*0.5);ctx.lineTo(x-s*0.5,y+s*0.5);ctx.stroke(); } },
    { id: 'cross', draw: (ctx, x, y, s, c) => { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-s*0.6);ctx.lineTo(x,y+s*0.6);ctx.moveTo(x-s*0.6,y);ctx.lineTo(x+s*0.6,y);ctx.stroke(); } },
    { id: 'heart', draw: (ctx, x, y, s, c) => { ctx.beginPath();const t=s*0.4;ctx.moveTo(x,y+s*0.5);ctx.bezierCurveTo(x-s*0.5,y,y-s*0.8,t,y-s*0.8,-t);ctx.bezierCurveTo(x-s*0.8,-s*0.5,x,y+s*0.1,x,y+s*0.5);ctx.bezierCurveTo(x,y+s*0.1,x+s*0.8,-s*0.5,x+s*0.8,-t);ctx.bezierCurveTo(x+s*0.8,t,x+s*0.5,y,x,y+s*0.5);ctx.fillStyle=c;ctx.fill(); } },
    { id: 'arrow', draw: (ctx, x, y, s, c) => { ctx.beginPath();ctx.moveTo(x,y-s*0.7);ctx.lineTo(x+s*0.4,y+s*0.2);ctx.lineTo(x+s*0.15,y+s*0.2);ctx.lineTo(x+s*0.15,y+s*0.7);ctx.lineTo(x-s*0.15,y+s*0.7);ctx.lineTo(x-s*0.15,y+s*0.2);ctx.lineTo(x-s*0.4,y+s*0.2);ctx.closePath();ctx.fillStyle=c;ctx.fill(); } },
    { id: 'trefoil', draw: (ctx, x, y, s, c) => { ctx.fillStyle=c;for(let i=0;i<3;i++){const a=(i*120-90)*Math.PI/180;ctx.beginPath();ctx.arc(x+s*0.45*Math.cos(a),y+s*0.45*Math.sin(a),s*0.35,0,Math.PI*2);ctx.fill();} } },
    { id: 'quatrefoil', draw: (ctx, x, y, s, c) => { ctx.fillStyle=c;for(let i=0;i<4;i++){const a=(i*90-45)*Math.PI/180;ctx.beginPath();ctx.arc(x+s*0.4*Math.cos(a),y+s*0.4*Math.sin(a),s*0.35,0,Math.PI*2);ctx.fill();} } },
    { id: 'kite', draw: (ctx, x, y, s, c) => { ctx.beginPath();ctx.moveTo(x,y-s*0.9);ctx.lineTo(x+s*0.5,y);ctx.lineTo(x,y+s*0.3);ctx.lineTo(x-s*0.5,y);ctx.closePath();ctx.fillStyle=c;ctx.fill(); } },
    { id: 'ring', draw: (ctx, x, y, s, c) => { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,s*0.6,0,Math.PI*2);ctx.stroke(); } },
    { id: 'tick', draw: (ctx, x, y, s, c) => { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-s*0.5,y);ctx.lineTo(x-s*0.15,y+s*0.3);ctx.lineTo(x+s*0.5,y-s*0.3);ctx.stroke(); } },
    { id: 'sixstar', draw: (ctx, x, y, s, c) => { const pts=6,inn=s*0.4,out=s*0.9;ctx.beginPath();for(let i=0;i<pts*2;i++){const r=i%2?inn:out,a=(i*Math.PI/pts)-Math.PI/2;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=c;ctx.fill(); } }
  ];

  // ============ STATE ============
  const state = {
    canvas: null, ctx: null,
    hexes: new Map(), dots: [], lines: [], tokens: [],
    currentTool: 'paint', currentColor: '#7c3aed', currentShape: TOKEN_SHAPES[0],
    lineStartHex: null, lineStyle: 'solid',
    recentColors: [...DEFAULT_COLORS], pinnedColors: [],
    zoom: 1, panX: 0, panY: 0,
    isDragging: false, dragStart: { x: 0, y: 0 },
    isMouseDown: false, hoveredHex: null,
    selectedToken: null, draggingToken: null,
    showTokenPalette: false
  };

  // ============ HEX MATH ============
  function hexToPixel(q, r) {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  }

  function pixelToHex(px, py) {
    const q = (2/3 * px) / HEX_SIZE;
    const r = (-1/3 * px + Math.sqrt(3)/3 * py) / HEX_SIZE;
    return hexRound(q, r);
  }

  function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    const qDiff = Math.abs(rq - q), rDiff = Math.abs(rr - r), sDiff = Math.abs(rs - s);
    if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
    else if (rDiff > sDiff) rr = -rq - rs;
    return { q: rq, r: rr };
  }

  function hexKey(q, r) { return `${q},${r}`; }

  function getHexNeighbors(q, r) {
    return [
      {q:q+1,r:r},{q:q-1,r:r},{q:q,r+1},{q:q,r-1},
      {q:q+1,r:r-1},{q:q-1,r:r+1}
    ];
  }

  function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  function getHexLinePath(start, end) {
    const line = [];
    let current = { q: start.q, r: start.r };
    const target = { q: end.q, r: end.r };
    const N = getHexNeighbors;
    let attempts = 0;
    while (current.q !== target.q || current.r !== target.r.r || attempts++ < 100) {
      const neighbors = N(current.q, current.r).sort((a, b) => {
        const da = hexDistance(a, target), db = hexDistance(b, target);
        return da - db;
      });
      const next = neighbors[0];
      line.push({ q: current.q, r: current.r });
      current = next;
      if (current.q === target.q && current.r === target.r) break;
    }
    line.push(target);
    return line;
  }

  function drawHexPath(ctx, hexes, color, style = 'solid') {
    if (hexes.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (style === 'dashed') ctx.setLineDash([8, 6]);
    else if (style === 'dotted') ctx.setLineDash([3, 5]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < hexes.length; i++) {
      const h1 = hexes[i];
      const corners = getHexCorners(h1.q, h1.r);
      const h2 = hexes[i+1];
      if (h2) {
        const n1 = getHexNeighbors(h1.q, h1.r);
        const n2 = getHexNeighbors(h2.q, h2.r);
        const shared = n1.filter(n => n2.some(nb => nb.q === n.q && nb.r === n.r));
        if (shared.length >= 1) {
          const edge = shared[0];
          const startCorner = corners.findIndex((c, ci) => {
            const prev = corners[(ci+5)%6], next = corners[(ci+1)%6];
            return (prev.x < c.x && next.x < c.x) || (prev.y < c.y && next.y < c.y) ||
                   (prev.x > c.x && next.x > c.x) || (prev.y > c.y && next.y > c.y);
          });
          ctx.moveTo(corners[0].x, corners[0].y);
          corners.forEach(c => ctx.lineTo(c.x, c.y));
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function getHexCorners(q, r) {
    const center = hexToPixel(q, r);
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      corners.push({
        x: center.x + HEX_SIZE * Math.cos(angle),
        y: center.y + HEX_SIZE * Math.sin(angle)
      });
    }
    return corners;
  }

  // ============ RENDERING ============
  function render() {
    const { ctx, canvas, zoom, panX, panY } = state;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2 + panX, canvas.height/2 + panY);
    ctx.scale(zoom, zoom);

    // Draw grid
    const bounds = getVisibleBounds();
    for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        drawHex(q, r);
      }
    }

    // Draw lines
    state.lines.forEach(line => {
      const hexes = getHexLinePath(line.start, line.end);
      drawHexLine(hexes, line.color, line.style);
    });

    // Draw dots
    state.dots.forEach(dot => {
      drawDot(dot);
    });

    // Draw tokens
    state.tokens.forEach(token => {
      drawToken(token);
    });

    // Draw hover highlight
    if (state.hoveredHex && state.currentTool !== 'token') {
      const { q, r } = state.hoveredHex;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      drawHexShape(q, r);
      ctx.restore();
    }

    ctx.restore();
  }

  function getVisibleBounds() {
    const { canvas, zoom } = state;
    const halfW = canvas.width/2/zoom + 100;
    const halfH = canvas.height/2/zoom + 100;
    const topLeft = pixelToHex(-halfW, -halfH);
    const bottomRight = pixelToHex(halfW, halfH);
    return { minQ: topLeft.q-1, maxQ: bottomRight.q+1, minR: topLeft.r-1, maxR: bottomRight.r+1 };
  }

  function drawHex(q, r) {
    const { ctx } = state;
    const key = hexKey(q, r);
    const hex = state.hexes.get(key);
    ctx.save();
    ctx.beginPath();
    drawHexShape(q, r);
    if (hex && hex.color) {
      ctx.fillStyle = hex.color;
      ctx.fill();
      if (hex.label) {
        const center = hexToPixel(q, r);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex.label, center.x, center.y);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawHexShape(q, r) {
    const { ctx } = state;
    const center = hexToPixel(q, r);
    ctx.moveTo(center.x + HEX_SIZE * Math.cos((Math.PI/180) * -30), center.y + HEX_SIZE * Math.sin((Math.PI/180) * -30));
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI/180) * (60*i - 30);
      ctx.lineTo(center.x + HEX_SIZE * Math.cos(angle), center.y + HEX_SIZE * Math.sin(angle));
    }
    ctx.closePath();
  }

  function drawHexLine(hexes, color, style) {
    const { ctx } = state;
    if (hexes.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (style === 'dashed') ctx.setLineDash([8, 6]);
    else if (style === 'dotted') ctx.setLineDash([3, 5]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    const start = hexToPixel(hexes[0].q, hexes[0].r);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < hexes.length; i++) {
      const p = hexToPixel(hexes[i].q, hexes[i].r);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawDot(dot) {
    const { ctx } = state;
    const pos = hexToPixel(dot.q, dot.r);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI*2);
    ctx.fillStyle = dot.color || '#ff6b6b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawToken(token) {
    const { ctx } = state;
    const shape = TOKEN_SHAPES.find(s => s.id === token.shape) || TOKEN_SHAPES[0];
    ctx.save();
    ctx.translate(token.x, token.y);
    shape.draw(ctx, 0, 0, 18, token.color || '#7c3aed');
    if (token.label) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(token.label, 0, -22);
    }
    ctx.restore();
  }

  // ============ INTERACTION ============
  function screenToWorld(screenX, screenY) {
    const { canvas, zoom, panX, panY } = state;
    return {
      x: (screenX - canvas.width/2 - panX) / zoom,
      y: (screenY - canvas.height/2 - panY) / zoom
    };
  }

  function getHexAtScreen(screenX, screenY) {
    const world = screenToWorld(screenX, screenY);
    return pixelToHex(world.x, world.y);
  }

  function handleMouseDown(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = screenToWorld(x, y);
    const hex = pixelToHex(world.x, world.y);

    if (e.button === 2 || e.ctrlKey) {
      // Right click / Ctrl+click for context menu on dots
      showDotPopup(hex, e.clientX, e.clientY);
      return;
    }

    state.isMouseDown = true;
    state.dragStart = { x, y };

    if (state.currentTool === 'paint' || state.currentTool === 'erase') {
      applyHexAction(hex);
    } else if (state.currentTool === 'line') {
      if (!state.lineStartHex) {
        state.lineStartHex = hex;
      } else {
        state.lines.push({ start: state.lineStartHex, end: hex, color: state.currentColor, style: state.lineStyle });
        state.lineStartHex = null;
        render();
      }
    } else if (state.currentTool === 'token') {
      const token = { x: world.x, y: world.y, shape: state.currentShape.id, color: state.currentColor, label: '', text: '' };
      state.tokens.push(token);
      render();
    } else if (state.currentTool === 'dot') {
      const existing = state.dots.findIndex(d => d.q === hex.q && d.r === hex.r);
      if (existing >= 0) {
        showDotPopup(hex, e.clientX, e.clientY);
      } else {
        state.dots.push({ q: hex.q, r: hex.r, color: state.currentColor, title: '', text: '' });
        render();
      }
    } else {
      state.isDragging = true;
      state.dragStartWorld = { x: world.x, y: world.y };
    }
  }

  function handleMouseMove(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = screenToWorld(x, y);
    const hex = pixelToHex(world.x, world.y);
    state.hoveredHex = hex;

    if (state.isDragging && state.currentTool === 'pan') {
      state.panX += x - state.dragStart.x;
      state.panY += y - state.dragStart.y;
      state.dragStart = { x, y };
      render();
    } else if (state.isMouseDown && (state.currentTool === 'paint' || state.currentTool === 'erase')) {
      applyHexAction(hex);
    }
    render();
  }

  function handleMouseUp() {
    state.isMouseDown = false;
    state.isDragging = false;
  }

  function handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    state.zoom = Math.max(0.1, Math.min(10, state.zoom * zoomFactor));
    document.getElementById('zoom-level').textContent = Math.round(state.zoom * 100) + '%';
    render();
  }

  function handleContextMenu(e) {
    e.preventDefault();
  }

  function applyHexAction(hex) {
    const key = hexKey(hex.q, hex.r);
    if (state.currentTool === 'erase') {
      state.hexes.delete(key);
    } else {
      state.hexes.set(key, { color: state.currentColor });
    }
    render();
  }

  function showDotPopup(hex, screenX, screenY) {
    const dot = state.dots.find(d => d.q === hex.q && d.r === hex.r);
    if (!dot) return;
    const existing = document.getElementById('dot-popup');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'dot-popup';
    popup.className = 'fixed bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50 text-sm';
    popup.style.left = screenX + 'px';
    popup.style.top = screenY + 'px';
    popup.innerHTML = `
      <div class="space-y-2">
        <input type="text" placeholder="Title" value="${dot.title || ''}" id="dot-title" class="w-40 px-2 py-1 bg-gray-700 border border-gray-600 rounded" />
        <textarea placeholder="Description" id="dot-text" class="w-40 px-2 py-1 bg-gray-700 border border-gray-600 rounded h-16">${dot.text || ''}</textarea>
        <div class="flex gap-2">
          <button id="save-dot" class="px-2 py-1 bg-purple-600 rounded hover:bg-purple-700">Save</button>
          <button id="delete-dot" class="px-2 py-1 bg-red-600 rounded hover:bg-red-700">Delete</button>
          <button id="close-popup" class="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500">X</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    document.getElementById('save-dot').onclick = () => {
      dot.title = document.getElementById('dot-title').value;
      dot.text = document.getElementById('dot-text').value;
      popup.remove();
      render();
    };
    document.getElementById('delete-dot').onclick = () => {
      state.dots = state.dots.filter(d => !(d.q === hex.q && d.r === hex.r));
      popup.remove();
      render();
    };
    document.getElementById('close-popup').onclick = () => popup.remove();
  }

  // ============ COLOR MANAGEMENT ============
  function addRecentColor(color) {
    state.recentColors = [color, ...state.recentColors.filter(c => c !== color)].slice(0, 6);
    renderColorPalette();
  }

  function renderColorPalette() {
    const recentEl = document.getElementById('recent-colors');
    const pinnedEl = document.getElementById('pinned-colors');
    recentEl.innerHTML = state.recentColors.map(c => `<button class="color-swatch w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition" style="background:${c}" data-color="${c}"></button>`).join('');
    pinnedEl.innerHTML = state.pinnedColors.map((c, i) => `<button class="color-swatch w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition" style="background:${c}" data-color="${c}" data-pinned="${i}"></button>`).join('');
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentColor = btn.dataset.color;
        document.getElementById('rgb-picker').value = btn.dataset.color;
      });
    });
  }

  // ============ SAVE/LOAD/SHARE ============
  function saveToLocal() {
    const data = { hexes: [...state.hexes], dots: state.dots, lines: state.lines, tokens: state.tokens };
    localStorage.setItem('hexmap', JSON.stringify(data));
    alert('Map saved locally!');
  }

  function loadFromLocal() {
    const raw = localStorage.getItem('hexmap');
    if (!raw) { alert('No saved map found.'); return; }
    try {
      const data = JSON.parse(raw);
      state.hexes = new Map(data.hexes);
      state.dots = data.dots || [];
      state.lines = data.lines || [];
      state.tokens = data.tokens || [];
      render();
    } catch(e) { alert('Error loading map.'); }
  }

  function shareMap() {
    const data = { h: [...state.hexes], d: state.dots, l: state.lines, t: state.tokens };
    const encoded = btoa(JSON.stringify(data));
    const url = window.location.origin + window.location.pathname + '?map=' + encoded;
    document.getElementById('share-url').value = url;
    document.getElementById('share-modal').classList.remove('hidden');
    document.getElementById('url-length-warning').classList.toggle('hidden', url.length < 1500);
  }

  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('map');
    if (!encoded) return;
    try {
      const data = JSON.parse(atob(encoded));
      state.hexes = new Map(data.h);
      state.dots = data.d || [];
      state.lines = data.l || [];
      state.tokens = data.t || [];
      render();
    } catch(e) { console.error('Error loading URL map:', e); }
  }

  function clearMap() {
    if (confirm('Clear everything? This cannot be undone.')) {
      state.hexes.clear();
      state.dots = [];
      state.lines = [];
      state.tokens = [];
      render();
    }
  }

  // ============ INIT ============
  function init() {
    state.canvas = document.getElementById('hex-canvas');
    state.ctx = state.canvas.getContext('2d');

    function resize() {
      state.canvas.width = state.canvas.offsetWidth;
      state.canvas.height = state.canvas.offsetHeight;
      render();
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse events
    state.canvas.addEventListener('mousedown', handleMouseDown);
    state.canvas.addEventListener('mousemove', handleMouseMove);
    state.canvas.addEventListener('mouseup', handleMouseUp);
    state.canvas.addEventListener('mouseleave', handleMouseUp);
    state.canvas.addEventListener('wheel', handleWheel, { passive: false });
    state.canvas.addEventListener('contextmenu', handleContextMenu);

    // Touch support
    state.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, ctrlKey: false });
    });
    state.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    });
    state.canvas.addEventListener('touchend', handleMouseUp);

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-purple-600'));
        btn.classList.add('bg-purple-600');
        state.currentTool = btn.dataset.tool;
        state.showTokenPalette = state.currentTool === 'token';
        document.getElementById('token-palette').classList.toggle('hidden', !state.showTokenPalette);
      });
    });

    // RGB picker
    const rgbPicker = document.getElementById('rgb-picker');
    rgbPicker.addEventListener('input', e => {
      state.currentColor = e.target.value;
      addRecentColor(e.target.value);
    });
    rgbPicker.addEventListener('change', e => {
      state.currentColor = e.target.value;
      addRecentColor(e.target.value);
    });

    // Pin button
    document.getElementById('pin-btn').addEventListener('click', () => {
      if (state.pinnedColors.length < 6 && !state.pinnedColors.includes(state.currentColor)) {
        state.pinnedColors.push(state.currentColor);
        renderColorPalette();
      }
    });

    // Token palette
    document.getElementById('token-shapes').innerHTML = TOKEN_SHAPES.map(s => `<button class="shape-btn w-10 h-10 bg-gray-700 hover:bg-purple-600 rounded flex items-center justify-center text-lg" data-shape="${s.id}"></button>`).join('');
    document.querySelectorAll('.shape-btn').forEach((btn, i) => {
      const shape = TOKEN_SHAPES[i];
      const miniCanvas = document.createElement('canvas');
      miniCanvas.width = miniCanvas.height = 24;
      const miniCtx = miniCanvas.getContext('2d');
      shape.draw(miniCtx, 12, 12, 10, '#fff');
      btn.appendChild(miniCanvas);
      btn.addEventListener('click', () => {
        state.currentShape = shape;
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('ring-2', 'ring-purple-400'));
        btn.classList.add('ring-2', 'ring-purple-400');
      });
    });

    // Action buttons
    document.getElementById('save-btn').addEventListener('click', saveToLocal);
    document.getElementById('load-btn').addEventListener('click', loadFromLocal);
    document.getElementById('share-btn').addEventListener('click', shareMap);
    document.getElementById('clear-btn').addEventListener('click', clearMap);

    // Share modal
    document.getElementById('copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('share-url').value);
      document.getElementById('copy-url').textContent = 'Copied!';
      setTimeout(() => document.getElementById('copy-url').textContent = 'Copy URL', 1500);
    });
    document.getElementById('close-share').addEventListener('click', () => {
      document.getElementById('share-modal').classList.add('hidden');
    });

    // Click outside popup to close
    document.addEventListener('click', e => {
      const popup = document.getElementById('dot-popup');
      if (popup && !popup.contains(e.target) && e.target.id !== 'hex-canvas') {
        popup.remove();
      }
    });

    renderColorPalette();
    loadFromURL();
    render();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
