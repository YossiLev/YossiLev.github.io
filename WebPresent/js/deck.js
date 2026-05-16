/**
 * DECK.JS — Web Presentation Framework
 * Controls: ↑↓ or Space = slides | ←→ = animation states | F = fullscreen | T = TTS
 */

class DeckEngine {
  constructor(options = {}) {
    this.options = {
      transitionDuration: 500,
      defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ttsEnabled: true,
      progressBar: true,
      slideCounter: true,
      ...options
    };

    this.slides = [];
    this.currentSlide = (parseInt(options.initialSlide) || 1) - 1;
    this.isTransitioning = false;
    this.ttsQueue = [];
    this.speechSynth = window.speechSynthesis || null;
    this.chartInstances = {};

    this.init();
  }

  init() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    if (this.slides.length === 0) return;

    this.buildUI();
    this.initSlides();
    this.bindKeys();
    this.bindTouch();
    this.goToSlide(this.currentSlide, true);
    this.maybeAutoNarrate();
  }

  // ─── UI Shell ────────────────────────────────────────────────────────────────

  buildUI() {
    // Progress bar
    if (this.options.progressBar) {
      this.progressEl = document.createElement('div');
      this.progressEl.className = 'deck-progress';
      this.progressEl.innerHTML = '<div class="deck-progress-fill"></div>';
      document.body.appendChild(this.progressEl);
    }

    // Slide counter
    if (this.options.slideCounter) {
      this.counterEl = document.createElement('div');
      this.counterEl.className = 'deck-counter';
      document.body.appendChild(this.counterEl);
    }

    // Nav hints
    this.hintsEl = document.createElement('div');
    this.hintsEl.className = 'deck-hints';
    this.hintsEl.innerHTML = `
      <span title="Previous slide">↑</span>
      <span title="Next slide">↓</span>
      <span title="Prev state">←</span>
      <span title="Next state">→</span>
      <span title="Fullscreen">F</span>
      <span title="Speech">T</span>
    `;
    document.body.appendChild(this.hintsEl);

    // Fullscreen button
    const fsBtn = document.createElement('button');
    fsBtn.className = 'deck-fullscreen-btn';
    fsBtn.innerHTML = '⛶';
    fsBtn.title = 'Fullscreen (F)';
    fsBtn.addEventListener('click', () => this.toggleFullscreen());
    document.body.appendChild(fsBtn);
  }

  updateUI() {
    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    }
    if (this.progressEl) {
      const pct = ((this.currentSlide) / (this.slides.length - 1)) * 100;
      this.progressEl.querySelector('.deck-progress-fill').style.width = pct + '%';
    }
  }

  // ─── Slide Initialization ────────────────────────────────────────────────────

  initSlides() {
    this.slides.forEach((slide, si) => {
      slide.dataset.slideIndex = si;

      // Count states
      const stateCount = this.getSlideStateCount(slide);
      slide.dataset.stateCount = stateCount;
      slide.dataset.currentState = 0;

      // Set all elements to state 1 initially
      const els = slide.querySelectorAll('[data-pos-1], [data-show-1], [data-hide-1], [data-class-1]');
      els.forEach(el => this.applyState(el, 0, true));

      // Init charts
      slide.querySelectorAll('[data-chart]').forEach(el => {
        this.initChart(el);
      });

      // Hide all slides
      slide.classList.add('slide--hidden');
      slide.classList.remove('slide--active', 'slide--prev');
    });
  }

  getSlideStateCount(slide) {
    let max = 1;
    slide.querySelectorAll('*').forEach(el => {
      Object.keys(el.dataset).forEach(key => {
        const m = key.match(/^pos-(\d+)$|^show-(\d+)$|^hide-(\d+)$|^class-(\d+)$|^opacity-(\d+)$|^scale-(\d+)$|^rotate-(\d+)$|^add-(\d+)$|^remove-(\d+)$/);
        if (m) {
          const n = parseInt(m[1] || m[2] || m[3] || m[4] || m[5] || m[6] || m[7] || m[8] || m[9]);
          if (n > max) max = n;
        }
      });
      if (el.dataset.chartState) {
        const n = parseInt(el.dataset.chartState);
        if (n > max - 1) max = n + 1;
      }
    });
    return max;
  }

  // ─── Slide Navigation ────────────────────────────────────────────────────────

  goToSlide(index, instant = false) {
    if (this.isTransitioning && !instant) return;
    if (index < 0 || index >= this.slides.length) return;

    const prev = this.slides[this.currentSlide];
    const next = this.slides[index];

    const direction = index > this.currentSlide ? 'down' : 'up';

    if (!instant) {
      this.isTransitioning = true;
      prev.classList.remove('slide--active');
      prev.classList.add(direction === 'down' ? 'slide--prev' : 'slide--next');
      next.classList.remove('slide--hidden', 'slide--prev', 'slide--next');
      next.classList.add('slide--entering-' + direction);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          next.classList.remove('slide--entering-' + direction);
          next.classList.add('slide--active');
          prev.classList.add('slide--hidden');
          prev.classList.remove('slide--prev', 'slide--next');

          setTimeout(() => {
            this.isTransitioning = false;
          }, this.options.transitionDuration);
        });
      });
    } else {
      if (prev !== next) {
        prev.classList.remove('slide--active');
        prev.classList.add('slide--hidden');
      }
      next.classList.remove('slide--hidden', 'slide--prev', 'slide--next');
      next.classList.add('slide--active');
    }

    this.currentSlide = index;
    next.dataset.currentState = 0;
    this.applySlideState(next, 0, instant);
    this.updateUI();
    this.maybeAutoNarrate();

    // Dispatch event
    document.dispatchEvent(new CustomEvent('deck:slide', {
      detail: { index, slide: next, direction }
    }));
  }

  nextSlide() { this.goToSlide(this.currentSlide + 1); }
  prevSlide() { this.goToSlide(this.currentSlide - 1); }

  // ─── State Animation ─────────────────────────────────────────────────────────

  nextState() {
    const slide = this.slides[this.currentSlide];
    const current = parseInt(slide.dataset.currentState);
    const max = parseInt(slide.dataset.stateCount);
    if (current < max - 1) {
      const next = current + 1;
      slide.dataset.currentState = next;
      this.applySlideState(slide, next);
    } else {
      this.nextSlide();
    }
  }

  prevState() {
    const slide = this.slides[this.currentSlide];
    const current = parseInt(slide.dataset.currentState);
    if (current > 0) {
      const prev = current - 1;
      slide.dataset.currentState = prev;
      this.applySlideState(slide, prev);
    } else {
      this.prevSlide();
    }
  }

  applySlideState(slide, stateIndex, instant = false) {
    const els = slide.querySelectorAll('[data-pos-1], [data-show-1], [data-hide-1], [data-class-1], [data-opacity-1], [data-add-1], [data-remove-1], [data-scale-1], [data-rotate-1]');
    els.forEach(el => this.applyState(el, stateIndex, instant));

    // Trigger chart reveal if any
    slide.querySelectorAll('[data-chart][data-chart-state]').forEach(el => {
      const triggerState = parseInt(el.dataset.chartState);
      if (stateIndex >= triggerState) {
        this.animateChart(el, stateIndex);
      }
    });

    document.dispatchEvent(new CustomEvent('deck:state', {
      detail: { stateIndex, slide }
    }));
  }

  applyState(el, stateIndex, instant = false) {
    const dur = instant ? '0ms' : (el.dataset.duration || this.options.transitionDuration + 'ms');
    const ease = el.dataset.easing || this.options.defaultEasing;

    el.style.transition = instant ? 'none' : `all ${dur} ${ease}`;

    // ── Position ──
    // Find best matching position ≤ stateIndex
    for (let s = stateIndex; s >= 0; s--) {
      const posKey = `pos-${s + 1}`;
      if (el.dataset[posKey] !== undefined) {
        const [x, y] = this.parsePos(el.dataset[posKey]);
        el.style.transform = `translate(${x}, ${y})`;
        break;
      }
      if (s === 0 && el.dataset['pos-1'] === undefined) {
        // no pos defined, leave as-is
      }
    }

    // ── Opacity ──
    for (let s = stateIndex; s >= 0; s--) {
      const key = `opacity-${s + 1}`;
      if (el.dataset[key] !== undefined) {
        el.style.opacity = el.dataset[key];
        break;
      }
    }

    // ── Show/Hide ──
    let visible = null;
    for (let s = stateIndex; s >= 0; s--) {
      if (el.dataset[`show-${s + 1}`] !== undefined) { visible = true; break; }
      if (el.dataset[`hide-${s + 1}`] !== undefined) { visible = false; break; }
    }
    if (visible === true) {
      el.classList.remove('state-hidden');
      el.classList.add('state-visible');
    } else if (visible === false) {
      el.classList.remove('state-visible');
      el.classList.add('state-hidden');
    }

    // ── Add/Remove ──
    let appearance = null;
    for (let s = stateIndex; s >= 0; s--) {
      if (el.dataset[`add-${s + 1}`] !== undefined) { appearance = true; break; }
      if (el.dataset[`remove-${s + 1}`] !== undefined) { appearance = false; break; }
    }
    if (appearance === true) {
      el.classList.remove('state-disappearing');
      el.classList.add('state-appearing');
    } else if (appearance === false) {
      el.classList.remove('state-appearing');
      el.classList.add('state-disappearing');
    }

    // ── CSS class ──
    for (let s = stateIndex; s >= 0; s--) {
      const key = `class-${s + 1}`;
      if (el.dataset[key] !== undefined) {
        // Remove any previously applied data-class-N classes
        for (let r = 1; r <= 20; r++) {
          if (el.dataset[`class-${r}`]) el.classList.remove(el.dataset[`class-${r}`]);
        }
        el.classList.add(el.dataset[key]);
        break;
      }
    }

    // ── Scale ──
    for (let s = stateIndex; s >= 0; s--) {
      const key = `scale-${s + 1}`;
      if (el.dataset[key] !== undefined) {
        const existing = el.style.transform || '';
        const noScale = existing.replace(/scale\([^)]+\)/g, '').trim();
        el.style.transform = `${noScale} scale(${el.dataset[key]})`;
        break;
      }
    }

    // ── Rotation ──
    for (let s = stateIndex; s >= 0; s--) {
      const key = `rotate-${s + 1}`;
      if (el.dataset[key] !== undefined) {
        const existing = el.style.transform || '';
        const noRot = existing.replace(/rotate\([^)]+\)/g, '').trim();
        el.style.transform = `${noRot} rotate(${el.dataset[key]}deg)`;
        break;
      }
    }
  }

  parsePos(val) {
    // Accepts "[100px, 200px]" or "100px,200px" or "100px 200px"
    const clean = val.replace(/[\[\]]/g, '').trim();
    const parts = clean.split(/[\s,]+/);
    return [parts[0] || '0px', parts[1] || '0px'];
  }

  // ─── Charts ──────────────────────────────────────────────────────────────────

  initChart(el) {
    const type = el.dataset.chart;
    const rawData = el.dataset.chartData;
    if (!rawData) return;

    let parsed;
    try { parsed = JSON.parse(rawData); } catch { return; }

    const canvas = document.createElement('canvas');
    canvas.width = el.offsetWidth || 600;
    canvas.height = el.offsetHeight || 300;
    el.appendChild(canvas);

    // Simple built-in chart renderer (no deps)
    el._chartData = parsed;
    el._chartType = type;
    el._canvas = canvas;

    if (!el.dataset.chartState) {
      this.renderChart(el, 1.0);
    }
  }

  animateChart(el, stateIndex) {
    if (el._animated) return;
    el._animated = true;
    const start = performance.now();
    const dur = 1000;
    const animate = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.renderChart(el, ease);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  renderChart(el, progress = 1.0) {
    const canvas = el._canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const type = el._chartType;
    const data = el._chartData;
    const W = canvas.width = el.clientWidth || 600;
    const H = canvas.height = el.clientHeight || 300;

    ctx.clearRect(0, 0, W, H);

    const style = getComputedStyle(el);
    const accent = el.dataset.chartColor || '#6ee7b7';
    const accent2 = el.dataset.chartColor2 || '#818cf8';
    const textColor = el.dataset.chartTextColor || '#fff';

    if (type === 'bar') this.drawBar(ctx, data, W, H, progress, accent, textColor);
    else if (type === 'line') this.drawLine(ctx, data, W, H, progress, accent, textColor);
    else if (type === 'pie' || type === 'donut') this.drawPie(ctx, data, W, H, progress, type === 'donut');
    else if (type === 'area') this.drawArea(ctx, data, W, H, progress, accent, accent2, textColor);
  }

  drawBar(ctx, data, W, H, progress, color, textColor) {
    const pad = { top: 20, bottom: 40, left: 40, right: 20 };
    const labels = data.labels || [];
    const values = data.values || [];
    const max = Math.max(...values) * 1.1;
    const n = values.length;
    const barW = (W - pad.left - pad.right) / n * 0.6;
    const gap = (W - pad.left - pad.right) / n;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (H - pad.top - pad.bottom) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    values.forEach((v, i) => {
      const x = pad.left + i * gap + gap * 0.2;
      const barH = (H - pad.top - pad.bottom) * (v / max) * progress;
      const y = H - pad.bottom - barH;

      const grad = ctx.createLinearGradient(0, y, 0, H - pad.bottom);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] || '', x + barW / 2, H - pad.bottom + 18);

      // Value
      if (progress > 0.8) {
        ctx.fillStyle = color;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(v, x + barW / 2, y - 5);
      }
    });
  }

  drawLine(ctx, data, W, H, progress, color, textColor) {
    const pad = { top: 20, bottom: 40, left: 40, right: 20 };
    const labels = data.labels || [];
    const values = data.values || [];
    const max = Math.max(...values) * 1.1;
    const n = values.length;
    const xStep = (W - pad.left - pad.right) / (n - 1);

    const pts = values.map((v, i) => ({
      x: pad.left + i * xStep,
      y: H - pad.bottom - (H - pad.top - pad.bottom) * (v / max)
    }));

    const visible = Math.ceil(pts.length * progress);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (H - pad.top - pad.bottom) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    pts.slice(0, visible).forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dots
    pts.slice(0, visible).forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Labels
    ctx.fillStyle = textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    pts.forEach((p, i) => ctx.fillText(labels[i] || '', p.x, H - pad.bottom + 18));
  }

  drawArea(ctx, data, W, H, progress, color1, color2, textColor) {
    const pad = { top: 20, bottom: 40, left: 40, right: 20 };
    const series = data.series || [{ values: data.values, label: '' }];
    const allVals = series.flatMap(s => s.values);
    const max = Math.max(...allVals) * 1.1;
    const n = series[0].values.length;
    const xStep = (W - pad.left - pad.right) / (n - 1);
    const colors = [color1, color2];

    series.forEach((s, si) => {
      const pts = s.values.map((v, i) => ({
        x: pad.left + i * xStep,
        y: H - pad.bottom - (H - pad.top - pad.bottom) * (v / max) * progress
      }));

      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom);
      ctx.lineTo(pts[0].x, H - pad.bottom);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, colors[si % 2] + 'aa');
      grad.addColorStop(1, colors[si % 2] + '11');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = colors[si % 2];
      ctx.lineWidth = 2;
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    // Labels
    const labels = data.labels || [];
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const x = pad.left + i * xStep;
      ctx.fillText(labels[i] || '', x, H - pad.bottom + 18);
    }
  }

  drawPie(ctx, data, W, H, progress, isDonut) {
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.38;
    const values = data.values || [];
    const labels = data.labels || [];
    const colors = data.colors || ['#6ee7b7','#818cf8','#fb7185','#fbbf24','#38bdf8','#a3e635'];
    const total = values.reduce((a, b) => a + b, 0);

    let angle = -Math.PI / 2;
    values.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2 * progress;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#0008';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (progress > 0.8) {
        const mid = angle + slice / 2;
        const lx = cx + Math.cos(mid) * r * 0.68;
        const ly = cy + Math.sin(mid) * r * 0.68;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i] || '', lx, ly);
      }

      angle += slice;
    });

    if (isDonut) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--slide-bg') || '#0f172a';
      ctx.fill();
    }
  }

  // ─── Text-to-Speech ──────────────────────────────────────────────────────────

  maybeAutoNarrate() {
    if (!this.options.ttsEnabled || !this.speechSynth) return;
    const slide = this.slides[this.currentSlide];
    const text = slide.dataset.narrate;
    if (text) {
      this.speak(text);
    }
  }

  speak(text) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 1.0;
    this.speechSynth.speak(utt);
  }

  toggleTTS() {
    const slide = this.slides[this.currentSlide];
    // Collect all narrate text from elements
    const texts = [slide.dataset.narrate];
    slide.querySelectorAll('[data-tts]').forEach(el => texts.push(el.dataset.tts || el.textContent));
    const combined = texts.filter(Boolean).join('. ');
    if (combined) this.speak(combined);
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  bindKeys() {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          this.nextSlide();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextState();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.prevState();
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          break;
        case 't':
        case 'T':
          this.toggleTTS();
          break;
        case 'Home':
          e.preventDefault();
          this.goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          this.goToSlide(this.slides.length - 1);
          break;
      }
    });
  }

  bindTouch() {
    let startY = 0, startX = 0;
    document.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
      const dy = startY - e.changedTouches[0].clientY;
      const dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy > 40) this.nextSlide();
        else if (dy < -40) this.prevSlide();
      } else {
        if (dx > 40) this.nextState();
        else if (dx < -40) this.prevState();
      }
    }, { passive: true });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}

// Auto-init
// window.addEventListener('DOMContentLoaded', () => {
//   const slide = window.document.location.searchParams.get('slide') || "1";
//   window.DECK_OPTIONS = { initialSlide: parseInt(slide) - 1 || 0 };
//   window.deck = new DeckEngine(window.DECK_OPTIONS || {});
// });

// Auto-init
window.addEventListener('DOMContentLoaded', () => {
  const queryString = window.location.search;
  window.DECK_OPTIONS = Object.fromEntries(new URLSearchParams(queryString).entries());
  window.deck = new DeckEngine(window.DECK_OPTIONS || {});
});