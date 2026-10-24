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
  var bookUrl = function (it, key) {
    if (it.event) return 'book.html?e=' + it.slug + '&d=' + key;
    return 'book.html?c=' + it.slug + '&d=' + key + '&t=' + it.t + '&w=' + encodeURIComponent(it.who) + (it.note ? '&n=' + encodeURIComponent(it.note) : '');
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
          + '<a class="btn small ghost" href="' + bookUrl(it, iso(d)) + '">Book</a></div>';
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
          + '<a class="btn small ghost" href="' + bookUrl(it, key) + '">Book</a></div>';
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


  // ---------- Checkout (demo: nothing is charged or sent) ----------
  var co = document.getElementById('checkout');
  if (co) {
    var q = new URLSearchParams(location.search);
    var ev = null, cls = null, key = q.get('d'), t = q.get('t'), who = q.get('w'), note = q.get('n');
    if (q.get('e')) ev = S.events.filter(function (e) { return e.slug === q.get('e'); })[0];
    if (q.get('c')) cls = S.classes[q.get('c')];
    var passes = [
      { id: 'intro', label: 'Intro offer', sub: 'New students: two weeks of unlimited classes', price: 49 },
      { id: 'drop', label: 'Drop-in', sub: 'One class, any time', price: 28 },
      { id: 'pack5', label: '5-class pack', sub: 'Valid six months', price: 130 },
      { id: 'pack10', label: '10-class pack', sub: 'Valid six months', price: 240 },
      { id: 'member', label: 'Membership', sub: 'Unlimited classes and 10% off events, billed monthly', price: 165, per: '/mo' }
    ];
    var passId = q.get('p');
    if (!ev && !cls && !passId) { // no choice yet: offer the next class on the schedule
      for (var k = 0; k < 14 && !cls; k++) {
        var dd = new Date(today); dd.setDate(today.getDate() + k);
        var first = dayItems(dd).items.filter(function (x) { return !x.event; })[0];
        if (first) { cls = S.classes[first.slug]; key = iso(dd); t = first.t; who = first.who; q.set('c', first.slug); }
      }
    }
    var day = key ? parse(key) : now;
    var dateText = DAYS[day.getDay()] + ', ' + MONTHS[day.getMonth()] + ' ' + day.getDate();
    var name, timeText, options;
    if (passId) {
      options = passes;
      name = 'Passes & memberships';
      document.getElementById('co-kind').textContent = 'Pass';
      document.getElementById('co-img').src = 'images/studio.jpg';
      document.getElementById('co-change').href = 'about.html#pricing';
      document.getElementById('co-change').textContent = 'Compare prices';
      document.querySelector('#co-date').previousElementSibling.textContent = 'Starts';
      document.querySelector('#co-time').previousElementSibling.textContent = 'Use';
      dateText = 'Today, ' + MONTHS[now.getMonth()] + ' ' + now.getDate();
      timeText = 'Use it on any class on the calendar';
      who = 'All Sunhouse teachers';
      document.querySelector('.page-head h1').textContent = 'Buy a pass';
      document.querySelector('.page-head .lede').textContent = 'Pick a pass or membership. Your credits are ready to use on the calendar straight away.';
    } else if (ev) {
      name = ev.name; t = ev.time; who = ev.who;
      timeText = fmt(ev.time) + ' – ' + fmt(ev.end);
      options = [
        { id: 'ticket', label: 'Event ticket', sub: 'One place at this workshop', price: ev.price },
        { id: 'member', label: 'Member ticket', sub: '10% off with a Sunhouse membership', price: Math.round(ev.price * 0.9 * 100) / 100 }
      ];
      document.getElementById('co-kind').textContent = 'Monthly event';
      document.getElementById('co-img').src = 'images/event-' + ev.slug + '.jpg';
      document.getElementById('co-change').href = 'events.html#' + ev.slug;
    } else {
      name = note || cls.name;
      timeText = fmt(t) + ' – ' + fmt(endTime(t, cls.len)) + ' · ' + cls.len + ' min';
      options = [
        { id: 'drop', label: 'Drop-in', sub: 'Just this class', price: 28 },
        { id: 'intro', label: 'Intro offer', sub: 'New students: two weeks of unlimited classes', price: 49 },
        { id: 'pack', label: '10-class pack', sub: 'This class plus nine more, valid six months', price: 240 },
        { id: 'member', label: 'Membership', sub: 'Unlimited classes, billed monthly', price: 165, per: '/mo' }
      ];
      document.getElementById('co-kind').textContent = cls.style;
      document.getElementById('co-img').src = cls.img;
      document.getElementById('co-change').href = 'calendar.html?class=' + q.get('c');
    }
    document.getElementById('co-img').alt = name;
    document.getElementById('co-name').textContent = name;
    document.getElementById('co-date').textContent = dateText;
    document.getElementById('co-time').textContent = timeText;
    document.getElementById('co-who').textContent = who || 'Sunhouse teachers';
    document.title = (passId ? 'Buy a pass' : 'Book ' + name) + ' — Sunhouse Yoga';

    var money = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n); };
    var box = document.getElementById('co-options');
    box.innerHTML = options.map(function (o, i) {
      var on = passId ? o.id === passId : i === 0;
      return '<label class="co-option"><input type="radio" name="pass" value="' + o.id + '"' + (on ? ' checked' : '') + '>'
        + '<span class="co-opt-text"><b>' + o.label + '</b><small>' + o.sub + '</small></span><span class="co-price">' + money(o.price) + (o.per || '') + '</span></label>';
    }).join('');
    var total = document.getElementById('co-total'), pay = document.getElementById('co-pay');
    if (!box.querySelector('input:checked')) box.querySelector('input').checked = true;
    var current = function () { var v = box.querySelector('input:checked').value; return options.filter(function (o) { return o.id === v; })[0]; };
    var sync = function () {
      var o = current(); total.textContent = money(o.price) + (o.per || '');
      pay.textContent = 'Pay ' + money(o.price) + (passId ? '' : ' & book');
      if (passId) { name = o.label; document.getElementById('co-name').textContent = o.label; }
    };
    box.addEventListener('change', sync); sync();
    var first = document.getElementById('b-first');
    first.addEventListener('change', function () { // nudge new students toward the intro offer
      var intro = box.querySelector('input[value="intro"]');
      if (first.checked && intro) { intro.checked = true; sync(); }
    });

    // light card formatting
    var card = document.getElementById('b-card'), exp = document.getElementById('b-exp');
    card.addEventListener('input', function () { card.value = card.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
    exp.addEventListener('input', function () { var v = exp.value.replace(/\D/g, '').slice(0, 4); exp.value = v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v; });

    var form = document.getElementById('co-form'), err = document.getElementById('co-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var checks = [
        ['b-name', function (v) { return v.trim().length > 1; }, 'Please add your name.'],
        ['b-email', function (v) { return /^\S+@\S+\.\S+$/.test(v); }, 'Please add a valid email.'],
        ['b-card', function (v) { return v.replace(/\D/g, '').length === 16; }, 'The card number should be 16 digits.'],
        ['b-exp', function (v) { return /^(0[1-9]|1[0-2]) \/ \d\d$/.test(v); }, 'Expiry should look like 08 / 28.'],
        ['b-cvc', function (v) { return /^\d{3,4}$/.test(v); }, 'CVC should be 3 or 4 digits.'],
        ['b-zip', function (v) { return v.trim().length >= 5; }, 'Please add your ZIP code.']
      ];
      for (var i = 0; i < checks.length; i++) {
        var el = document.getElementById(checks[i][0]);
        var ok = checks[i][1](el.value);
        el.closest('.field').classList.toggle('error', !ok);
        if (!ok) { err.textContent = checks[i][2]; el.focus(); return; }
      }
      err.textContent = '';
      var o = current();
      var nm = document.getElementById('b-name').value.trim().split(' ')[0];
      co.querySelector('[data-name]').textContent = nm;
      var mail = document.getElementById('b-email').value.trim();
      document.getElementById('co-done-text').textContent = passId
        ? o.label + ', ' + money(o.price) + (o.per || '') + '. Your credits are ready: book any class on the calendar. A receipt is on its way to ' + mail + '.'
        : name + ', ' + dateText + ' at ' + fmt(t) + '. ' + o.label + ', ' + money(o.price) + (o.per || '') + '. A confirmation is on its way to ' + mail + '.';
      if (passId) { co.querySelector('.co-done .eyebrow').textContent = 'Purchase complete'; co.querySelector('.co-done h2').firstChild.textContent = 'Welcome to Sunhouse, '; }
      form.hidden = true;
      var done = document.getElementById('co-done'); done.hidden = false; done.focus();
      form.reset(); // clear the demo card details straight away
    });
  }


  // ---------- Events: flipping magazine stack ----------
  var mag = document.querySelector('[data-mag]');
  if (mag) {
    var covers = [].slice.call(mag.querySelectorAll('.mag-cover'));
    var panels = [].slice.call(mag.querySelectorAll('.mag-panel'));
    var countEl = mag.querySelector('.mag-count b');
    var n = covers.length, cur = 0, busy = false, auto;
    var nextDate = function (slug) {
      var ev = S && S.events.filter(function (e) { return e.slug === slug; })[0];
      if (!ev) return null;
      var up = ev.dates.filter(function (d) { var p = d.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]) >= new Date(new Date().toDateString()); })[0];
      return up || ev.dates[ev.dates.length - 1];
    };
    panels.forEach(function (p) {
      var d = nextDate(p.dataset.slug), r = p.querySelector('[data-reserve]');
      if (d && r) r.href = 'book.html?e=' + p.dataset.slug + '&d=' + d;
    });
    var layout = function () {
      covers.forEach(function (c, i) { c.dataset.pos = String((i - cur + n) % n); });
      panels.forEach(function (p, i) { p.classList.toggle('active', i === cur); });
      countEl.textContent = (cur < 9 ? '0' : '') + (cur + 1);
    };
    var go = function (dir) {
      if (busy) return; busy = true;
      if (dir > 0) { // the top cover flips away like a page, then slides to the back
        var top = covers[cur];
        top.dataset.pos = 'out';
        setTimeout(function () {
          top.classList.add('no-anim'); cur = (cur + 1) % n; layout();
          busy = false; setTimeout(function () { top.classList.remove('no-anim'); }, 40);
        }, 650);
      } else {
        cur = (cur - 1 + n) % n; var back = covers[cur];
        back.classList.add('no-anim'); back.dataset.pos = 'out';
        back.offsetWidth; // apply the 'out' position before animating back in
        setTimeout(function () { back.classList.remove('no-anim'); layout(); setTimeout(function () { busy = false; }, 650); }, 40);
      }
    };
    var restart = function () {
      clearInterval(auto);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto = setInterval(function () { go(1); }, 4500);
    };
    mag.querySelector('.mag-next').addEventListener('click', function () { go(1); restart(); });
    mag.querySelector('.mag-prev').addEventListener('click', function () { go(-1); restart(); });
    mag.querySelector('.mag-stack').addEventListener('click', function (e) { e.preventDefault(); go(1); restart(); });
    mag.addEventListener('mouseenter', function () { clearInterval(auto); });
    mag.addEventListener('mouseleave', restart);
    layout(); restart();
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
