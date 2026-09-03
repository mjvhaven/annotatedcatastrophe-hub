// Simple Hex Map - Clean Implementation
(function() {
  'use strict';

  const HEX_SIZE = 25;
  const DEFAULT_COLOR = '#4cc9f0';
  
  const state = {
    canvas: null,
    ctx: null,
    hexes: new Map(),
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    currentTool: 'paint',
    currentColor: DEFAULT_COLOR,
    hoveredHex: null
  };

  // Initialize
  function init() {
    state.canvas = document.getElementById('hex-canvas');
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext('2d');
    
    // Setup resize
    function resize() {
      state.canvas.width = Math.max(800, state.canvas.parentElement.clientWidth);
      state.canvas.height = Math.max(600, state.canvas.parentElement.clientHeight);
      render();
    }
    resize();
    window.addEventListener('resize', resize);
    
    // Mouse events
    state.canvas.addEventListener('mousedown', onMouseDown);
    state.canvas.addEventListener('mousemove', onMouseMove);
    state.canvas.addEventListener('mouseup', onMouseUp);
    state.canvas.addEventListener('mouseleave', onMouseUp);
    state.canvas.addEventListener('wheel', onWheel, { passive: false });
    state.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Touch events
    state.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    state.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    state.canvas.addEventListener('touchend', onTouchEnd);
    
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-purple-600'));
        btn.classList.add('bg-purple-600');
        state.currentTool = btn.dataset.tool;
      });
    });
    
    // Color picker
    const colorPicker = document.getElementById('rgb-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', e => {
        state.currentColor = e.target.value;
      });
    }
    
    // Action buttons
    document.getElementById('save-btn')?.addEventListener('click', saveMap);
    document.getElementById('load-btn')?.addEventListener('click', loadMap);
    document.getElementById('clear-btn')?.addEventListener('click', clearMap);
    document.getElementById('share-btn')?.addEventListener('click', shareMap);
    
    render();
  }

  // Hex math
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
    const rq = Math.round(q);
    const rr = Math.round(r);
    const rs = Math.round(s);
    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);
    if (qDiff > rDiff && qDiff > sDiff) return { q: -rr - rs, r: rr };
    if (rDiff > sDiff) return { q: rq, r: -rq - rs };
    return { q: rq, r: rr };
  }
  
  function hexKey(q, r) { return `${q},${r}`; }
  
  function getHexNeighbors(q, r) {
    return [
      {q: q+1, r: r}, {q: q-1, r: r},
      {q: q, r: r+1}, {q: q, r: r-1},
      {q: q+1, r: r-1}, {q: q-1, r: r+1}
    ];
  }
  
  function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
  
  function getVisibleBounds() {
    const canvas = state.canvas;
    const zoom = state.zoom;
    const halfW = canvas.width / 2 / Math.abs(zoom) + HEX_SIZE * 3;
    const halfH = canvas.height / 2 / Math.abs(zoom) + HEX_SIZE * 3;
    const topLeft = pixelToHex(-halfW, -halfH);
    const bottomRight = pixelToHex(halfW, halfH);
    return {
      minQ: topLeft.q - 1,
      maxQ: bottomRight.q + 1,
      minR: topLeft.r - 1,
      maxR: bottomRight.r + 1
    };
  }
  
  // Rendering
  function render() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width/2 + state.panX, canvas.height/2 + state.panY);
    ctx.scale(state.zoom, state.zoom);
    
    // Draw grid background
    const bounds = getVisibleBounds();
    for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
      for (let r = bounds.minR; r <= bounds.maxR; r++) {
        drawHex(q, r);
      }
    }
    
    ctx.restore();
  }
  
  function drawHex(q, r) {
    const ctx = state.ctx;
    const key = hexKey(q, r);
    const hexState = state.hexes.get(key);
    
    const center = hexToPixel(q, r);
    ctx.save();
    ctx.translate(center.x, center.y);
    
    // Always draw hex outline
    ctx.beginPath();
    ctx.moveTo(HEX_SIZE * Math.cos(-Math.PI/6), HEX_SIZE * Math.sin(-Math.PI/6));
    for (let i = 1; i <= 6; i++) {
      const angle = -Math.PI/6 + (Math.PI/3) * i;
      ctx.lineTo(HEX_SIZE * Math.cos(angle), HEX_SIZE * Math.sin(angle));
    }
    ctx.closePath();
    
    // Fill background if painted
    if (hexState && hexState.color) {
      ctx.fillStyle = hexState.color;
      ctx.fill();
    }
    
    // Stroke outline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Event handlers
  function onMouseDown(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = screenToWorld(x, y);
    const hex = pixelToHex(world.x, world.y);
    state.lastMouse = { x, y };
    
    if (e.button === 2) return; // Right click
    
    if (state.currentTool === 'paint') {
      paintHex(hex);
    } else if (state.currentTool === 'erase') {
      eraseHex(hex);
    } else if (state.currentTool === 'pan') {
      state.isDragging = true;
    }
    
    render();
  }
  
  function onMouseMove(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (state.isDragging) {
      state.panX += x - state.lastMouse.x;
      state.panY += y - state.lastMouse.y;
      state.lastMouse = { x, y };
      render();
    }
  }
  
  function onMouseUp() {
    state.isDragging = false;
  }
  
  function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    state.zoom = Math.max(0.2, Math.min(3, state.zoom * zoomFactor));
    render();
  }
  
  function onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = state.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    state.lastMouse = { x, y };
    
    if (state.currentTool === 'paint') {
      const world = screenToWorld(x, y);
      const hex = pixelToHex(world.x, world.y);
      paintHex(hex);
    } else if (state.currentTool === 'erase') {
      const world = screenToWorld(x, y);
      const hex = pixelToHex(world.x, world.y);
      eraseHex(hex);
    }
    
    render();
  }
  
  function onTouchMove(e) {
    e.preventDefault();
    if (state.isDragging) {
      const touch = e.touches[0];
      const rect = state.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      state.panX += x - state.lastMouse.x;
      state.panY += y - state.lastMouse.y;
      state.lastMouse = { x, y };
      render();
    }
  }
  
  function onTouchEnd() {
    state.isDragging = false;
  }
  
  // Map operations
  function paintHex(hex) {
    const key = hexKey(hex.q, hex.r);
    state.hexes.set(key, { color: state.currentColor });
  }
  
  function eraseHex(hex) {
    const key = hexKey(hex.q, hex.r);
    state.hexes.delete(key);
  }
  
  function screenToWorld(x, y) {
    return {
      x: (x - state.canvas.width/2 - state.panX) / state.zoom,
      y: (y - state.canvas.height/2 - state.panY) / state.zoom
    };
  }
  
  // Save/Load/Clear/Share
  function saveMap() {
    const data = {
      hexes: Array.from(state.hexes),
      version: '1.0'
    };
    localStorage.setItem('hexmap', JSON.stringify(data));
    alert('Map saved!');
  }
  
  function loadMap() {
    const data = localStorage.getItem('hexmap');
    if (!data) {
      alert('No saved map found.');
      return;
    }
    try {
      const parsed = JSON.parse(data);
      state.hexes = new Map(parsed.hexes || []);
      render();
      alert('Map loaded!');
    } catch(e) {
      alert('Error loading map: ' + e.message);
    }
  }
  
  function clearMap() {
    if (confirm('Clear all hexes?')) {
      state.hexes.clear();
      render();
    }
  }
  
  function shareMap() {
    const data = {
      hexes: Array.from(state.hexes),
      version: '1.0'
    };
    const encoded = btoa(JSON.stringify(data));
    const url = window.location.origin + window.location.pathname + '?map=' + encoded;
    navigator.clipboard.writeText(url).then(() => {
      alert('Shareable URL copied to clipboard!');
    }).catch(() => {
      alert('Could not copy to clipboard. URL: ' + url);
    });
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();