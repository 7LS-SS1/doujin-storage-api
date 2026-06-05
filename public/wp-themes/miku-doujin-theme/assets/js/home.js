(function () {
  'use strict';

  document.querySelectorAll('[data-crc-jump-select]').forEach(function (select) {
    select.addEventListener('change', function () {
      if (!select.value) {
        return;
      }

      window.location.href = select.value;
    });
  });
})();
