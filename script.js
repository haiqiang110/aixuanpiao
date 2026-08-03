(function () {
  const DESIGN_W = 1600;
  const DESIGN_H = 900;
  const viewport = document.getElementById('viewport');
  const board = document.getElementById('board');
  const bgImg = board.querySelector('.board-bg');
  const cardImgs = board.querySelectorAll('.card-img');
  const cardEls = {
    1: board.querySelector('.card-1'),
    2: board.querySelector('.card-2'),
    3: board.querySelector('.card-3'),
    4: board.querySelector('.card-4')
  };
  const mask = board.querySelector('.flip-mask');
  const fxL = board.querySelector('.fx-l');
  const fxR = board.querySelector('.fx-r');
  const flipWrap = board.querySelector('.flipped-yemian');
  const yemianImg = flipWrap.querySelector('.yemian-img');
  const yemianVideo = flipWrap.querySelector('.yemian-video');
  yemianVideo.setAttribute('playsinline', '');
  yemianVideo.setAttribute('webkit-playsinline', '');
  yemianVideo.muted = true;
  yemianVideo.loop = true;

  const CARD_META = {
    1: {
      left: 105, top: 327, w: 360, h: 460, rot: -9,
      type: 'img',
      src: 'assets/yemian1.png',
      srcL: 'assets/test1-Left.png',
      srcR: 'assets/test1-Right.png'
    },
    2: {
      left: 429, top: 297, w: 360, h: 460, rot: 0,
      type: 'video',
      src: 'assets/yemian2.webm',
      srcL: 'assets/test2-Left.png',
      srcR: 'assets/test2-Right.png'
    },
    3: {
      left: 770, top: 327, w: 360, h: 460, rot: 8,
      type: 'video',
      src: 'assets/yemian3.webm',
      srcL: 'assets/test3-Left.png',
      srcR: 'assets/test3-Right.png'
    },
    4: {
      left: 1117, top: 297, w: 360, h: 460, rot: -8,
      type: 'video',
      src: 'assets/yemian4.webm',
      srcL: 'assets/test4-Left.png',
      srcR: 'assets/test4-Right.png'
    }
  };
  const FALLBACK_IMG = 'assets/yemian1.png';

  function fit() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padX = 32;
    const padY = 32;
    const availW = vw - padX * 2;
    const availH = vh - padY * 2;
    const s = Math.min(availW / DESIGN_W, availH / DESIGN_H, 1);
    viewport.style.transform = `scale(${s})`;
    viewport.style.width = DESIGN_W + 'px';
    viewport.style.height = DESIGN_H + 'px';
  }
  fit();
  window.addEventListener('resize', fit);

  let expandedCard = 0;
  let enterTl = null;
  let leaveTl = null;

  function getCardCenter(idx) {
    const m = CARD_META[idx];
    return { x: m.left + m.w / 2, y: m.top + m.h / 2, w: m.w, h: m.h, rot: m.rot };
  }
  function getYemianTarget() {
    return { x: DESIGN_W / 2, y: DESIGN_H / 2, w: 372, h: 780 };
  }

  function setupLayer(idx) {
    const meta = CARD_META[idx];
    fxL.src = meta.srcL;
    fxR.src = meta.srcR;
    if (meta.type === 'img') {
      flipWrap.setAttribute('data-layer', 'img');
      yemianImg.src = meta.src;
      try { yemianVideo.pause(); } catch (e) {}
    } else {
      flipWrap.setAttribute('data-layer', 'video');
      yemianVideo.src = meta.src;
      yemianVideo.load();
    }
  }

  function playVideo() {
    try {
      yemianVideo.currentTime = 0;
    } catch (e) {}
    const p = yemianVideo.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {}).catch(function () {});
    }
  }
  function pauseVideo() {
    try {
      yemianVideo.pause();
      yemianVideo.currentTime = 0;
    } catch (e) {}
  }

  function enter(idx) {
    if (expandedCard === idx) return;
    expandedCard = idx;
    if (leaveTl) { leaveTl.kill(); leaveTl = null; }
    if (enterTl) enterTl.kill();

    const meta = CARD_META[idx];
    board.setAttribute('data-card', String(idx));
    setupLayer(idx);

    const cc = getCardCenter(idx);
    const tc = getYemianTarget();
    const scaleAvg = (Math.min(cc.w / tc.w, cc.h / tc.h)) * 0.62;
    const startX = cc.x - tc.x;
    const startY = cc.y - tc.y;

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: function () {
        if (meta.type === 'video') playVideo();
      }
    });
    tl.set(flipWrap, {
      x: startX, y: startY, scale: scaleAvg, rotate: cc.rot, opacity: 0
    }, 0);
    tl.to(mask, { opacity: 1, duration: 0.55, ease: 'power3.out' }, 0);
    tl.to(flipWrap, { opacity: 1, duration: 0.35 }, 0.03);
    tl.to(flipWrap, { x: 0, y: 0, scale: 1, rotate: 0, duration: 0.95 }, 0.05);
    Object.keys(cardEls).forEach(function (k) {
      tl.to(cardEls[k], { opacity: 0, duration: 0.30, ease: 'power2.out' }, 0);
    });
    tl.fromTo(fxL,
      { opacity: 0, x: -60, yPercent: -40, scale: 0.94 },
      { opacity: 1, x: 0, yPercent: -50, scale: 1, duration: 0.85 }, 0.22);
    tl.fromTo(fxR,
      { opacity: 0, x: 60, yPercent: -40, scale: 0.94 },
      { opacity: 1, x: 0, yPercent: -50, scale: 1, duration: 0.85 }, 0.22);
    enterTl = tl;
  }

  function leave() {
    if (!expandedCard) return;
    expandedCard = 0;
    if (enterTl) { enterTl.kill(); enterTl = null; }
    if (leaveTl) leaveTl.kill();
    pauseVideo();
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.to(fxL, { opacity: 0, x: -30, scale: 0.97, duration: 0.35 }, 0);
    tl.to(fxR, { opacity: 0, x: 30, scale: 0.97, duration: 0.35 }, 0);
    tl.to(mask, { opacity: 0, duration: 0.5 }, 0.06);
    tl.to(flipWrap, { opacity: 0, scale: 0.97, duration: 0.4 }, 0.02);
    Object.keys(cardEls).forEach(function (k) {
      tl.to(cardEls[k], { opacity: 1, duration: 0.45 }, 0.05);
    });
    leaveTl = tl;
  }

  [1, 2, 3, 4].forEach(function (idx) {
    const el = cardEls[idx];
    if (!el) return;
    el.addEventListener('mouseenter', function () { enter(idx); }, false);
    el.addEventListener('mouseleave', function () { leave(); }, false);
    el.addEventListener('click', function () {
      if (expandedCard === idx) leave(); else enter(idx);
    }, false);
    el.addEventListener('touchstart', function () {
      if (expandedCard === idx) leave(); else enter(idx);
    }, { passive: true });
  });

  if (board) {
    board.addEventListener('mouseleave', function () { if (expandedCard) leave(); }, false);
  }

  if (!window.gsap) return;

  gsap.set(board, { autoAlpha: 0, scale: 0.985 });
  gsap.set(bgImg, { autoAlpha: 0, scale: 1.012, transformOrigin: 'center center' });
  gsap.set('.card-1', { y: 60, rotate: -13, autoAlpha: 0 });
  gsap.set('.card-2', { y: 50, rotate: -3, autoAlpha: 0 });
  gsap.set('.card-3', { y: 44, rotate: 2, autoAlpha: 0 });
  gsap.set('.card-4', { y: 40, rotate: 4, autoAlpha: 0 });
  gsap.set(mask, { opacity: 0 });
  gsap.set(flipWrap, { opacity: 0, transformOrigin: 'center center' });
  gsap.set(fxL, { opacity: 0 });
  gsap.set(fxR, { opacity: 0 });
  flipWrap.setAttribute('data-layer', 'img');
  yemianImg.src = CARD_META[1].src;
  fxL.src = CARD_META[1].srcL;
  fxR.src = CARD_META[1].srcR;

  let loadedCount = 0;
  const waitTargets = [bgImg, ...cardImgs, yemianImg, fxL, fxR];
  function tryStart() {
    loadedCount++;
    if (loadedCount >= waitTargets.length) start();
  }
  function start() {
    const tl = gsap.timeline();
    tl.to(board, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power2.out' })
      .to(bgImg, { autoAlpha: 1, scale: 1, duration: 0.75, ease: 'expo.out' }, 0.05)
      .to('.card-1', { autoAlpha: 1, y: 0, rotate: -9, duration: 0.95, ease: 'expo.out' }, 0.22)
      .to('.card-2', { autoAlpha: 1, y: 0, rotate: 0, duration: 0.95, ease: 'expo.out' }, 0.32)
      .to('.card-3', { autoAlpha: 1, y: 0, rotate: 8, duration: 0.95, ease: 'expo.out' }, 0.42)
      .to('.card-4', { autoAlpha: 1, y: 0, rotate: -8, duration: 0.95, ease: 'expo.out' }, 0.52);
  }

  waitTargets.forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      tryStart();
    } else {
      img.addEventListener('load', tryStart);
      img.addEventListener('error', tryStart);
    }
  });
  setTimeout(function () {
    if (loadedCount < waitTargets.length) { loadedCount = waitTargets.length; start(); }
  }, 2500);
})();
