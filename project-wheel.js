(function () {
  var STEP_PX = 138;
  var DEPTH_PX = 200;
  var TILT_DEG = 32;
  var SNAP_MS = 420;
  var WHEEL_THRESHOLD = 36;
  var TOUCH_THRESHOLD = 36;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function wrapOffset(delta, count) {
    var wrapped = ((delta % count) + count) % count;
    if (wrapped > count / 2) wrapped -= count;
    return wrapped;
  }

  function initWheel(root) {
    var stage = root.querySelector('.project-wheel-stage');
    var cards = Array.prototype.slice.call(root.querySelectorAll('.card'));
    var dotsWrap = root.querySelector('.project-wheel-dots');
    var hint = root.querySelector('.project-wheel-hint');
    var count = cards.length;
    if (!stage || count === 0) return;

    var position = 0;
    var target = 0;
    var animating = false;
    var lastTime = 0;
    var snapLockUntil = 0;
    var wheelCarry = 0;
    var pointerStartY = null;
    var pointerLastY = null;
    var dragging = false;
    var suppressClick = false;

    cards.forEach(function (card, index) {
      card.dataset.wheelIndex = String(index);
      card.setAttribute('role', 'option');
    });

    root.setAttribute('role', 'listbox');
    root.setAttribute('aria-label', 'Projects');

    if (dotsWrap) {
      cards.forEach(function (card, index) {
        var title = card.querySelector('h3');
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'project-wheel-dot';
        dot.setAttribute('aria-label', title ? 'Show ' + title.textContent : 'Show project ' + (index + 1));
        dot.addEventListener('click', function () {
          goTo(index);
        });
        dotsWrap.appendChild(dot);
      });
    }

    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];

    function roundedIndex(value) {
      var index = Math.round(value) % count;
      return (index + count) % count;
    }

    function goTo(index) {
      var current = roundedIndex(target);
      var delta = wrapOffset(index - current, count);
      if (!delta) return;
      target += delta;
      snapLockUntil = performance.now() + SNAP_MS;
      wheelCarry = 0;
      hideHint();
      start();
    }

    function step(direction) {
      if (performance.now() < snapLockUntil) return;
      target += direction;
      snapLockUntil = performance.now() + SNAP_MS;
      wheelCarry = 0;
      hideHint();
      start();
    }

    function hideHint() {
      if (hint) hint.classList.add('is-hidden');
    }

    function render() {
      var active = roundedIndex(position);
      cards.forEach(function (card, index) {
        var offset = wrapOffset(index - position, count);
        var abs = Math.abs(offset);
        var y = offset * STEP_PX;
        var z = -abs * DEPTH_PX;
        var rotateX = offset * -TILT_DEG;
        var scale = Math.max(0.78, 1 - abs * 0.1);
        var blur = abs < 0.04 ? 0 : Math.min(6.5, 0.7 + abs * 2.6);
        var opacity = abs > 2.15 ? 0 : Math.max(0.28, 1 - abs * 0.22);
        var isFront = index === active;

        card.style.transform =
          'translate(-50%, -50%) translate3d(0, ' + y + 'px, ' + z + 'px) rotateX(' + rotateX + 'deg) scale(' + scale + ')';
        card.style.filter = isFront || !blur ? 'none' : 'blur(' + blur + 'px)';
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.round(80 - abs * 20));
        card.classList.toggle('is-active', isFront);
        card.setAttribute('aria-selected', isFront ? 'true' : 'false');
        Array.prototype.forEach.call(card.querySelectorAll('a'), function (link) {
          if (isFront) link.removeAttribute('tabindex');
          else link.setAttribute('tabindex', '-1');
        });
      });

      dots.forEach(function (dot, index) {
        var selected = index === active;
        dot.classList.toggle('is-active', selected);
        dot.setAttribute('aria-current', selected ? 'true' : 'false');
      });
    }

    function tick(now) {
      if (!animating) return;
      var dt = lastTime ? Math.min(32, now - lastTime) : 16;
      lastTime = now;
      var ease = 1 - Math.pow(0.001, dt / 280);
      position += (target - position) * ease;
      if (Math.abs(target - position) < 0.001) {
        position = target;
        animating = false;
      }
      render();
      if (animating) requestAnimationFrame(tick);
    }

    function start() {
      if (animating) return;
      animating = true;
      lastTime = 0;
      requestAnimationFrame(tick);
    }

    root.addEventListener('wheel', function (event) {
      event.preventDefault();
      hideHint();
      wheelCarry += event.deltaY;
      if (Math.abs(wheelCarry) < WHEEL_THRESHOLD) return;
      step(wheelCarry > 0 ? 1 : -1);
    }, { passive: false });

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(count - 1);
      }
    });

    root.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('.project-wheel-dot')) return;
      dragging = true;
      suppressClick = false;
      pointerStartY = event.clientY;
      pointerLastY = event.clientY;
      try { root.setPointerCapture(event.pointerId); } catch (e) {}
    });

    root.addEventListener('pointermove', function (event) {
      if (!dragging || pointerStartY == null) return;
      pointerLastY = event.clientY;
      if (Math.abs(pointerLastY - pointerStartY) > 8) suppressClick = true;
    });

    function endPointer(event) {
      if (!dragging) return;
      dragging = false;
      if (pointerStartY == null) return;
      var endY = pointerLastY == null ? event.clientY : pointerLastY;
      var dy = endY - pointerStartY;
      pointerStartY = null;
      pointerLastY = null;
      if (Math.abs(dy) < TOUCH_THRESHOLD) return;
      suppressClick = true;
      hideHint();
      step(dy < 0 ? 1 : -1);
    }

    root.addEventListener('pointerup', endPointer);
    root.addEventListener('pointercancel', function () {
      dragging = false;
      pointerStartY = null;
      pointerLastY = null;
    });

    root.addEventListener('click', function (event) {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }
      if (event.target.closest('.project-wheel-controls')) return;
      var active = roundedIndex(target);
      var card = event.target.closest('.card');
      if (card && root.contains(card)) {
        var index = Number(card.dataset.wheelIndex);
        if (index === active) return;
        event.preventDefault();
        goTo(index);
        return;
      }
      var activeCard = cards[active];
      if (!activeCard) return;
      var rect = activeCard.getBoundingClientRect();
      if (event.clientY < rect.top) step(-1);
      else if (event.clientY > rect.bottom) step(1);
    });

    root.classList.add('is-ready');
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (prefersReducedMotion()) return;
    var wheels = document.querySelectorAll('[data-project-wheel]');
    Array.prototype.forEach.call(wheels, initWheel);
  });
})();
