// Sunhouse Yoga — nav, reveals, placeholders, this-week list, calendar, booking demo, demo forms
(function () {
  var body = document.body;
  var S = window.SUNHOUSE;

  // ---------- Header state + mobile menu ----------
  var onScroll = function () { body.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      body.style.setProperty('--menu-top', document.querySelector('.site-header').getBoundingClientRect().bottom + 'px');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  // ---------- Reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- Files from Julianna: show each one once it exists ----------
  var whenLoaded = function (img, ok, fail) {
    if (img.complete) { img.naturalWidth ? ok() : fail(); return; }
    img.addEventListener('load', ok);
    img.addEventListener('error', fail);
  };
  document.querySelectorAll('.ph').forEach(function (ph) {
    var img = ph.querySelector('img');
    if (img) whenLoaded(img, function () { ph.classList.add('has-image'); }, function () { img.remove(); });
  });
  var collage = document.querySelector('.hero-collage');
  if (collage) {
    var cImg = collage.querySelector('img');
    whenLoaded(cImg, function () { collage.hidden = false; }, function () { collage.remove(); });
  }

  // ---------- Toast ----------
  var toast;
  var say = function (msg) {
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(say.t);
    say.t = setTimeout(function () { toast.classList.remove('show'); }, 3200);
  };

  // ---------- Booking demo: any [data-book] button reserves in place ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]');
    if (!b) return;
    e.preventDefault();
    var on = !b.classList.contains('done');
    b.classList.toggle('done', on);
    b.textContent = on ? 'Reserved' : (b.dataset.label || 'Book');
    if (on) say('Spot held for ' + b.dataset.book + '. Concept site: nothing was booked.');
  });

  if (!S) return;

  // ---------- Schedule helpers ----------
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fmt = function (t) { // "18:30" -> "6:30 pm"
    var h = +t.slice(0, 2), m = t.slice(3);
    return ((h + 11) % 12 + 1) + ':' + m + (h < 12 ? ' am' : ' pm');
  };
  var parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var first = parse(S.start), last = parse(S.end);
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var today = now < first ? first : now > last ? first : now; // keep the demo inside October–March
  var todayIso = iso(today);

  // Everything happening on a date: weekly classes (unless closed), specials, events
  var dayItems = function (d) {
    var key = iso(d), items = [];
    var closed = S.closures[key];
    if (d < first || d > last) return { items: items };
    if (!closed) {
      S.weekly.forEach(function (w) {
        if (w[0] === d.getDay()) items.push({ t: w[1], slug: w[2], who: w[3] });
      });
    }
    S.specials.forEach(function (s) { if (s.date === key) items.push({ t: s.time, slug: s.slug, who: s.who, note: s.note }); });
    S.events.forEach(function (ev) {
      ev.dates.forEach(function (dt) { if (dt === key) items.push({ t: ev.time, slug: ev.slug, who: ev.who, event: ev }); });
    });
    items.sort(function (a, b) { return a.t < b.t ? -1 : 1; });
    return { items: items, closed: closed };
  };
  var info = function (it) {
    if (it.event) return { name: it.event.short, url: 'events.html#' + it.slug, dot: 'dot-event', end: it.event.end };
    var c = S.classes[it.slug];
    return { name: it.note || c.name, url: c.url, dot: 'dot-' + it.slug, len: c.len };
  };
  var endTime = function (t, len) {
    var m = +t.slice(0, 2) * 60 + +t.slice(3) + len;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  // ---------- This week (home) ----------
  var week = document.getElementById('this-week');
  if (week) {
    var html = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(today); d.setDate(today.getDate() + i);
      if (d > last) break;
      var day = dayItems(d);
      html += '<div class="week-day' + (i === 0 ? ' today' : '') + '">' + (i === 0 ? 'Today' : DAYS[d.getDay()]) + ' &middot; ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + '</div>';
      if (day.closed) html += '<div class="session closed"><span class="time">All day</span><div class="name"><span class="serif" style="font-size:1.3rem">' + esc(day.closed) + '</span></div><span></span></div>';
      day.items.forEach(function (it) {
        var f = info(it);
        var end = it.event ? f.end : endTime(it.t, f.len);
        html += '<div class="session' + (it.event ? ' is-event' : '') + '"><span class="time">' + fmt(it.t) + ' &ndash; ' + fmt(end) + '</span>'
          + '<div><div class="name"><span class="dot ' + f.dot + '"></span><a href="' + f.url + '">' + esc(f.name) + '</a></div><div class="with">with ' + esc(it.who) + '</div></div>'
          + '<button type="button" class="btn small ghost" data-book="' + esc(f.name) + '">Book</button></div>';
      });
    }
    week.innerHTML = html;
  }

  // ---------- Calendar ----------
  var cal = document.getElementById('calendar');
  if (cal) {
    var grid = cal.querySelector('.cal-grid');
    var title = cal.querySelector('.cal-title');
    var dayPanel = cal.querySelector('.cal-day');
    var monthBtns = cal.querySelectorAll('.cal-months button');
    var prev = cal.querySelector('.cal-prev'), next = cal.querySelector('.cal-next');
    var legendBtns = cal.querySelectorAll('.legend button[data-filter]');
    var months = [];
    for (var m = new Date(first); m <= last; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(new Date(m));
    var hidden = {};
    var mi = 0, selected = todayIso;
    months.forEach(function (mm, j) { if (mm.getMonth() === today.getMonth() && mm.getFullYear() === today.getFullYear()) mi = j; });

    var visible = function (it) { return !hidden[it.event ? 'event' : it.slug]; };

    var renderDay = function (key) {
      var d = parse(key), day = dayItems(d);
      var items = day.items.filter(visible);
      var h = '<h3>' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '</h3>';
      if (day.closed) h += '<p class="muted">' + esc(day.closed) + '</p>';
      else if (!items.length) h += '<p class="muted">Nothing on this day for the classes you have selected.</p>';
      items.forEach(function (it) {
        var f = info(it);
        h += '<div class="session' + (it.event ? ' is-event' : '') + '"><span class="time">' + fmt(it.t) + '</span>'
          + '<div><div class="name"><span class="dot ' + f.dot + '"></span><a href="' + f.url + '">' + esc(f.name) + '</a></div><div class="with">with ' + esc(it.who) + '</div></div>'
          + '<button type="button" class="btn small ghost" data-book="' + esc(f.name) + '">Book</button></div>';
      });
      dayPanel.innerHTML = h;
    };

    var render = function () {
      var mm = months[mi], y = mm.getFullYear(), mo = mm.getMonth();
      title.textContent = MONTHS[mo] + (mo === 0 || mi === 0 ? ' ' + y : '');
      monthBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === mi); });
      prev.disabled = mi === 0; next.disabled = mi === months.length - 1;
      var lead = (new Date(y, mo, 1).getDay() + 6) % 7; // weeks start on Monday; weekday names are deliberately not shown
      var n = new Date(y, mo + 1, 0).getDate();
      var h = '';
      for (var b = 0; b < lead; b++) h += '<div class="cal-cell blank" aria-hidden="true"></div>';
      for (var dd = 1; dd <= n; dd++) {
        var d = new Date(y, mo, dd), key = iso(d), day = dayItems(d);
        var items = day.items.filter(visible);
        var cls = 'cal-cell' + (key === todayIso ? ' today' : '') + (d < today ? ' past' : '') + (key === selected ? ' selected' : '');
        h += '<div class="' + cls + '" data-date="' + key + '" role="button" tabindex="0" aria-label="' + MONTHS[mo] + ' ' + dd + ', ' + (day.closed ? day.closed : items.length + ' sessions') + '"><span class="n">' + dd + '</span>';
        if (day.closed) h += '<span class="cal-note">' + esc(day.closed) + '</span>';
        var dots = '';
        items.forEach(function (it) {
          var f = info(it);
          h += '<div class="cal-item' + (it.event ? ' event' : '') + '"><span class="dot ' + f.dot + '"></span><a href="' + f.url + '"><b>' + esc(f.name) + '</b><span class="tm">' + fmt(it.t) + '</span></a></div>';
          dots += '<span class="dot ' + f.dot + '"></span>';
        });
        h += '<span class="cal-dots" aria-hidden="true">' + dots + '</span></div>';
      }
      var tail = (7 - (lead + n) % 7) % 7;
      for (var t = 0; t < tail; t++) h += '<div class="cal-cell blank" aria-hidden="true"></div>';
      grid.innerHTML = h;
      if (parse(selected).getMonth() !== mo) selected = iso(new Date(y, mo, 1));
      grid.querySelectorAll('.cal-cell').forEach(function (c) { c.classList.toggle('selected', c.dataset.date === selected); });
      renderDay(selected);
    };

    var go = function (j) { mi = Math.max(0, Math.min(months.length - 1, j)); render(); };
    monthBtns.forEach(function (b, j) { b.addEventListener('click', function () { go(j); }); });
    prev.addEventListener('click', function () { go(mi - 1); });
    next.addEventListener('click', function () { go(mi + 1); });

    var pick = function (cell) {
      if (!cell || !cell.dataset.date) return;
      selected = cell.dataset.date;
      grid.querySelectorAll('.cal-cell').forEach(function (c) { c.classList.toggle('selected', c === cell); });
      renderDay(selected);
    };
    grid.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.matchMedia('(min-width: 761px)').matches) return;
      if (e.target.closest('a')) e.preventDefault(); // on phones a tap opens the day below
      pick(e.target.closest('.cal-cell'));
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target.closest('.cal-cell')); }
    });

    // Legend doubles as a filter
    var syncLegend = function () { legendBtns.forEach(function (b) { b.setAttribute('aria-pressed', !hidden[b.dataset.filter]); }); };
    legendBtns.forEach(function (b) {
      b.addEventListener('click', function () { hidden[b.dataset.filter] = !hidden[b.dataset.filter]; syncLegend(); render(); });
    });
    var only = cal.querySelector('.legend .reset');
    if (only) only.addEventListener('click', function () { hidden = {}; syncLegend(); render(); });

    // ?class=root shows just that class
    var q = new URLSearchParams(location.search).get('class');
    if (q && S.classes[q]) {
      legendBtns.forEach(function (b) { if (b.dataset.filter !== q) hidden[b.dataset.filter] = true; });
      syncLegend();
    }
    render();
  }

  // ---------- Event dates: fade the ones already gone ----------
  document.querySelectorAll('.dates li[data-date]').forEach(function (li) {
    if (parse(li.dataset.date) < now) li.classList.add('past');
  });

  // ---------- Demo forms ----------
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest('.field').classList.toggle('error', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var wrap = form.parentElement, name = form.querySelector('[name="name"]');
      var slot = wrap.querySelector('[data-name]');
      if (slot && name) slot.textContent = name.value.trim().split(' ')[0];
      wrap.classList.add('sent');
      wrap.querySelector('.sent-msg').focus();
    });
  });
  document.querySelectorAll('.newsletter').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input');
      if (!/^\S+@\S+\.\S+$/.test(input.value)) { input.focus(); return; }
      f.classList.add('done');
      f.innerHTML = '<span style="padding:10px 0;font-size:.92rem">Thank you. Sun notes arrive on the new moon.</span>';
    });
  });
})();
