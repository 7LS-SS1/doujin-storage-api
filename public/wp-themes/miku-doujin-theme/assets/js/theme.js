(function () {
  'use strict';

  var toggle = document.querySelector('[data-crc-nav-toggle]');
  var shell = document.querySelector('[data-crc-nav-shell]');

  if (!toggle || !shell) {
    return;
  }

  function setOpen(nextState) {
    shell.classList.toggle('is-open', nextState);
    toggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!expanded);
  });

  document.addEventListener('click', function (event) {
    if (!shell.classList.contains('is-open')) {
      return;
    }

    if (shell.contains(event.target) || toggle.contains(event.target)) {
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
