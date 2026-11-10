// SurePass CBT - page protection (deterrent only: see notes)
(function () {
  function isField(el) { return el && el.closest && el.closest('input, textarea, select'); }
  var root = document.documentElement;

  // 1. Right-click, long-press menu, copy, cut, drag, text selection
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  ['copy', 'cut', 'dragstart', 'selectstart'].forEach(function (t) {
    document.addEventListener(t, function (e) { if (!isField(e.target)) e.preventDefault(); });
  });

  // 2. Keyboard shortcuts (Windows/Linux + Mac)
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    var blocked =
      e.key === 'F12' ||
      (mod && ['u', 's', 'p'].indexOf(k) > -1) ||                          // view source, save, print
      (mod && !isField(e.target) && ['a', 'c', 'x'].indexOf(k) > -1) ||    // select all, copy, cut
      (mod && e.shiftKey && ['i', 'j', 'c', 'k'].indexOf(k) > -1) ||       // dev tools (Windows/Linux)
      (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].indexOf(k) > -1);     // dev tools (Mac)
    if (blocked) { e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'PrintScreen' && navigator.clipboard) {
      navigator.clipboard.writeText('').catch(function () { });
    }
  }, true);

  // 3. Hide the page while developer tools are open
  var locked = false;
  function lock(on) {
    if (on === locked) return;
    locked = on;
    root.classList.toggle('locked', on);
  }
  function sizeCheck() {
    var w = window.outerWidth - window.innerWidth > 200;
    var h = window.outerHeight - window.innerHeight > 200;
    return w || h;
  }
  setInterval(function () {
    var t = performance.now();
    (function () { debugger; })();               // pauses only if dev tools are open
    var paused = performance.now() - t > 120;
    lock(paused || sizeCheck());
  }, 1000);
})();

// SurePass CBT - navigation + Your Feed behaviour
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

  // Place the dropdown directly under its button; clamp so it never leaves the screen
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

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      var wasOpen = !menu.hidden;
      if (wasOpen && canHover.matches && e.detail > 0) return;
      if (wasOpen) { closeAll(); return; }
      open(btn);
      var first = menu.querySelector('a');
      if (first && e.detail === 0) first.focus();
    });
  });

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
  window.addEventListener('load', setHeaderH);
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

  /* ---------------- Your Feed ---------------- */
  var typeSel = document.getElementById('f-type');
  var schoolSel = document.getElementById('f-school');
  var examSel = document.getElementById('f-exam');
  var goBtn = document.getElementById('f-go');
  if (!typeSel || !schoolSel || !examSel || !goBtn) return;

  // Edit these lists to match your schools. The "value" is used in the page link.
  var SCHOOLS = {
    university: [
      ['afit', 'Air Force Institute of Technology (AFIT)'],
      ['funaab', 'Federal University of Agriculture, Abeokuta (FUNAAB)'],
      ['fugashua', 'Federal University Gashua (FUGASHUA)'],
      ['kwasu', 'Kwara State University (KWASU)'],
      ['oau', 'Obafemi Awolowo University (OAU)'],
      ['ui', 'University of Ibadan (UI)'],
      ['unilag', 'University of Lagos (UNILAG)']
    ],
    polytechnic: [
      ['yabatech', 'Yaba College of Technology (YABATECH)'],
      ['lasupoly', 'Lagos State Polytechnic (LASPOTECH)'],
      ['kadpoly', 'Kaduna Polytechnic']
    ],
    college: [
      ['fcelagos', 'Federal College of Education (Technical), Akoka'],
      ['aoce', 'Adeniran Ogunsanya College of Education'],
      ['lasce', 'Lagos State College of Education']
    ]
  };

  function updateGo() {
    goBtn.disabled = !(typeSel.value && schoolSel.value && examSel.value);
  }

  typeSel.addEventListener('change', function () {
    schoolSel.innerHTML = '<option value="">School</option>';
    var list = SCHOOLS[typeSel.value] || [];
    list.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s[0];
      o.textContent = s[1];
      schoolSel.appendChild(o);
    });
    schoolSel.disabled = !list.length;
    updateGo();
  });
  schoolSel.addEventListener('change', updateGo);
  examSel.addEventListener('change', updateGo);

  goBtn.addEventListener('click', function () {
    if (goBtn.disabled) return;
    // Replace with your real page, e.g. 'school.html?school=' + ... + '&exam=' + ...
    window.location.hash = 'school-' + schoolSel.value + '-' + examSel.value;
  });

  // Customise = clear the selections
  var resetBtn = document.getElementById('feed-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    typeSel.value = '';
    schoolSel.innerHTML = '<option value="">School</option>';
    schoolSel.disabled = true;
    examSel.value = '';
    updateGo();
  });

  // Share + Copy link
  var shareBtn = document.getElementById('f-share');
  var copyBtn = document.getElementById('f-copy');

  if (shareBtn) shareBtn.addEventListener('click', function () {
    var data = { title: 'SurePass CBT', text: 'Practise for JAMB, WAEC and NECO on SurePass CBT', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () { }); }
    else if (copyBtn) { copyBtn.click(); }
  });

  if (copyBtn) copyBtn.addEventListener('click', function () {
    var label = copyBtn.querySelector('span');
    function done(ok) {
      if (!label) return;
      label.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(function () { label.textContent = 'Copy link'; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
    } else {
      var t = document.createElement('textarea');
      t.value = location.href;
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { }
      document.body.removeChild(t);
      done(ok);
    }
  });
})();















