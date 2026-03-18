/* global crcAdm, ajaxurl */
/**
 * Comic Reader Companion — Admin UI scripts
 *
 * Responsibilities:
 *  - Accordion toggle for Advanced Settings
 *  - Password show/hide for API Key field
 *  - AJAX "Test Connection" button
 *  - Sync form loading-state (disable buttons + spinner)
 */
(function () {
    'use strict';

    /* ── Accordion ────────────────────────────────────────────── */
    document.querySelectorAll('.crc-adm-accordion-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var acc = btn.closest('.crc-adm-accordion');
            if (acc) acc.classList.toggle('is-open');
        });
    });

    /* ── Password show / hide ─────────────────────────────────── */
    document.querySelectorAll('[data-crc-toggle-pw]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = document.getElementById(btn.dataset.crcTogglePw);
            if (!target) return;
            var show = target.type === 'password';
            target.type        = show ? 'text' : 'password';
            btn.textContent    = show ? '🙈' : '👁';
            btn.setAttribute('aria-label', show ? 'ซ่อน API Key' : 'แสดง API Key');
        });
    });

    /* ── AJAX: Test Connection ────────────────────────────────── */
    var testBtn  = document.getElementById('crc-test-btn');
    var resultEl = document.getElementById('crc-test-result');

    if (testBtn && resultEl && typeof crcAdm !== 'undefined') {
        testBtn.addEventListener('click', function () {
            var baseUrl = val('crc_api_base_url').replace(/\/$/, '');
            var apiKey  = val('crc_api_key');

            if (!baseUrl || !apiKey) {
                setResult('warn', '⚠', 'กรุณากรอก URL และ API Key ก่อนทดสอบ');
                return;
            }

            testBtn.disabled    = true;
            resultEl.innerHTML  = '<span class="crc-adm-spinner"></span> กำลังทดสอบการเชื่อมต่อ…';

            var body = new URLSearchParams({
                action:   'crc_test_connection',
                nonce:    crcAdm.nonce,
                base_url: baseUrl,
                api_key:  apiKey,
            });

            fetch(ajaxurl, {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    body.toString(),
            })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                if (data.success) {
                    setResult('ok', '✓', data.data.message || 'เชื่อมต่อสำเร็จ');
                } else {
                    setResult('err', '✗', (data.data && data.data.message) || 'เชื่อมต่อไม่ได้');
                }
            })
            .catch(function () {
                setResult('err', '✗', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
            })
            .finally(function () {
                testBtn.disabled = false;
            });
        });
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function setResult(type, icon, msg) {
        var cls = 'crc-adm-badge crc-adm-badge--' +
            (type === 'ok' ? 'ok' : type === 'warn' ? 'warn' : 'err');
        resultEl.innerHTML =
            '<span class="' + cls + '">' + icon + ' ' + esc(msg) + '</span>';
    }

    function esc(str) {
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;');
    }

    /* ── Sync form: loading state ─────────────────────────────── */
    var syncForm = document.getElementById('crc-sync-form');
    if (syncForm) {
        // Track which button was clicked so we can show the spinner on it.
        var clickedSyncBtn = null;

        syncForm.querySelectorAll('button[name="crc_sync_action"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                clickedSyncBtn = btn;
            });
        });

        syncForm.addEventListener('submit', function () {
            var syncBtns = syncForm.querySelectorAll(
                'button[value="incremental"], button[value="full"]'
            );
            syncBtns.forEach(function (btn) {
                var loadingText = btn.dataset.loadingText || 'กำลังดำเนินการ…';
                if (btn === clickedSyncBtn) {
                    btn.textContent = '⟳ ' + loadingText;
                }
                btn.disabled = true;
            });
        });
    }

})();
