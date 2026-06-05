(function () {
  'use strict';

  var toggle = document.querySelector('[data-crc-nav-toggle]');
  var nav = document.querySelector('[data-crc-nav-shell]');

  if (!toggle || !nav) {
    return;
  }

  function setOpen(nextState) {
    nav.classList.toggle('is-open', nextState);
    toggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
  });

  document.addEventListener('click', function (event) {
    if (!nav.classList.contains('is-open')) {
      return;
    }

    if (nav.contains(event.target) || toggle.contains(event.target)) {
      return;
    }

    setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 920) {
      setOpen(false);
    }
  });
})();
