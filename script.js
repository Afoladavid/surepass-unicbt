// SurePass UniCBT - navigation behaviour
(function () {
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.dd-btn'));
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  var timer = null;

  function closeAll() {
    buttons.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      if (menu) menu.hidden = true;
    });
  }

  // Place the dropdown directly under its button (no gap, so hover is not lost);
  // clamp so it never leaves the screen
  function place(btn, menu) {
    var r = btn.getBoundingClientRect();
    var left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8));
    menu.style.top = r.bottom + 'px';
    menu.style.left = left + 'px';
  }

  function open(btn) {
    var menu = document.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    closeAll();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    place(btn, menu);
  }

  buttons.forEach(function (btn) {
    var li = btn.parentElement;

    // Hover (mouse devices only): open on enter, close shortly after leaving
    li.addEventListener('mouseenter', function () {
      if (!canHover.matches) return;
      clearTimeout(timer);
      open(btn);
    });
    li.addEventListener('mouseleave', function () {
      if (!canHover.matches) return;
      clearTimeout(timer);
      timer = setTimeout(closeAll, 150);
    });

    // Click / tap / keyboard
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      var wasOpen = !menu.hidden;
      // With a mouse the menu is already open from hover: a click keeps it open
      if (wasOpen && canHover.matches && e.detail > 0) return;
      if (wasOpen) { closeAll(); return; }
      open(btn);
      var first = menu.querySelector('a');
      if (first && e.detail === 0) first.focus(); // keyboard users land on first item
    });
  });

  // Close on outside click, Escape, resize, page scroll, nav bar scroll
  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openBtn = buttons.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
      closeAll();
      if (openBtn) openBtn.focus();
    }
  });
  window.addEventListener('resize', closeAll);
  window.addEventListener('scroll', closeAll, { passive: true });
  var menuBar = document.querySelector('.menu');
  if (menuBar) menuBar.addEventListener('scroll', closeAll, { passive: true });
  document.querySelectorAll('.dd').forEach(function (m) {
    m.addEventListener('click', function (e) { e.stopPropagation(); closeAll(); });
  });

  // Keep the sidebar offset equal to the real header height
  var header = document.querySelector('.top');
  function setHeaderH() {
    if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  setHeaderH();
  window.addEventListener('resize', setHeaderH);
  window.addEventListener('load', setHeaderH); // fonts/images can change the height
  if (window.ResizeObserver && header) new ResizeObserver(setHeaderH).observe(header);

  // Highlight the active link in navbar, sidebar and mobile bar
  function setActive(group, link) {
    document.querySelectorAll(group).forEach(function (a) { a.classList.remove('on'); });
    link.classList.add('on');
  }
  [['.menu > li > a.nav-link'], ['.side a'], ['.bnav a']].forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (a) {
      a.addEventListener('click', function () { setActive(g[0], a); });
    });
  });
})();
