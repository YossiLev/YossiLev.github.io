# DECK.JS — Web Presentation Framework

A lightweight, zero-dependency HTML presentation framework with animation states, canvas charts, and text-to-speech narration.

---

## File Structure

```
deck/
├── index.html          ← Demo presentation (this file)
├── css/
│   └── deck.css        ← All styles + layout helpers
├── js/
│   └── deck.js         ← Presentation engine
└── demo/
    └── starter.html    ← Blank template to copy
```

---

## Controls

| Key | Action |
|---|---|
| `↑` / `↓` / `Space` | Previous / Next slide |
| `←` / `→` | Previous / Next animation state |
| `F` | Toggle fullscreen |
| `T` | Replay slide narration |
| `Home` | First slide |
| `End` | Last slide |
| Touch swipe ↑↓ | Change slide |
| Touch swipe ←→ | Change state |

---

## Data Attributes Reference

### Animation — Position
```html
<!-- Translate element. State numbers are 1-based. -->
<div data-pos-1="[0px, 100px]"
     data-pos-2="[200px, 50px]"
     data-pos-3="[400px, 0px]">
```

### Animation — Opacity
```html
<div data-opacity-1="0"
     data-opacity-2="1">
```

### Animation — Show / Hide
```html
<!-- Element hidden at state 1, visible at state 2 -->
<div data-hide-1 data-show-2 style="opacity:0">
```

### Animation — Scale
```html
<div data-scale-1="0.5" data-scale-2="1.0">
```

### Animation — Rotation
```html
<div data-rotate-1="0" data-rotate-2="45">
```

### Animation — Custom Duration / Easing
```html
<div data-pos-1="[0,0]" data-pos-2="[200px,0]"
     data-duration="800ms"
     data-easing="cubic-bezier(0.34,1.56,0.64,1)">
```

### Animation — CSS Class at State N
```html
<div data-class-2="highlighted">
```

### Charts
```html
<!-- Types: bar | line | area | pie | donut -->
<div class="chart-container"
     data-chart="bar"
     data-chart-data='{"labels":["Q1","Q2","Q3"],"values":[42,67,89]}'
     data-chart-color="#4fffb0"
     data-chart-text-color="#aabbcc"
     data-chart-state="2">   <!-- reveal on state 2; omit for immediate -->
</div>

<!-- Area chart with multiple series -->
<div class="chart-container"
     data-chart="area"
     data-chart-data='{"labels":["W1","W2","W3"],"series":[{"values":[20,35,28]},{"values":[10,18,15]}]}'>
</div>

<!-- Pie/donut with custom colors -->
<div class="chart-container"
     data-chart="donut"
     data-chart-data='{"labels":["A","B","C"],"values":[50,30,20],"colors":["#4fffb0","#7c6fff","#ff6b9d"]}'>
</div>
```

### Narration (Text-to-Speech)
```html
<!-- Auto-speaks when slide becomes active -->
<section class="slide" data-narrate="Welcome everyone!">

<!-- Element-level TTS (reads on T key) -->
<p data-tts="This chart shows revenue growth">...</p>
```

---

## Layout Classes

```html
<div class="layout-2col">  <!-- 50/50 grid -->
<div class="layout-3col">  <!-- 33/33/33 grid -->
<div class="layout-hero">  <!-- centered column -->
<div class="layout-left">  <!-- left-aligned column -->
```

---

## Typography Classes

```html
<p class="slide-eyebrow">Overline label</p>
<h1 class="slide-title">Main heading. <em>Italic accent.</em></h1>
<p class="slide-subtitle">Supporting text</p>
<p class="slide-body">Body copy</p>
<div class="slide-big-number hl-1">87%</div>
<p class="slide-label">Small label</p>
<blockquote class="slide-quote">A quote. <cite>— Author</cite></blockquote>
```

---

## Component Classes

```html
<div class="card card-accent-1">Card with left accent</div>
<div class="callout">Highlighted callout</div>
<span class="pill pill-1">Tag</span>
<hr class="divider">
<ul class="deck-list"><li>Item</li></ul>

<!-- Icon circles -->
<div class="icon-circle icon-circle-1">🚀</div>

<!-- Steps / timeline -->
<div class="step-line">
  <div class="step">
    <div class="step-num">1</div>
    <div>Content</div>
  </div>
</div>

<!-- Decorative glow orbs -->
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
```

---

## Slide Themes

```html
<section class="slide slide-dark">    <!-- deep navy bg -->
<section class="slide slide-light">   <!-- light bg -->
<section class="slide slide-accent">  <!-- green tint -->
<section class="slide slide-purple">  <!-- purple tint -->
```

---

## Global Options

Set `window.DECK_OPTIONS` before the script loads:

```html
<script>
window.DECK_OPTIONS = {
  transitionDuration: 500,            // slide transition ms
  defaultEasing: 'cubic-bezier(...)', // CSS easing
  ttsEnabled: true,                   // auto-narrate on slide entry
  progressBar: true,                  // bottom progress bar
  slideCounter: true,                 // slide X/Y counter
};
</script>
<script src="js/deck.js"></script>
```

---

## Events

```javascript
// Fired on slide change
document.addEventListener('deck:slide', (e) => {
  console.log(e.detail.index, e.detail.direction);
});

// Fired on state change
document.addEventListener('deck:state', (e) => {
  console.log(e.detail.stateIndex, e.detail.slide);
});

// Access the engine
window.deck.goToSlide(3);
window.deck.nextState();
window.deck.speak("Custom narration");
```
