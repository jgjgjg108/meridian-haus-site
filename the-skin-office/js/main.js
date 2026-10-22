// The Skin Office — nav, reveals, cart, testimonials, booking demo, demo forms
(function () {
  var body = document.body;

  // ---------- Mobile menu ----------
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- Placeholders: show the collage once the file exists ----------
  document.querySelectorAll('.ph').forEach(function (ph) {
    var img = ph.querySelector('img');
    if (!img) return;
    var show = function () { ph.classList.add('has-image'); };
    var hide = function () { img.remove(); };
    if (img.complete) { img.naturalWidth ? show() : hide(); }
    else { img.addEventListener('load', show); img.addEventListener('error', hide); }
  });

  // ---------- Hero slides: the collage joins as slide 1 once its file exists ----------
  var collage = document.querySelector('.slide-collage');
  if (collage) {
    var cImg = collage.querySelector('img');
    var startSlides = function () {
      var slides = document.querySelectorAll('.hero .slide');
      var hdots = document.querySelectorAll('.hero-dots button');
      var si = 0, stimer;
      collage.hidden = false;
      document.querySelector('.hero').classList.add('has-collage');
      document.querySelector('.hero-dots').hidden = false;
      if (window.matchMedia('(max-width: 560px)').matches) return; // stacked on phones
      var show = function (i) {
        si = i;
        slides.forEach(function (s, j) { s.classList.toggle('active', j === i); s.setAttribute('aria-hidden', j !== i); });
        hdots.forEach(function (d, j) { d.classList.toggle('active', j === i); d.setAttribute('aria-current', j === i); });
      };
      var run = function () { stimer = setInterval(function () { show((si + 1) % slides.length); }, 7000); };
      hdots.forEach(function (d, j) { d.addEventListener('click', function () { clearInterval(stimer); show(j); run(); }); });
      show(0);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) run();
    };
    var onError = function () { collage.remove(); };
    if (cImg.complete) { cImg.naturalWidth ? startSlides() : onError(); }
    cImg.addEventListener('load', function () { if (collage.hidden) startSlides(); });
    cImg.addEventListener('error', onError);
  }

  // ---------- Cart (kept in this browser only; no checkout) ----------
  var PRODUCTS = window.TSO_PRODUCTS || {};
  var KEY = 'tso-cart';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter(function (l) { return PRODUCTS[l.id] && l.qty > 0; });

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function money(n) { return '$' + n.toFixed(0); }

  var countEls = document.querySelectorAll('[data-cart-count]');
  var itemsEl = document.querySelector('.drawer-items');
  var subtotalEl = document.querySelector('[data-subtotal]');

  function render(bump) {
    var n = count();
    countEls.forEach(function (el) {
      el.textContent = n;
      if (bump) { el.classList.add('bump'); setTimeout(function () { el.classList.remove('bump'); }, 250); }
    });
    if (!itemsEl) return;
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="drawer-empty">Your bag is empty.</p>';
    } else {
      itemsEl.innerHTML = cart.map(function (l) {
        var p = PRODUCTS[l.id];
        return '<div class="line-item" data-id="' + l.id + '">' +
          '<div class="thumb" style="background-image:url(' + p.bg + ')">' + p.svg + '</div>' +
          '<div><h3>' + p.name + '</h3><div class="size">' + p.size + '</div>' +
          '<div class="qty"><button type="button" data-dec aria-label="Decrease quantity">&minus;</button><span>' + l.qty + '</span><button type="button" data-inc aria-label="Increase quantity">+</button></div></div>' +
          '<div><div class="price">' + money(p.price * l.qty) + '</div><button type="button" class="remove" data-remove>Remove</button></div></div>';
      }).join('');
    }
    var sub = cart.reduce(function (s, l) { return s + PRODUCTS[l.id].price * l.qty; }, 0);
    if (subtotalEl) subtotalEl.textContent = money(sub);
  }

  function add(id) {
    var line = cart.find(function (l) { return l.id === id; });
    if (line) line.qty++; else cart.push({ id: id, qty: 1 });
    save(); render(true);
    toast(PRODUCTS[id].name + ' added to your bag');
  }

  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      add(btn.dataset.add);
      btn.classList.add('added');
      var label = btn.textContent;
      btn.textContent = 'Added';
      setTimeout(function () { btn.classList.remove('added'); btn.textContent = label; }, 1400);
    });
  });

  if (itemsEl) {
    itemsEl.addEventListener('click', function (e) {
      var row = e.target.closest('.line-item');
      if (!row) return;
      var line = cart.find(function (l) { return l.id === row.dataset.id; });
      if (e.target.closest('[data-inc]')) line.qty++;
      else if (e.target.closest('[data-dec]')) line.qty--;
      else if (e.target.closest('[data-remove]')) line.qty = 0;
      else return;
      cart = cart.filter(function (l) { return l.qty > 0; });
      save(); render(false);
    });
  }

  function openCart() { body.classList.add('cart-open'); var d = document.querySelector('.drawer'); if (d) d.focus(); }
  function closeCart() { body.classList.remove('cart-open'); }
  document.querySelectorAll('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  document.querySelectorAll('[data-close-cart]').forEach(function (b) { b.addEventListener('click', closeCart); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  render(false);

  // ---------- Shop filters ----------
  var filterBtns = document.querySelectorAll('.filters button');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var f = b.dataset.filter;
      document.querySelectorAll('.product[data-cat]').forEach(function (p) {
        p.hidden = f !== 'all' && p.dataset.cat !== f;
      });
    });
  });

  // ---------- Testimonials ----------
  var quotes = document.querySelectorAll('.quote');
  var dots = document.querySelectorAll('.dots button');
  if (quotes.length) {
    var qi = 0, timer;
    var go = function (i) {
      qi = i;
      quotes.forEach(function (q, j) { q.classList.toggle('active', j === i); });
      dots.forEach(function (d, j) { d.classList.toggle('active', j === i); d.setAttribute('aria-current', j === i); });
    };
    var start = function () { timer = setInterval(function () { go((qi + 1) % quotes.length); }, 6500); };
    dots.forEach(function (d, j) { d.addEventListener('click', function () { clearInterval(timer); go(j); start(); }); });
    go(0); start();
  }

  // ---------- Booking demo (nothing is sent, no payment) ----------
  var bookForm = document.getElementById('book-form');
  if (bookForm) {
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var state = { service: null, date: null, time: null };
    var daysEl = document.getElementById('days');
    var timesEl = document.getElementById('times');
    var monthEl = document.getElementById('cal-month');
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    var errEl = document.getElementById('book-error');
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var weekStart = 0; // weeks from the current week

    function startOfWeek(offset) {
      var d = new Date(today);
      d.setDate(d.getDate() - d.getDay() + offset * 7);
      return d;
    }
    function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
    function longDate(d) { return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }
    // Closed Sun/Mon; deterministic "booked" slots so the calendar looks lived-in
    function seed(d, t) { var x = Math.sin(d.getDate() * 12.9898 + d.getMonth() * 78.233 + t * 37.719) * 43758.5453; return x - Math.floor(x); }

    function renderDays() {
      var start = startOfWeek(weekStart);
      var mid = new Date(start); mid.setDate(mid.getDate() + 3);
      monthEl.textContent = MONTHS[mid.getMonth()] + ' ' + mid.getFullYear();
      prevBtn.disabled = weekStart === 0;
      nextBtn.disabled = weekStart >= 5;
      var html = '';
      for (var i = 0; i < 7; i++) {
        var d = new Date(start); d.setDate(d.getDate() + i);
        var closed = d.getDay() === 0 || d.getDay() === 1 || d <= today;
        html += '<button type="button" class="day" data-ts="' + d.getTime() + '"' + (closed ? ' disabled' : '') +
          ' aria-pressed="' + sameDay(d, state.date) + '" aria-label="' + longDate(d) + (closed ? ', unavailable' : '') + '">' +
          '<small>' + DAYS[d.getDay()] + '</small><strong>' + d.getDate() + '</strong></button>';
      }
      daysEl.innerHTML = html;
    }

    function renderTimes() {
      if (!state.date) { timesEl.innerHTML = ''; document.getElementById('times-note').hidden = false; return; }
      document.getElementById('times-note').hidden = true;
      var sat = state.date.getDay() === 6;
      var slots = sat ? ['9:00', '10:30', '12:00', '1:30', '3:00'] : ['10:00', '11:30', '1:00', '2:30', '4:00', '5:30', '7:00'];
      timesEl.innerHTML = slots.map(function (t, i) {
        var label = t + (parseInt(t, 10) >= 9 && parseInt(t, 10) <= 11 ? ' am' : ' pm');
        var taken = seed(state.date, i) < 0.3;
        return '<button type="button" class="time"' + (taken ? ' disabled aria-label="' + label + ', booked"' : '') +
          ' aria-pressed="' + (state.time === label) + '" data-time="' + label + '">' + label + '</button>';
      }).join('');
    }

    daysEl.addEventListener('click', function (e) {
      var b = e.target.closest('.day'); if (!b || b.disabled) return;
      state.date = new Date(+b.dataset.ts); state.time = null;
      renderDays(); renderTimes(); summary();
    });
    timesEl.addEventListener('click', function (e) {
      var b = e.target.closest('.time'); if (!b || b.disabled) return;
      state.time = b.dataset.time;
      renderTimes(); summary();
    });
    prevBtn.addEventListener('click', function () { if (weekStart > 0) { weekStart--; renderDays(); } });
    nextBtn.addEventListener('click', function () { if (weekStart < 5) { weekStart++; renderDays(); } });

    var radios = bookForm.querySelectorAll('input[name="service"]');
    radios.forEach(function (r) { r.addEventListener('change', function () { state.service = r; summary(); }); });
    var pre = new URLSearchParams(location.search).get('service');
    if (pre) { var match = bookForm.querySelector('input[name="service"][value="' + pre + '"]'); if (match) { match.checked = true; state.service = match; } }

    var note = bookForm.querySelector('textarea');
    var noteCount = document.getElementById('note-count');
    if (note && noteCount) note.addEventListener('input', function () { noteCount.textContent = note.value.length + ' / 500'; });

    function summary() {
      var s = state.service;
      document.querySelector('[data-sum="service"]').textContent = s ? s.dataset.name : '—';
      document.querySelector('[data-sum="length"]').textContent = s ? s.dataset.dur : '—';
      document.querySelector('[data-sum="date"]').textContent = state.date ? longDate(state.date) : '—';
      document.querySelector('[data-sum="time"]').textContent = state.time || '—';
      document.querySelector('[data-sum="price"]').textContent = s ? s.dataset.price : '—';
      errEl.textContent = '';
    }

    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = [];
      if (!state.service) missing.push('a facial');
      if (!state.date) missing.push('a date');
      if (state.date && !state.time) missing.push('a time');
      if (missing.length) {
        errEl.textContent = 'Please choose ' + missing.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
        return;
      }
      if (!bookForm.checkValidity()) { bookForm.reportValidity(); return; }
      var name = bookForm.querySelector('[name="name"]').value.trim();
      var fill = function (k, v) { document.querySelector('[data-confirm="' + k + '"]').textContent = v; };
      fill('name', name.split(' ')[0]);
      fill('service', state.service.dataset.name + ' · ' + state.service.dataset.dur);
      fill('when', longDate(state.date) + ' at ' + state.time);
      fill('email', bookForm.querySelector('[name="email"]').value.trim());
      fill('note', note && note.value.trim() ? note.value.trim() : 'No note added');
      fill('ref', 'TSO-' + String(state.date.getMonth() + 1).padStart(2, '0') + String(state.date.getDate()).padStart(2, '0') + '-' + (100 + Math.floor(Math.random() * 900)));
      body.classList.add('booked');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var c = document.querySelector('.confirm'); if (c) c.focus({ preventScroll: true });
    });

    var again = document.getElementById('book-again');
    if (again) again.addEventListener('click', function () {
      body.classList.remove('booked');
      bookForm.reset(); state = { service: null, date: null, time: null };
      if (noteCount) noteCount.textContent = '0 / 500';
      renderDays(); renderTimes(); summary();
    });

    renderDays(); renderTimes(); summary();
  }

  // ---------- Contact + newsletter (confirm in place, nothing sent) ----------
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var name = form.querySelector('[name="name"]');
      var slot = form.nextElementSibling && form.nextElementSibling.querySelector('[data-name]');
      if (name && slot) slot.textContent = name.value.trim().split(' ')[0];
      form.classList.add('sent');
      if (form.nextElementSibling) form.nextElementSibling.focus();
    });
  });
  document.querySelectorAll('.newsletter').forEach(function (news) {
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = news.querySelector('input');
      if (!input.checkValidity()) { input.reportValidity(); return; }
      news.outerHTML = '<p class="newsletter-done">Thank you. You’re on the list.</p>';
    });
  });
})();
