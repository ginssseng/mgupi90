/* ═══════════════════════════════════════════════════
   МГУПИ 90 — app.js
═══════════════════════════════════════════════════ */
'use strict';

const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
const lerp  = (a, b, t) => a + (b - a) * t;
const rnd   = (a, b) => Math.random() * (b - a) + a;
const rndInt= (a, b) => Math.floor(rnd(a, b + 1));

/* ══════════════════════════════════════════
   1. PRELOADER
══════════════════════════════════════════ */
(function Preloader() {
  document.body.classList.add('loading');

  /* Background particle canvas */
  const cvs = $('#preloaderCanvas');
  const ctx  = cvs.getContext('2d');
  let W, H, pts = [];

  function resize() {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }
  resize();

  for (let i = 0; i < 80; i++) {
    pts.push({ x: rnd(0,W), y: rnd(0,H), vx: rnd(-0.4,0.4), vy: rnd(-0.4,0.4), r: rnd(1,2.5) });
  }

  let plRaf;
  function drawPL() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96,165,250,0.4)';
      ctx.fill();

      pts.forEach(q => {
        const d = Math.hypot(p.x-q.x, p.y-q.y);
        if (d < 110 && d > 0) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(96,165,250,${0.12*(1-d/110)})`;
          ctx.lineWidth = 0.6; ctx.stroke();
        }
      });
    });
    plRaf = requestAnimationFrame(drawPL);
  }
  drawPL();

  /* Progress counter */
  const fill  = $('#plFill');
  const pctEl = $('#plPct');
  const DUR   = 2400;
  const t0    = performance.now();

  function tick(now) {
    const t  = clamp((now - t0) / DUR, 0, 1);
    const e  = 1 - Math.pow(1 - t, 3);
    const pct = Math.floor(e * 100);
    if (fill)  fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct;
    if (t < 1) { requestAnimationFrame(tick); }
    else        { finish(); }
  }
  requestAnimationFrame(tick);

  function finish() {
    const pl = $('#preloader');
    if (!pl) return;
    pl.classList.add('hide');
    document.body.classList.remove('loading');
    cancelAnimationFrame(plRaf);
    setTimeout(() => pl.remove(), 900);

    /* Boot everything else after preloader */
    initHeroCanvas();
    initGridCanvas();
    initHeroEntrance();
    initCounters();
  }
})();


/* ══════════════════════════════════════════
   2. NAVIGATION
══════════════════════════════════════════ */
(function Nav() {
  const nav    = $('#navbar');
  const burger = $('#navBurger');
  const links  = $('#navLinks');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger && burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    links.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links && links.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


/* ══════════════════════════════════════════
   3. HERO PARTICLE CANVAS
══════════════════════════════════════════ */
function initHeroCanvas() {
  const cvs = $('#heroCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let W, H, particles = [];
  const COUNT = 90;
  const LINK  = 140;
  let mx = W/2, my = H/2;

  function resize() {
    W = cvs.width  = cvs.offsetWidth;
    H = cvs.height = cvs.offsetHeight;
  }

  class P {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = rnd(0, W); this.y  = rnd(0, H);
      this.vx = rnd(-0.3, 0.3); this.vy = rnd(-0.3, 0.3);
      this.r  = rnd(1, 3); this.a  = rnd(0.2, 0.7);
      this.pulse = rnd(0, Math.PI*2);
    }
    update() {
      const dx = this.x - mx, dy = this.y - my;
      const d  = Math.hypot(dx, dy);
      if (d < 150 && d > 0) { this.vx += dx/d*0.012; this.vy += dy/d*0.012; }
      this.vx *= 0.992; this.vy *= 0.992;
      this.x += this.vx; this.y += this.vy;
      this.pulse += 0.025;
      if (this.x<-5||this.x>W+5||this.y<-5||this.y>H+5) this.reset();
    }
    draw() {
      const aa = this.a * (0.7 + 0.3*Math.sin(this.pulse));
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(147,197,253,${aa})`; ctx.fill();
    }
  }

  function init() { resize(); particles = Array.from({length:COUNT}, ()=>new P()); }

  function frame() {
    ctx.clearRect(0,0,W,H);
    for (let i=0;i<particles.length;i++) {
      for (let j=i+1;j<particles.length;j++) {
        const p=particles[i], q=particles[j];
        const d=Math.hypot(p.x-q.x, p.y-q.y);
        if (d < LINK) {
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
          ctx.strokeStyle = `rgba(147,197,253,${0.2*(1-d/LINK)})`;
          ctx.lineWidth=0.8; ctx.stroke();
        }
      }
    }
    particles.forEach(p=>{ p.update(); p.draw(); });
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, {passive:true});
  window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; }, {passive:true});
  init(); frame();
}


