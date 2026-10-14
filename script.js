(function () {
  var d = document, root = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  root.classList.add('js');

  /* theme toggle (soft cross-fade where the browser supports it) */
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  $('#theme').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    var apply = function () {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    };
    if (d.startViewTransition && !reduce) d.startViewTransition(apply); else apply();
  });
  $('#year').textContent = new Date().getFullYear();

  /* hero name: split into letters */
  var h1 = $('.hero h1');
  if (h1) {
    var txt = h1.textContent.trim(), n = 0;
    h1.setAttribute('aria-label', txt);
    h1.textContent = '';
    txt.split(' ').forEach(function (w) {
      var ws = d.createElement('span');
      ws.className = 'word'; ws.setAttribute('aria-hidden', 'true');
      w.split('').forEach(function (c) {
        var s = d.createElement('span');
        s.className = 'ch'; s.style.setProperty('--n', n++); s.textContent = c;
        ws.appendChild(s);
      });
      h1.appendChild(ws); h1.appendChild(d.createTextNode(' '));
    });
  }

  /* marquee: duplicate for a seamless loop */
  var track = $('.track');
  if (track) track.innerHTML += track.innerHTML;

  /* chip stagger index */
  $$('.chips').forEach(function (c) {
    $$('li', c).forEach(function (li, k) { li.style.setProperty('--c', k); });
  });

  /* count-up numbers */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-dec') || 0, t0 = null;
    function f(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  /* scroll reveals with staggering */
  var sets = ['.sec h2', '.about > *', '.group', '.project', '.timeline', '.timeline li', '.certs > div', '.contact .lead', '.contact-list', '.stats li'];
  var all = [];
  sets.forEach(function (sel) {
    var seen = [];
    $$(sel).forEach(function (el) {
      var p = el.parentNode, i = seen.indexOf(p);
      if (i < 0) { seen.push(p); i = seen.length - 1; seen[i] = p; seen[i + '#'] = 0; }
      var idx = seen[i + '#']++;
      if (sel !== '.timeline') el.setAttribute('data-reveal', '');
      el.style.setProperty('--i', idx);
      all.push(el);
    });
  });

  function show(el) {
    el.classList.add('in');
    if (el.classList.contains('stats') || el.parentNode.classList.contains('stats')) {
      if (!reduce) $$('[data-count]', el).forEach(count);
    }
    var i = +el.style.getPropertyValue('--i') || 0;
    setTimeout(function () { el.style.setProperty('--i', 0); }, 1400 + i * 450);
  }

  if (reduce || !('IntersectionObserver' in window)) {
    all.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    all.forEach(function (el) { io.observe(el); });
  }

  /* scroll progress bar */
  var bar = $('#progress'), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = root.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* highlight the nav link of the section in view */
  if ('IntersectionObserver' in window) {
    var links = $$('.nav nav a');
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.sec[id]').forEach(function (s) { spy.observe(s); });
  }

  /* pointer effects: desktop only */
  if (!reduce && fine) {
    var hero = $('.hero'), arch = $('.arch');
    if (hero && arch) {
      hero.addEventListener('pointermove', function (e) {
        var r = arch.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        arch.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        arch.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      });
      hero.addEventListener('pointerleave', function () {
        arch.style.setProperty('--rx', '0deg'); arch.style.setProperty('--ry', '0deg');
      });
    }
    $$('.btn').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('.project, .group, .certs > div').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
