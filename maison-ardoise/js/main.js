// Maison Ardoise — nav, reveals, shop-the-look hotspots, demo forms
(function () {
  var body = document.body;
  var header = document.querySelector('.site-header');
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

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Fade sections in as they enter the viewport
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

  // Shop the Look: show the mood board once it exists, link hotspots to the list
  var board = document.querySelector('.board');
  if (board) {
    var img = board.querySelector('img');
    if (img) {
      var show = function () { board.classList.add('has-image'); };
      var hide = function () { img.remove(); };
      if (img.complete) { img.naturalWidth ? show() : hide(); }
      else { img.addEventListener('load', show); img.addEventListener('error', hide); }
    }
    var items = document.querySelectorAll('.shop-list li');
    document.querySelectorAll('.hotspot').forEach(function (h) {
      h.addEventListener('mouseenter', function () { setActive(h.dataset.item); });
      h.addEventListener('focus', function () { setActive(h.dataset.item); });
      h.addEventListener('click', function () { setActive(h.dataset.item); });
    });
    items.forEach(function (li) {
      li.addEventListener('mouseenter', function () { setActive(li.dataset.item); });
    });
    function setActive(id) {
      items.forEach(function (li) { li.classList.toggle('active', li.dataset.item === id); });
      document.querySelectorAll('.hotspot').forEach(function (h) { h.classList.toggle('active', h.dataset.item === id); });
    }
  }

  // Service links arrive with their service preselected (contact.html?service=virtual)
  var wanted = new URLSearchParams(window.location.search).get('service');
  if (wanted) {
    var radio = document.querySelector('input[name="service"][value="' + wanted + '"]');
    if (radio) radio.checked = true;
  }

  // Concept site: forms confirm in place, nothing is sent
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.hasAttribute('data-visit') && !checkVisitDate(form)) return;
      var name = form.querySelector('[name="name"]');
      var slot = form.nextElementSibling && form.nextElementSibling.querySelector('[data-name]');
      if (name && slot) slot.textContent = name.value.trim().split(' ')[0];
      var success = form.nextElementSibling;
      if (success) {
        success.querySelectorAll('[data-field]').forEach(function (el) {
          var key = el.getAttribute('data-field');
          var input = form.querySelector('[name="' + key + '"]:checked') || form.querySelector('[name="' + key + '"]');
          var val = input ? input.value : '';
          if (input && input.type === 'date' && val) val = formatDate(val);
          el.textContent = key === 'type' ? val.toLowerCase() : val;
        });
      }
      form.classList.add('sent');
      if (form.nextElementSibling) form.nextElementSibling.focus();
    });
  });

  // Studio visits: dates must be in the future and fall Tuesday to Saturday
  document.querySelectorAll('form[data-visit] input[type="date"]').forEach(function (input) {
    var d = new Date(); d.setDate(d.getDate() + 1);
    input.min = d.toISOString().slice(0, 10);
  });
  function checkVisitDate(form) {
    var error = form.querySelector('.form-error');
    var input = form.querySelector('[name="date"]');
    var day = new Date(input.value + 'T12:00:00').getDay();
    if (day === 0 || day === 1) {
      error.textContent = 'The studio is open Tuesday to Saturday. Please choose another date.';
      error.hidden = false;
      input.focus();
      return false;
    }
    error.hidden = true;
    return true;
  }
  function formatDate(value) {
    return new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  var news = document.querySelector('.newsletter');
  if (news) {
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = news.querySelector('input');
      if (!input.checkValidity()) { input.reportValidity(); return; }
      news.innerHTML = '<span style="padding:10px 0;font-family:var(--serif);font-style:italic;font-size:1.1rem">Merci — you’re on the list.</span>';
    });
  }
})();
