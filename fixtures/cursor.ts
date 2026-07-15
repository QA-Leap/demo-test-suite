import { test as base, expect } from '@playwright/test';

/**
 * Visible cursor + click ripple for the showcase recordings.
 *
 * When `SHOW_CURSOR=1` (set by `scripts/record.mjs` while capturing the demo videos),
 * every page gets a small overlay that follows the mouse and pulses a ripple wherever the
 * automation clicks — so a viewer can see *what* each test is doing, not just the result.
 *
 * It's a no-op for normal and CI runs (the env var is unset), is purely visual
 * (`pointer-events: none`, so it never affects Playwright's clicks or assertions), and is
 * only wired into the UI specs — never the visual-regression lane, whose baselines must
 * stay pixel-stable.
 */
const CURSOR_SCRIPT = `
(() => {
  if (window.__qaCursor) return;
  window.__qaCursor = true;
  // Exposed for the pacing helpers: flash a green "validated ✓" outline on an element that a
  // test is asserting on. Like the click highlight, it follows the element and self-removes.
  window.__qaCheck = function (el) {
    if (!el || !el.getBoundingClientRect || !document.body) return;
    var box = document.createElement('div'); box.className = 'qa-check';
    var badge = document.createElement('div'); badge.className = 'qa-check-badge'; badge.textContent = '✓';
    document.body.appendChild(box); document.body.appendChild(badge);
    var place = function (b) {
      box.style.left = (b.left - 5) + 'px'; box.style.top = (b.top - 5) + 'px';
      box.style.width = (b.width + 10) + 'px'; box.style.height = (b.height + 10) + 'px';
      badge.style.left = (b.right + 1) + 'px'; badge.style.top = (b.top - 7) + 'px';
    };
    place(el.getBoundingClientRect());
    requestAnimationFrame(function () { box.style.opacity = '1'; badge.style.opacity = '1'; });
    var started = Date.now();
    var track = function () {
      if (!el.isConnected) { box.remove(); badge.remove(); return; }
      var b = el.getBoundingClientRect();
      if (!b.width || !b.height) { box.remove(); badge.remove(); return; }
      place(b);
      if (Date.now() - started > 850) { box.style.opacity = '0'; badge.style.opacity = '0'; setTimeout(function () { box.remove(); badge.remove(); }, 220); return; }
      requestAnimationFrame(track);
    };
    requestAnimationFrame(track);
  };
  var mount = function () {
    if (!document.body) return;
    var style = document.createElement('style');
    style.textContent =
      '.qa-cursor{position:fixed;left:-100px;top:-100px;z-index:2147483647;width:30px;height:30px;border-radius:50%;border:2.5px solid #00b8f8;background:rgba(0,184,248,.14);box-shadow:0 0 0 2px rgba(255,255,255,.85),0 3px 10px rgba(0,0,0,.28);pointer-events:none;transform:translate(-50%,-50%);transition:left .26s cubic-bezier(.22,.61,.36,1),top .26s cubic-bezier(.22,.61,.36,1),transform .13s ease}' +
      '.qa-cursor::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#00b8f8}' +
      '.qa-cursor.down{transform:translate(-50%,-50%) scale(.58)}' +
      '.qa-ripple{position:fixed;z-index:2147483646;border-radius:50%;border:3px solid #00b8f8;background:rgba(0,184,248,.16);pointer-events:none;transform:translate(-50%,-50%);animation:qaRipple .7s ease-out forwards}' +
      '@keyframes qaRipple{0%{width:14px;height:14px;opacity:.9}100%{width:86px;height:86px;opacity:0}}' +
      '.qa-dot{position:fixed;z-index:2147483647;width:13px;height:13px;border-radius:50%;background:#00b8f8;box-shadow:0 0 0 2.5px #fff,0 2px 7px rgba(0,0,0,.32);pointer-events:none;transform:translate(-50%,-50%);animation:qaDot .8s ease-out forwards}' +
      '@keyframes qaDot{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}16%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}' +
      '.qa-hl{position:fixed;z-index:2147483645;border:2.5px solid #00b8f8;border-radius:8px;background:rgba(0,184,248,.07);box-shadow:0 0 0 3px rgba(0,184,248,.16);pointer-events:none;opacity:0;transition:opacity .15s ease}' +
      '.qa-check{position:fixed;z-index:2147483644;border:2.5px solid #1e8f5c;border-radius:8px;background:rgba(34,168,108,.12);box-shadow:0 0 0 3px rgba(34,168,108,.20);pointer-events:none;opacity:0;transition:opacity .16s ease}' +
      '.qa-check-badge{position:fixed;z-index:2147483646;transform:translate(-50%,-50%);min-width:22px;height:22px;padding:0 3px;box-sizing:border-box;border-radius:11px;background:#1e8f5c;color:#fff;font:800 14px/21px -apple-system,system-ui,sans-serif;text-align:center;box-shadow:0 2px 7px rgba(0,0,0,.32);pointer-events:none;opacity:0;transition:opacity .16s ease}';
    document.head.appendChild(style);
    var cursor = document.createElement('div');
    cursor.className = 'qa-cursor';
    document.body.appendChild(cursor);
    var x = -100, y = -100;
    addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      cursor.style.left = x + 'px'; cursor.style.top = y + 'px';
    }, true);
    addEventListener('mousedown', function (e) {
      var px = e.clientX != null ? e.clientX : x;
      var py = e.clientY != null ? e.clientY : y;
      cursor.style.left = px + 'px'; cursor.style.top = py + 'px';
      cursor.classList.add('down');
      setTimeout(function () { cursor.classList.remove('down'); }, 170);
      // Bold expanding ring…
      var ripple = document.createElement('div');
      ripple.className = 'qa-ripple';
      ripple.style.left = px + 'px'; ripple.style.top = py + 'px';
      document.body.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 760);
      // …plus a precise dot that marks exactly where the click landed.
      var dot = document.createElement('div');
      dot.className = 'qa-dot';
      dot.style.left = px + 'px'; dot.style.top = py + 'px';
      document.body.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 840);
      // …and outline the control being clicked. The box FOLLOWS the element every frame and
      // vanishes the instant it's gone (modal closed) or scrolls away — so it never lingers over
      // empty space or a shifted layout.
      var target = document.elementFromPoint(px, py);
      if (target && target.closest) target = target.closest('button,a,input,select,textarea,[role="button"],[data-testid]') || target;
      if (target && target.getBoundingClientRect) {
        var hl = document.createElement('div');
        hl.className = 'qa-hl';
        document.body.appendChild(hl);
        var place = function (b) {
          hl.style.left = (b.left - 4) + 'px'; hl.style.top = (b.top - 4) + 'px';
          hl.style.width = (b.width + 8) + 'px'; hl.style.height = (b.height + 8) + 'px';
        };
        place(target.getBoundingClientRect()); // position before first paint (no flash at 0,0)
        requestAnimationFrame(function () { hl.style.opacity = '1'; });
        var started = Date.now();
        var track = function () {
          if (!target.isConnected) { hl.remove(); return; }
          var b = target.getBoundingClientRect();
          if (!b.width || !b.height || b.bottom < 4 || b.top > window.innerHeight - 4) { hl.remove(); return; }
          place(b);
          if (Date.now() - started > 850) { hl.style.opacity = '0'; setTimeout(function () { hl.remove(); }, 220); return; }
          requestAnimationFrame(track);
        };
        requestAnimationFrame(track);
      }
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
`;

export const test = base.extend({
  page: async ({ page }, use) => {
    if (process.env.SHOW_CURSOR === '1') {
      await page.addInitScript(CURSOR_SCRIPT);
    }
    await use(page);
  },
});

export { expect };
