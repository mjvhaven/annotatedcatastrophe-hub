// Hex Map Maker - Main Application
(function() {
  'use strict';

  const HEX_SIZE = 30;
  const DEFAULT_COLORS = ['#7c3aed', '#dc2626', '#059669', '#2563eb', '#ca8a04', '#db2777'];
  const TOKEN_SHAPES = [
    { id: 'circle', draw: function(ctx, x, y, s, c) { ctx.beginPath(); ctx.arc(x, y, s*0.8, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'square', draw: function(ctx, x, y, s, c) { var r = s*0.7; ctx.fillStyle = c; ctx.fillRect(x-r, y-r, r*2, r*2); } },
    { id: 'triangle', draw: function(ctx, x, y, s, c) { ctx.beginPath(); ctx.moveTo(x, y-s*0.9); ctx.lineTo(x+s*0.8, y+s*0.6); ctx.lineTo(x-s*0.8, y+s*0.6); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'diamond', draw: function(ctx, x, y, s, c) { ctx.beginPath(); ctx.moveTo(x, y-s*0.9); ctx.lineTo(x+s*0.7, y); ctx.lineTo(x, y+s*0.9); ctx.lineTo(x-s*0.7, y); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); } },
    { id: 'star', draw: function(ctx, x, y, s, c) { var pts=5,inn=s*0.4,out=s*0.9;ctx.beginPath();for(var i=0;i<pts*2;i++){var r=i%2?inn:out,a=(i*Math.PI/pts)-Math.PI/2;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=c;ctx.fill();} },
    { id: 'x', draw: function(ctx, x, y, s, c) { ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.5);ctx.lineTo(x+s*0.5,y+s*0.5);ctx.moveTo(x+s*0.5,y-s*0.5);ctx.lineTo(x-s*0.5,y+s*0.5);ctx.stroke(); } },
    { id: 'cross', draw: function(ctx, x, y, s, c) { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-s*0.6);ctx.lineTo(x,y+s*0.6);ctx.moveTo(x-s*0.6,y);ctx.lineTo(x+s*0.6,y);ctx.stroke(); } },
    { id: 'heart', draw: function(ctx, x, y, s, c) { ctx.beginPath();var t=s*0.4;ctx.moveTo(x,y+s*0.5);ctx.bezierCurveTo(x-s*0.5,y,x-s*0.8,t,x-s*0.8,-t);ctx.bezierCurveTo(x-s*0.8,-s*0.5,x,y+s*0.1,x,y+s*0.5);ctx.bezierCurveTo(x,y+s*0.1,x+s*0.8,-s*0.5,x+s*0.8,-t);ctx.bezierCurveTo(x+s*0.8,t,x+s*0.5,y,x,y+s*0.5);ctx.fillStyle=c;ctx.fill(); } },
    { id: 'arrow', draw: function(ctx, x, y, s, c) { ctx.beginPath();ctx.moveTo(x,y-s*0.7);ctx.lineTo(x+s*0.4,y+s*0.2);ctx.lineTo(x+s*0.15,y+s*0.2);ctx.lineTo(x+s*0.15,y+s*0.7);ctx.lineTo(x-s*0.15,y+s*0.7);ctx.lineTo(x-s*0.15,y+s*0.2);ctx.lineTo(x-s*0.4,y+s*0.2);ctx.closePath();ctx.fillStyle=c;ctx.fill(); } },
    { id: 'trefoil', draw: function(ctx, x, y, s, c) { ctx.fillStyle=c;for(var i=0;i<3;i++){var a=(i*120-90)*Math.PI/180;ctx.beginPath();ctx.arc(x+s*0.45*Math.cos(a),y+s*0.45*Math.sin(a),s*0.35,0,Math.PI*2);ctx.fill();} } },
    { id: 'quatrefoil', draw: function(ctx, x, y, s, c) { ctx.fillStyle=c;for(var i=0;i<4;i++){var a=(i*90-45)*Math.PI/180;ctx.beginPath();ctx.arc(x+s*0.4*Math.cos(a),y+s*0.4*Math.sin(a),s*0.35,0,Math.PI*2);ctx.fill();} } },
    { id: 'kite', draw: function(ctx, x, y, s, c) { ctx.beginPath();ctx.moveTo(x,y-s*0.9);ctx.lineTo(x+s*0.5,y);ctx.lineTo(x,y+s*0.3);ctx.lineTo(x-s*0.5,y);ctx.closePath();ctx.fillStyle=c;ctx.fill(); } },
    { id: 'ring', draw: function(ctx, x, y, s, c) { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,s*0.6,0,Math.PI*2);ctx.stroke(); } },
    { id: 'tick', draw: function(ctx, x, y, s, c) { ctx.strokeStyle=c;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-s*0.5,y);ctx.lineTo(x-s*0.15,y+s*0.3);ctx.lineTo(x+s*0.5,y-s*0.3);ctx.stroke(); } },
    { id: 'sixstar', draw: function(ctx, x, y, s, c) { var pts=6,inn=s*0.4,out=s*0.9;ctx.beginPath();for(var i=0;i<pts*2;i++){var r=i%2?inn:out,a=(i*Math.PI/pts)-Math.PI/2;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=c;ctx.fill(); } }
  ];

  var state = {
    canvas: null, ctx: null,
    hexes: new Map(), dots: [], lines: [], tokens: [],
    currentTool: 'paint', currentColor: '#7c3aed', currentShape: TOKEN_SHAPES[0],
    lineStartHex: null, lineStyle: 'solid',
    recentColors: DEFAULT_COLORS.slice(), pinnedColors: [],
    zoom: 1, panX: 0, panY: 0,
    isDragging: false, dragStart: { x: 0, y: 0 },
    isMouseDown: false, hoveredHex: null
  };

  function hexToPixel(q, r) {
    return { x: HEX_SIZE * (3/2 * q), y: HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) };
  }

  function pixelToHex(px, py) {
    var q = (2/3 * px) / HEX_SIZE;
    var r = (-1/3 * px + Math.sqrt(3)/3 * py) / HEX_SIZE;
    return hexRound(q, r);
  }

  function hexRound(q, r) {
    var s = -q - r;
    var rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    var qDiff = Math.abs(rq - q), rDiff = Math.abs(rr - r), sDiff = Math.abs(rs - s);
    if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
    else if (rDiff > sDiff) rr = -rq - rs;
    return { q: rq, r: rr };
  }

  function hexKey(q, r) { return q+','+r; }

  function getHexNeighbors(q, r) {
    return [{q:q+1,r:r},{q:q-1,r:r},{q:q,r+1},{q:q,r-1},{q:q+1,r:r-1},{q:q-1,r:r+1}];
  }

  function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  function getHexLinePath(start, end) {
    var line = [];
    var current = { q: start.q, r: start.r };
    var target = { q: end.q, r: end.r };
    var attempts = 0;
    while ((current.q !== target.q || current.r !== target.r) && attempts++ < 200) {
      var neighbors = getHexNeighbors(current.q, current.r);
      neighbors.sort(function(a, b) { return hexDistance(a, target) - hexDistance(b, target); });
      line.push({ q: current.q, r: current.r });
      current = neighbors[0];
    }
    line.push({ q: target.q, r: target.r });
    return line;
  }

  function render() {
    var ctx = state.ctx, canvas = state.canvas, zoom = state.zoom, panX = state.panX, panY = state.panY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2 + panX, canvas.height/2 + panY);
    ctx.scale(zoom, zoom);

    var bounds = getVisibleBounds();
    for (var q = bounds.minQ; q <= bounds.maxQ; q++) {
      for (var r = bounds.minR; r <= bounds.maxR; r++) {
        drawHex(q, r);
      }
    }

    state.lines.forEach(function(line) {
      var hexes = getHexLinePath(line.start, line.end);
      drawHexLine(hexes, line.color, line.style);
    });

    state.dots.forEach(function(dot) { drawDot(dot); });
    state.tokens.forEach(function(token) { drawToken(token); });

    if (state.hoveredHex) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      drawHexOutline(state.hoveredHex.q, state.hoveredHex.r);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function getVisibleBounds() {
    var canvas = state.canvas, zoom = state.zoom;
    var halfW = canvas.width/2/Math.abs(zoom) + HEX_SIZE * 3;
    var halfH = canvas.height/2/Math.abs(zoom) + HEX_SIZE * 3;
    var topLeft = pixelToHex(-halfW, -halfH);
    var bottomRight = pixelToHex(halfW, halfH);
    return { minQ: topLeft.q-1, maxQ: bottomRight.q+1, minR: topLeft.r-1, maxR: bottomRight.r+1 };
  }

  function drawHex(q, r) {
    var ctx = state.ctx;
    var key = hexKey(q, r);
    var hex = state.hexes.get(key);
    var pos = hexToPixel(q, r);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.beginPath();
    ctx.moveTo(HEX_SIZE * Math.cos(-Math.PI/6), HEX_SIZE * Math.sin(-Math.PI/6));
    for (var i = 1; i <= 6; i++) {
      var angle = -Math.PI/6 + (Math.PI/3) * i;
      ctx.lineTo(HEX_SIZE * Math.cos(angle), HEX_SIZE * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = '#374151';
    ctx.fill();
    if (hex && hex.color) {
      ctx.fillStyle = hex.color;
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawHexOutline(q, r) {
    var ctx = state.ctx;
    var center = hexToPixel(q, r);
    ctx.beginPath();
    ctx.moveTo(center.x + HEX_SIZE * Math.cos(-Math.PI/6), center.y + HEX_SIZE * Math.sin(-Math.PI/6));
    for (var i = 1; i <= 6; i++) {
      var angle = -Math.PI/6 + (Math.PI/3) * i;
      ctx.lineTo(center.x + HEX_SIZE * Math.cos(angle), center.y + HEX_SIZE * Math.sin(angle));
    }
    ctx.closePath();
  }

  function drawHexLine(hexes, color, style) {
    var ctx = state.ctx;
    if (hexes.length < 1) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (style === 'dashed') ctx.setLineDash([10, 8]);
    else if (style === 'dotted') ctx.setLineDash([4, 6]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    var start = hexToPixel(hexes[0].q, hexes[0].r);
    ctx.moveTo(start.x, start.y);
    for (var i = 1; i < hexes.length; i++) {
      var p = hexToPixel(hexes[i].q, hexes[i].r);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawDot(dot) {
    var ctx = state.ctx;
    var pos = hexToPixel(dot.q, dot.r);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI*2);
    ctx.fillStyle = dot.color || '#ff6b6b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawToken(token) {
    var ctx = state.ctx;
    var shape = TOKEN_SHAPES.find(function(s) { return s.id === token.shape; }) || TOKEN_SHAPES[0];
    ctx.save();
    ctx.translate(token.x, token.y);
    shape.draw(ctx, 0, 0, 20, token.color || '#7c3aed');
    if (token.label) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(token.label, 0, -24);
    }
    ctx.restore();
  }

  function screenToWorld(screenX, screenY) {
    var canvas = state.canvas, zoom = state.zoom, panX = state.panX, panY = state.panY;
    return { x: (screenX - canvas.width/2 - panX) / zoom, y: (screenY - canvas.height/2 - panY) / zoom };
  }

  function handleMouseDown(e) {
    var rect = state.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var world = screenToWorld(x, y);
    var hex = pixelToHex(world.x, world.y);

    if (e.button === 2 || e.ctrlKey) {
      showContextMenu(hex, e.clientX, e.clientY);
      return;
    }

    state.isMouseDown = true;
    state.dragStart = { x: x, y: y };

    if (state.currentTool === 'paint') {
      applyHexAction(hex);
    } else if (state.currentTool === 'erase') {
      eraseHex(hex);
    } else if (state.currentTool === 'line') {
      if (!state.lineStartHex) {
        state.lineStartHex = hex;
      } else {
        state.lines.push({ start: state.lineStartHex, end: hex, color: state.currentColor, style: state.lineStyle });
        state.lineStartHex = null;
        render();
      }
    } else if (state.currentTool === 'token') {
      var token = { x: world.x, y: world.y, shape: state.currentShape.id, color: state.currentColor, label: '', text: '' };
      state.tokens.push(token);
      render();
    } else if (state.currentTool === 'dot') {
      var existing = state.dots.findIndex(function(d) { return d.q === hex.q && d.r === hex.r; });
      if (existing >= 0) {
        showDotPopup(state.dots[existing], e.clientX, e.clientY);
      } else {
        state.dots.push({ q: hex.q, r: hex.r, color: state.currentColor, title: '', text: '' });
        render();
      }
    } else if (state.currentTool === 'pan') {
      state.isDragging = true;
    }
  }

  function handleMouseMove(e) {
    var rect = state.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var world = screenToWorld(x, y);
    var hex = pixelToHex(world.x, world.y);
    state.hoveredHex = hex;

    if (state.isDragging) {
      state.panX += x - state.dragStart.x;
      state.panY += y - state.dragStart.y;
      state.dragStart = { x: x, y: y };
    } else if (state.isMouseDown && state.currentTool === 'paint') {
      applyHexAction(hex);
    } else if (state.isMouseDown && state.currentTool === 'erase') {
      eraseHex(hex);
    }
    render();
  }

  function handleMouseUp() {
    state.isMouseDown = false;
    state.isDragging = false;
  }

  function handleWheel(e) {
    e.preventDefault();
    var zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    state.zoom = Math.max(0.1, Math.min(10, state.zoom * zoomFactor));
    var zl = document.getElementById('zoom-level');
    if (zl) zl.textContent = Math.round(state.zoom * 100) + '%';
    render();
  }

  function applyHexAction(hex) {
    state.hexes.set(hexKey(hex.q, hex.r), { color: state.currentColor });
    render();
  }

  function eraseHex(hex) {
    state.hexes.delete(hexKey(hex.q, hex.r));
    state.dots = state.dots.filter(function(d) { return !(d.q === hex.q && d.r === hex.r); });
    state.lines = state.lines.filter(function(l) {
      return !(l.start.q === hex.q && l.start.r === hex.r) && !(l.end.q === hex.q && l.end.r === hex.r);
    });
    render();
  }

  function showContextMenu(hex, screenX, screenY) {
    var dot = state.dots.find(function(d) { return d.q === hex.q && d.r === hex.r; });
    var token = null;
    for (var i = 0; i < state.tokens.length; i++) {
      var t = state.tokens[i];
      var pos = hexToPixel(hex.q, hex.r);
      if (Math.abs(t.x - pos.x) < HEX_SIZE && Math.abs(t.y - pos.y) < HEX_SIZE) {
        token = t; break;
      }
    }
    if (dot) showDotPopup(dot, screenX, screenY);
    else if (token) showTokenPopup(token, screenX, screenY);
  }

  function showDotPopup(dot, screenX, screenY) {
    var existing = document.getElementById('dot-popup');
    if (existing) existing.remove();
    var popup = document.createElement('div');
    popup.id = 'dot-popup';
    popup.className = 'fixed bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50 text-sm';
    popup.style.left = Math.min(screenX, window.innerWidth - 270) + 'px';
    popup.style.top = Math.min(screenY, window.innerHeight - 220) + 'px';
    popup.innerHTML = '<div class="space-y-2"><div class="text-gray-400 text-xs">Dot Title</div><input type="text" placeholder="Title" value="' + (dot.title || '').replace(/"/g, '&quot;') + '" id="dot-title" class="w-56 px-2 py-1 bg-gray-700 border border-gray-600 rounded" /><div class="text-gray-400 text-xs">Description</div><textarea placeholder="Description" id="dot-text" class="w-56 px-2 py-1 bg-gray-700 border border-gray-600 rounded h-20">' + (dot.text || '') + '</textarea><div class="flex gap-2 mt-2"><button id="save-dot" class="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700">Save</button><button id="delete-dot" class="px-3 py-1 bg-red-600 rounded hover:bg-red-700">Delete</button><button id="close-popup" class="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500">X</button></div></div>';
    document.body.appendChild(popup);
    document.getElementById('save-dot').onclick = function() {
      dot.title = document.getElementById('dot-title').value;
      dot.text = document.getElementById('dot-text').value;
      popup.remove();
      render();
    };
    document.getElementById('delete-dot').onclick = function() {
      state.dots = state.dots.filter(function(d) { return !(d.q === dot.q && d.r === dot.r); });
      popup.remove();
      render();
    };
    document.getElementById('close-popup').onclick = function() { popup.remove(); };
  }

  function showTokenPopup(token, screenX, screenY) {
    var existing = document.getElementById('dot-popup');
    if (existing) existing.remove();
    var popup = document.createElement('div');
    popup.id = 'dot-popup';
    popup.className = 'fixed bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50 text-sm';
    popup.style.left = Math.min(screenX, window.innerWidth - 270) + 'px';
    popup.style.top = Math.min(screenY, window.innerHeight - 220) + 'px';
    popup.innerHTML = '<div class="space-y-2"><div class="text-gray-400 text-xs">Token Label</div><input type="text" placeholder="Token Label" value="' + (token.label || '').replace(/"/g, '&quot;') + '" id="token-label" class="w-56 px-2 py-1 bg-gray-700 border border-gray-600 rounded" /><div class="text-gray-400 text-xs">Token Description</div><textarea placeholder="Description" id="token-text" class="w-56 px-2 py-1 bg-gray-700 border border-gray-600 rounded h-20">' + (token.text || '') + '</textarea><div class="flex gap-2 mt-2"><button id="save-token" class="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700">Save</button><button id="delete-token" class="px-3 py-1 bg-red-600 rounded hover:bg-red-700">Delete</button><button id="close-popup" class="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500">X</button></div></div>';
    document.body.appendChild(popup);
    document.getElementById('save-token').onclick = function() {
      token.label = document.getElementById('token-label').value;
      token.text = document.getElementById('token-text').value;
      popup.remove();
      render();
    };
    document.getElementById('delete-token').onclick = function() {
      state.tokens = state.tokens.filter(function(t) { return t !== token; });
      popup.remove();
      render();
    };
    document.getElementById('close-popup').onclick = function() { popup.remove(); };
  }

  function addRecentColor(color) {
    state.recentColors = [color].concat(state.recentColors.filter(function(c) { return c !== color; })).slice(0, 6);
    renderColorPalette();
  }

  function renderColorPalette() {
    var recentEl = document.getElementById('recent-colors');
    var pinnedEl = document.getElementById('pinned-colors');
    if (!recentEl || !pinnedEl) return;
    recentEl.innerHTML = state.recentColors.map(function(c) {
      return '<button class="color-swatch w-9 h-9 rounded border-2 border-gray-600 hover:border-white transition cursor-pointer" style="background:' + c + '" data-color="' + c + '"></button>';
    }).join('');
    pinnedEl.innerHTML = state.pinnedColors.map(function(c, i) {
      return '<button class="color-swatch w-9 h-9 rounded border-2 border-gray-600 hover:border-white transition cursor-pointer" style="background:' + c + '" data-color="' + c + '" data-pinned="' + i + '"></button>';
    }).join('');
    document.querySelectorAll('.color-swatch').forEach(function(btn) {
      btn.onclick = function() {
        state.currentColor = btn.dataset.color;
        var rp = document.getElementById('rgb-picker');
        if (rp) rp.value = btn.dataset.color;
      };
    });
  }

  function saveToLocal() {
    var data = { hexes: Array.from(state.hexes), dots: state.dots, lines: state.lines, tokens: state.tokens };
    localStorage.setItem('hexmap', JSON.stringify(data));
    alert('Map saved!');
  }

  function loadFromLocal() {
    var raw = localStorage.getItem('hexmap');
    if (!raw) { alert('No saved map found.'); return; }
    try {
      var data = JSON.parse(raw);
      state.hexes = new Map(data.hexes);
      state.dots = data.dots || [];
      state.lines = data.lines || [];
      state.tokens = data.tokens || [];
      render();
    } catch(e) { alert('Error loading map.'); }
  }

  function shareMap() {
    var data = { h: Array.from(state.hexes), d: state.dots, l: state.lines, t: state.tokens };
    var encoded = btoa(JSON.stringify(data));
    var url = window.location.origin + window.location.pathname + '?map=' + encoded;
    var su = document.getElementById('share-url');
    if (su) su.value = url;
    var sm = document.getElementById('share-modal');
    if (sm) sm.classList.remove('hidden');
    var warn = document.getElementById('url-length-warning');
    if (warn) warn.classList.toggle('hidden', url.length < 1500);
  }

  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var encoded = params.get('map');
    if (!encoded) return;
    try {
      var data = JSON.parse(atob(encoded));
      state.hexes = new Map(data.h);
      state.dots = data.d || [];
      state.lines = data.l || [];
      state.tokens = data.t || [];
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

  function init() {
    state.canvas = document.getElementById('hex-canvas');
    if (!state.canvas) { console.error('Canvas element not found!'); return; }
    state.ctx = state.canvas.getContext('2d');

    function resize() {
      var container = state.canvas.parentElement;
      state.canvas.width = Math.max(container.offsetWidth, 800);
      state.canvas.height = Math.max(container.offsetHeight, 500);
      render();
    }
    resize();
    window.addEventListener('resize', resize);

    state.canvas.addEventListener('mousedown', handleMouseDown);
    state.canvas.addEventListener('mousemove', handleMouseMove);
    state.canvas.addEventListener('mouseup', handleMouseUp);
    state.canvas.addEventListener('mouseleave', handleMouseUp);
    state.canvas.addEventListener('wheel', handleWheel, { passive: false });
    state.canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    state.canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, ctrlKey: false });
    }, { passive: false });
    state.canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    state.canvas.addEventListener('touchend', handleMouseUp);

    document.querySelectorAll('.tool-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tool-btn').forEach(function(b) { b.classList.remove('bg-purple-600'); });
        btn.classList.add('bg-purple-600');
        state.currentTool = btn.dataset.tool;
        var tp = document.getElementById('token-palette');
        if (tp) tp.classList.toggle('hidden', state.currentTool !== 'token');
      });
    });

    var rgbPicker = document.getElementById('rgb-picker');
    if (rgbPicker) {
      rgbPicker.addEventListener('input', function(e) { state.currentColor = e.target.value; });
      rgbPicker.addEventListener('change', function(e) {
        state.currentColor = e.target.value;
        addRecentColor(e.target.value);
      });
    }

    var pinBtn = document.getElementById('pin-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', function() {
        if (state.pinnedColors.length < 6 && state.pinnedColors.indexOf(state.currentColor) === -1) {
          state.pinnedColors.push(state.currentColor);
          renderColorPalette();
        }
      });
    }

    var ts = document.getElementById('token-shapes');
    if (ts) {
      ts.innerHTML = TOKEN_SHAPES.map(function(s, i) {
        return '<button class="shape-btn w-10 h-10 bg-gray-700 hover:bg-purple-600 rounded flex items-center justify-center cursor-pointer" data-shape="' + s.id + '"></button>';
      }).join('');

      document.querySelectorAll('.shape-btn').forEach(function(btn, i) {
        var shape = TOKEN_SHAPES[i];
        var miniCanvas = document.createElement('canvas');
        miniCanvas.width = miniCanvas.height = 24;
        var miniCtx = miniCanvas.getContext('2d');
        shape.draw(miniCtx, 12, 12, 10, '#fff');
        btn.appendChild(miniCanvas);
        btn.addEventListener('click', function() {
          state.currentShape = shape;
          document.querySelectorAll('.shape-btn').forEach(function(b) { b.classList.remove('ring-2', 'ring-purple-400'); });
          btn.classList.add('ring-2', 'ring-purple-400');
        });
      });
    }

    var sBtn = document.getElementById('save-btn');
    if (sBtn) sBtn.addEventListener('click', saveToLocal);
    var lBtn = document.getElementById('load-btn');
    if (lBtn) lBtn.addEventListener('click', loadFromLocal);
    var shBtn = document.getElementById('share-btn');
    if (shBtn) shBtn.addEventListener('click', shareMap);
    var clBtn = document.getElementById('clear-btn');
    if (clBtn) clBtn.addEventListener('click', clearMap);

    var cBtn = document.getElementById('copy-url');
    if (cBtn) {
      cBtn.addEventListener('click', function() {
        var su = document.getElementById('share-url');
        if (su) {
          navigator.clipboard.writeText(su.value);
          cBtn.textContent = 'Copied!';
          setTimeout(function() { cBtn.textContent = 'Copy URL'; }, 1500);
        }
      });
    }
    var csBtn = document.getElementById('close-share');
    if (csBtn) {
      csBtn.addEventListener('click', function() {
        var sm = document.getElementById('share-modal');
        if (sm) sm.classList.add('hidden');
      });
    }

    document.addEventListener('click', function(e) {
      var popup = document.getElementById('dot-popup');
      if (popup && !popup.contains(e.target) && e.target.id !== 'hex-canvas') {
        popup.remove();
      }
    });

    renderColorPalette();
    loadFromURL();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
