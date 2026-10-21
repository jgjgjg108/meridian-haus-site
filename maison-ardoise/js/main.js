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

  // Concept site: forms confirm in place, nothing is sent
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