/* ══════════════════════════════════════════
   4. PERSPECTIVE GRID CANVAS
══════════════════════════════════════════ */
function initGridCanvas() {
  const cvs = $('#gridCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let W, H;

  function resize() {
    W = cvs.width  = cvs.offsetWidth  || window.innerWidth;
    H = cvs.height = cvs.offsetHeight || window.innerHeight * 0.55;
    draw();
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    const vx = W/2, vy = 0;     /* vanishing point at top-center */
    const cols  = 18;
    const rows  = 12;
    const baseY = H;

    ctx.lineWidth = 0.7;

    /* Vertical lines (converge to VP) */
    for (let i=0; i<=cols; i++) {
      const bx = (i/cols) * W;
      const t  = i/cols;
      const alpha = 0.04 + 0.08 * Math.sin(t*Math.PI);
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(bx, baseY);
      ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
      ctx.stroke();
    }

    /* Horizontal lines (perspective spacing) */
    for (let i=1; i<=rows; i++) {
      const p     = Math.pow(i/rows, 1.8);
      const y     = p * H;
      const alpha = p * 0.12;
      /* Intersection with left & right diagonal */
      const lx = lerp(vx, 0, p);
      const rx = lerp(vx, W, p);
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y);
      ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
      ctx.stroke();
    }
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
}


/* ══════════════════════════════════════════
   5. HERO ENTRANCE ANIMATION
══════════════════════════════════════════ */
function initHeroEntrance() {
  /* Build 3D extrusion layers for "90" */
  build90Layers();

  const items = [
    { el: $('.hero-eyebrow'), d: 0   },
    { el: $('#num90'),        d: 120 },
    { el: $('.hero-heading'), d: 380 },
    { el: $('.hero-desc'),    d: 520 },
    { el: $('.hero-stats'),   d: 650 },
    { el: $('.hero-btn'),     d: 800 },
    { el: $('#heroScrollCue'),d: 1100},
  ];

  items.forEach(({el, d}) => {
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition= 'opacity 0.85s ease, transform 0.85s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => { el.style.opacity=''; el.style.transform=''; }, 2600 + d);
  });
}

function build90Layers() {
  const wrap = $('#num90');
  if (!wrap) return;
  const face = wrap.querySelector('.num90-face');
  const LAYERS = 24;
  const STEP   = 2.8;  /* px per layer */

  for (let i = LAYERS; i >= 1; i--) {
    const span    = document.createElement('span');
    const prog    = (LAYERS - i) / LAYERS;          /* 0 = back, 1 = just behind front */
    const blue    = Math.round(10 + prog * 195);
    const green   = Math.round(prog * 60);
    const red     = Math.round(prog * 8);
    const alpha   = 0.4 + prog * 0.45;
    const offset  = i * STEP;

    span.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0;
      display: block;
      font-family: 'Bebas Neue', 'Arial Black', sans-serif;
      color: rgb(${red},${green},${blue});
      opacity: ${alpha.toFixed(2)};
      transform: translate(${offset}px, ${offset}px);
      pointer-events: none;
      user-select: none;
    `;
    span.textContent = '90';
    wrap.insertBefore(span, face);
  }

  /* Also fill .num90-glow and .num90-reflect with same font */
  const glow    = $('.num90-glow');
  const reflect = $('.num90-reflect');
  [glow, reflect].forEach(el => {
    if (el) el.setAttribute('aria-hidden', 'true');
  });
}


/* ══════════════════════════════════════════
   6. STAT COUNTERS
══════════════════════════════════════════ */
function initCounters() {
  const els = $$('.hstat-val[data-count]');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const to  = parseInt(el.dataset.count);
      const dur = 1800;
      const t0  = performance.now();
      function tick(now) {
        const t   = clamp((now-t0)/dur, 0, 1);
        const eased = 1 - Math.pow(1-t, 3);
        el.textContent = Math.round(eased * to);
        if (t < 1) requestAnimationFrame(tick);
        else        el.textContent = to;
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => obs.observe(el));
}
/* Also run counters for elements already visible */
window.addEventListener('DOMContentLoaded', initCounters);


/* ══════════════════════════════════════════
   7. PARALLAX — hero on mouse move
══════════════════════════════════════════ */
(function Parallax() {
  const left   = $('#heroLeft');
  const right  = $('#heroRight');
  const shapes = $$('.hs, .orb3d');
  let tx=0, ty=0, cx=0, cy=0;

  window.addEventListener('mousemove', e => {
    tx = (e.clientX/window.innerWidth  - 0.5) * 30;
    ty = (e.clientY/window.innerHeight - 0.5) * 18;
  }, {passive:true});

  function tick() {
    cx = lerp(cx, tx, 0.055);
    cy = lerp(cy, ty, 0.055);

    if (left)  left.style.transform  = `translate(${cx*0.15}px, ${cy*0.12}px)`;
    if (right) right.style.transform = `translate(${cx*-0.08}px, ${cy*-0.06}px)`;

    shapes.forEach((s,i) => {
      const f = (i%2===0 ? 1:-1) * (0.6 + i*0.1);
      s.style.transform = `translate(${cx*f*0.4}px, ${cy*f*0.4}px)`;
    });

    requestAnimationFrame(tick);
  }
  tick();
})();


/* ══════════════════════════════════════════
   8. SCROLL ANIMATIONS — IntersectionObserver
══════════════════════════════════════════ */
(function ScrollAnim() {

  /* Generic reveals */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const d = parseInt(e.target.dataset.d || '0');
      setTimeout(() => e.target.classList.add('visible'), d);
      revObs.unobserve(e.target);
    });
  }, { threshold: 0.14 });
  $$('.reveal-e').forEach(el => revObs.observe(el));

  /* Timeline items */
  const tlObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      tlObs.unobserve(e.target);
    });
  }, { threshold: 0.18 });
  $$('.tl-anim').forEach(el => tlObs.observe(el));

  /* Timeline spine fill */
  const section = $('#timeline');
  const fill    = $('#tlFill');
  if (section && fill) {
    function updateSpine() {
      const r   = section.getBoundingClientRect();
      const pct = clamp((-r.top) / (r.height - window.innerHeight), 0, 1);
      fill.style.height = (pct * 100) + '%';
    }
    window.addEventListener('scroll', updateSpine, {passive:true});
    updateSpine();
  }

  /* Era bg parallax inside timeline */
  const eras = $$('.tl-era-bg');
  function eraParallax() {
    eras.forEach(bg => {
      const r   = bg.parentElement.getBoundingClientRect();
      const mid = r.top + r.height/2 - window.innerHeight/2;
      const shift = clamp(mid * 0.12, -30, 30);
      bg.style.transform = `translateY(${shift}px) scale(1.08)`;
    });
  }
  window.addEventListener('scroll', eraParallax, {passive:true});
  eraParallax();

})();


/* ══════════════════════════════════════════
   9. FACTS — HORIZONTAL SCROLL
══════════════════════════════════════════ */
(function FactsScroll() {
  const track    = $('#factsTrack');
  const progress = $('#factsProgress');
  const btnL     = $('#faLeft');
  const btnR     = $('#faRight');
  if (!track) return;

  /* Update progress bar */
  function updateProgress() {
    const max = track.scrollWidth - track.clientWidth;
    const pct = max > 0 ? (track.scrollLeft / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
  }

  track.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  /* Arrow buttons */
  const CARD_W = () => track.querySelector('.fh-card')?.offsetWidth + 24 || 340;

  btnR && btnR.addEventListener('click', () => {
    track.scrollBy({ left: CARD_W(), behavior: 'smooth' });
  });
  btnL && btnL.addEventListener('click', () => {
    track.scrollBy({ left: -CARD_W(), behavior: 'smooth' });
  });

  /* Drag-to-scroll */
  let isDown = false, startX, scrollLeft;

  track.addEventListener('mousedown', e => {
    isDown = true; track.classList.add('grabbing');
    startX     = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mouseup',    () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mousemove',  e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.4;
    track.scrollLeft = scrollLeft - walk;
  });

  /* Wheel-to-scroll horizontally */
  const outer = $('#factsOuter');
  outer && outer.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
      updateProgress();
    }
  }, { passive: false });

  /* 3D tilt on cards */
  track.querySelectorAll('.fh-card').forEach(card => {
    let cx2=0, cy2=0, raf2;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      cx2 = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      cy2 = ((e.clientY - r.top)  / r.height - 0.5) * -10;
    });
    card.addEventListener('mouseenter', () => {
      function t2() {
        card.style.transform = `perspective(800px) rotateY(${cx2}deg) rotateX(${cy2}deg) translateY(-8px) scale(1.01)`;
        raf2 = requestAnimationFrame(t2);
      }
      t2();
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf2); cx2=0; cy2=0;
      card.style.transform = '';
    });
  });
})();


/* ══════════════════════════════════════════
   10. CAPSULE CANVAS — ambient orbs
══════════════════════════════════════════ */
(function CapsuleCanvas() {
  const cvs = $('#capsuleCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let W, H, orbs = [];

  function resize() {
    W = cvs.width  = cvs.offsetWidth  || window.innerWidth;
    H = cvs.height = cvs.offsetHeight || 600;
  }

  class Orb {
    constructor() { this.reset(); }
    reset() {
      this.x    = rnd(0,W); this.y  = rnd(0,H);
      this.vx   = rnd(-0.15,0.15); this.vy = rnd(-0.15,0.15);
      this.r    = rnd(1.5,5); this.a = rnd(0.1,0.5);
      this.p    = rnd(0,Math.PI*2);
      this.gold = Math.random() < 0.3;
    }
    update() {
      this.x = (this.x+this.vx+W)%W;
      this.y = (this.y+this.vy+H)%H;
      this.p += 0.018;
    }
    draw() {
      const aa = this.a*(0.5+0.5*Math.sin(this.p));
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle = this.gold
        ? `rgba(201,168,76,${aa})`
        : `rgba(96,165,250,${aa})`;
      ctx.fill();
    }
  }

  function init() { resize(); orbs = Array.from({length:60},()=>new Orb()); }
  function frame() { ctx.clearRect(0,0,W,H); orbs.forEach(o=>{o.update();o.draw();}); requestAnimationFrame(frame); }

  window.addEventListener('resize', resize, {passive:true});
  init(); frame();
})();


/* ══════════════════════════════════════════
   11. TIME CAPSULE FORM
══════════════════════════════════════════ */
(function Capsule() {
  const KEY      = 'mgupi90_v2';
  const form     = $('#capsuleForm');
  const nameInp  = $('#cfName');
  const roleInp  = $('#cfRole');
  const msgInp   = $('#cfMsg');
  const yearSel  = $('#cfYear');
  const cntEl    = $('#cfCnt');
  const success  = $('#sealSuccess');
  const wall     = $('#msgWall');
  const emptyEl  = $('#msgEmpty');
  const countEl  = $('#msgCount');

  const esc = s => s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  /* char counter */
  msgInp && msgInp.addEventListener('input', () => {
    const n = msgInp.value.length;
    if (cntEl) cntEl.textContent = n;
  });

  function load()  { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

  function badge(n) {
    if (!countEl) return;
    const w = n === 1 ? 'послание' : n < 5 ? 'послания' : 'посланий';
    countEl.textContent = `${n} ${w}`;
  }

  function msgCard(m) {
    const d = document.createElement('div');
    d.className = 'msg-card';
    d.innerHTML = `
      <div class="msg-ch">
        <div>
          <div class="msg-name">${esc(m.name)}</div>
          ${m.role ? `<div class="msg-role">${esc(m.role)}</div>` : ''}
        </div>
        <span class="msg-yr">до ${m.year}</span>
      </div>
      <p class="msg-body">${esc(m.message)}</p>`;
    return d;
  }

  function render() {
    const msgs = load();
    badge(msgs.length);
    if (!wall) return;
    wall.innerHTML = '';
    if (msgs.length === 0) {
      wall.appendChild(emptyEl || (() => {
        const d=document.createElement('div');
        d.className='msg-empty';
        d.innerHTML='<div class="me-icon">📭</div><p>Капсула пуста.</p>';
        return d;
      })());
      return;
    }
    [...msgs].reverse().forEach(m => wall.appendChild(msgCard(m)));
  }

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInp?.value.trim();
    const msg  = msgInp?.value.trim();
    if (!name || !msg) {
      [!name && nameInp, !msg && msgInp].forEach(el => {
        if (!el) return;
        el.style.borderColor = 'rgba(252,165,165,0.7)';
        el.focus();
        setTimeout(() => el.style.borderColor='', 1600);
      });
      return;
    }

    const entry = {
      name, role: roleInp?.value.trim()||'',
      message: msg, year: yearSel?.value||'2036',
      ts: Date.now()
    };
    const msgs = load();
    msgs.push(entry);
    save(msgs);
    render();

    /* Reset */
    form.reset();
    if (cntEl) cntEl.textContent = '0';
    form.style.display = 'none';
    success && success.classList.add('show');

    /* Pulse vault */
    const vault = $('#vaultScene');
    if (vault) {
      vault.style.filter = 'drop-shadow(0 0 30px rgba(201,168,76,0.8))';
      setTimeout(() => vault.style.filter='', 1500);
    }

    setTimeout(() => {
      success && success.classList.remove('show');
      form.style.display = '';
    }, 4500);
  });

  render();
})();


/* ══════════════════════════════════════════
   12. FACT CARDS REVEAL (IntersectionObserver)
      — not used for horizontal scroll section
      but kept for potential additions
══════════════════════════════════════════ */
(function RevealCards() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e,i) => {
      if (!e.isIntersecting) return;
      setTimeout(()=> e.target.classList.add('visible'), i*100);
      obs.unobserve(e.target);
    });
  }, {threshold:0.1});
  $$('.fact-card, .fh-card').forEach(el => obs.observe(el));
})();


/* ══════════════════════════════════════════
   13. SMOOTH SCROLL for anchor links
══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ══════════════════════════════════════════
   14. RESIZE HANDLER (debounced)
══════════════════════════════════════════ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initGridCanvas();
  }, 250);
}, {passive:true});
