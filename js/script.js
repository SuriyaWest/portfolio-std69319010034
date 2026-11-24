/* =====================================================
   js/script.js  -  แอนิเมชันธีม Persona 3 Reload
   ใช้คู่กับส่วน "ANIMATIONS" ท้ายไฟล์ css/style.css
   ===================================================== */
(function () {
    'use strict';

    /* ---------- ตั้งค่า ---------- */

    // ช่องใส่รูป cut-in (ตัวละครสไลด์ขึ้นมาตอนกดเมนู)
    // ใส่ path รูปของคุณเอง เช่น 'images/cutin.png'  (ปล่อยว่าง '' = ไม่แสดงรูป)
    // แนะนำไฟล์ .png พื้นหลังโปร่งใส
    var CUTIN_IMAGE = '';

    // ภาพพื้นหลังหน้าแรก (เต็มจอ)
    // วางไฟล์ภาพของคุณไว้ที่ images/home-bg.gif ได้เลย (หรือเปลี่ยนชื่อ/นามสกุลตรงนี้ให้ตรงกับไฟล์)
    // ถ้าไม่มีไฟล์ หน้าแรกจะใช้ฉากใต้น้ำที่วาดด้วย CSS แทน
    var HOME_BG_IMAGE = 'images/home-bg.gif';

    // ชื่อที่จะโชว์บนแถบ wipe ตอนกดไปแต่ละหน้า
    var PAGE_LABELS = {
        'index': 'Home',
        'about': 'About',
        'skills': 'Skills',
        'gallery': 'Gallery',
        'contact': 'Contact',
        'other': 'Other'
    };

    var reduceMotion = !!(window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var root = document.documentElement;


    /* =====================================================
       0) เมนูหน้าแรก (ทำงานเสมอ แม้ผู้ใช้ปิดแอนิเมชัน)
       ===================================================== */
    function initHome() {
        var menu = document.querySelector('.home-menu');
        if (!menu) return;                       // ไม่ใช่หน้าแรก

        var items = Array.prototype.slice.call(menu.querySelectorAll('a'));
        var desc = document.querySelector('.home-desc');
        var descTitle = document.querySelector('.home-desc-title');
        var descText = document.querySelector('.home-desc-text');
        var index = 0;

        // เลือกรายการที่ n: ไฮไลต์ + ย่อรายการที่อยู่ไกล + เปลี่ยนคำอธิบาย
        function select(n) {
            index = (n + items.length) % items.length;
            items.forEach(function (a, i) {
                var li = a.parentNode;
                li.classList.toggle('selected', i === index);
                li.style.setProperty('--d', Math.abs(i - index));
            });
            var a = items[index];
            descTitle.textContent = a.getAttribute('data-title') || a.textContent;
            descText.textContent = a.getAttribute('data-desc') || '';
            if (desc && !reduceMotion) {         // ให้คำอธิบายสไลด์เข้าใหม่ทุกครั้ง
                desc.classList.remove('flash');
                void desc.offsetWidth;
                desc.classList.add('flash');
            }
        }

        items.forEach(function (a, i) {
            a.addEventListener('mouseenter', function () { if (index !== i) select(i); });
            a.addEventListener('focus', function () { if (index !== i) select(i); });
        });

        // คีย์บอร์ด: ↑ ↓ (หรือ W S) เลือก, Enter ยืนยัน
        document.addEventListener('keydown', function (e) {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            var k = e.key;
            if (k === 'ArrowDown' || k === 's' || k === 'S') {
                e.preventDefault();
                select(index + 1);
            } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
                e.preventDefault();
                select(index - 1);
            } else if (k === 'Enter' && document.activeElement !== items[index]) {
                e.preventDefault();
                items[index].click();
            }
        });

        select(0);

        // ภาพพื้นหลัง: ถ้าโหลดไฟล์ได้ค่อยนำมาใช้ ถ้าไม่มีไฟล์ก็ใช้ฉาก CSS ต่อไป
        var bg = document.querySelector('.home-bg');
        if (HOME_BG_IMAGE && bg) {
            var probe = new Image();
            probe.onload = function () {
                bg.style.backgroundImage = 'url("' + HOME_BG_IMAGE + '")';
                document.body.classList.add('has-art');
            };
            probe.src = HOME_BG_IMAGE;
        }

        // ฟองอากาศลอยขึ้น
        var box = document.querySelector('.home-bubbles');
        if (box && !reduceMotion) {
            for (var b = 0; b < 16; b++) {
                var s = document.createElement('span');
                var size = 6 + Math.random() * 18;
                s.className = 'bubble';
                s.style.width = s.style.height = size + 'px';
                s.style.left = (Math.random() * 100) + '%';
                s.style.setProperty('--sway', (Math.random() * 60 - 30) + 'px');
                s.style.animationDuration = (9 + Math.random() * 10) + 's';
                s.style.animationDelay = (-Math.random() * 18) + 's';
                box.appendChild(s);
            }
        }
    }

    initHome();

    // ถ้าเครื่องผู้ใช้ตั้งค่า "ลดแอนิเมชัน" ไว้ ส่วนที่เหลือไม่ต้องทำงาน
    if (reduceMotion) return;


    /* =====================================================
       1) WIPE ตอนกดลิงก์ไปหน้าอื่นในเว็บเรา
       ===================================================== */
    var leaving = false;

    // ชื่อไฟล์ของลิงก์ เช่น "about.html" -> "about"
    function pageName(url) {
        var file = new URL(url, location.href).pathname.split('/').pop() || 'index.html';
        return file.replace(/\.html?$/i, '');
    }

    // เป็นลิงก์ไปหน้าอื่นในเว็บเราหรือเปล่า (ไม่ใช่ mailto / เว็บนอก / แท็บใหม่)
    function isInternalPage(a) {
        if (!a || !a.href) return false;
        if (a.target && a.target !== '_self') return false;
        if (a.hasAttribute('download')) return false;

        var url = new URL(a.href, location.href);
        if (url.protocol !== location.protocol) return false;
        if (url.host !== location.host) return false;
        if (url.pathname === location.pathname && url.search === location.search) return false;
        return true;
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var a = e.target.closest ? e.target.closest('a') : null;
        if (!isInternalPage(a)) return;

        e.preventDefault();
        if (leaving) return;
        leaving = true;

        var name = pageName(a.href);
        document.body.setAttribute('data-p3-label', PAGE_LABELS[name] || name);
        root.classList.add('p3-leaving');

        // รอให้แถบปัดมาทับจอเสร็จก่อนค่อยเปลี่ยนหน้า
        setTimeout(function () {
            window.location.href = a.href;
        }, 560);
    });

    // กดปุ่ม Back แล้วหน้าเก่าถูกดึงกลับมาจาก cache -> เอาแถบออก
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            leaving = false;
            root.classList.remove('p3-leaving');
            document.body.removeAttribute('data-p3-label');
        }
    });

    // รูป cut-in (ถ้าใส่ไว้)
    if (CUTIN_IMAGE) {
        var cutin = new Image();
        cutin.className = 'p3-cutin';
        cutin.alt = '';
        cutin.src = CUTIN_IMAGE;
        document.body.appendChild(cutin);
    }


    /* =====================================================
       2) แถบไฮไลต์ขาวเลื่อนตามเมนูที่เมาส์ชี้
       ===================================================== */
    function initNav() {
        var nav = document.querySelector('nav');
        var ul = nav ? nav.querySelector('ul') : null;
        if (!ul) return;

        var links = Array.prototype.slice.call(ul.querySelectorAll('a'));
        if (!links.length) return;

        // หาว่าตอนนี้อยู่หน้าไหน
        var here = pageName(location.href);
        var current = null;
        links.forEach(function (a) {
            if (pageName(a.href) === here) current = a;
        });

        var cursor = document.createElement('span');
        cursor.className = 'nav-cursor';
        ul.appendChild(cursor);
        nav.classList.add('js-nav');

        var started = false;   // เริ่มทำงานหลังเมนูสไลด์เข้ามาครบ

        function place(a) {
            var li = a.parentNode;
            cursor.style.left = li.offsetLeft + 'px';
            cursor.style.top = li.offsetTop + 'px';
            cursor.style.width = li.offsetWidth + 'px';
            cursor.style.height = li.offsetHeight + 'px';
        }

        function moveTo(a) {
            links.forEach(function (l) { l.classList.toggle('on', l === a); });
            if (a) {
                place(a);
                cursor.classList.add('ready');
            } else {
                cursor.classList.remove('ready');
            }
        }

        // วางแถบไว้ที่หน้าปัจจุบันก่อน โดยไม่ต้องมีเอฟเฟกต์เลื่อน
        function placeInstantly(a) {
            cursor.style.transition = 'none';
            place(a);
            void cursor.offsetWidth;          // บังคับให้เบราว์เซอร์คำนวณตำแหน่ง
            cursor.style.transition = '';
        }

        if (current) placeInstantly(current);

        links.forEach(function (a) {
            a.addEventListener('mouseenter', function () { if (started) moveTo(a); });
            a.addEventListener('focus', function () { if (started) moveTo(a); });
        });
        ul.addEventListener('mouseleave', function () { if (started) moveTo(current); });

        window.addEventListener('resize', function () {
            var target = started ? ul.querySelector('a.on') : current;
            if (target) placeInstantly(target);
        });

        // รอให้เมนูสไลด์เข้าครบ (ประมาณ 1 วินาที) แล้วค่อยโชว์แถบ
        setTimeout(function () {
            started = true;
            moveTo(current);
        }, 1000);
    }


    /* =====================================================
       3) การ์ดโผล่ทีละใบ + แถบ progress เติมจาก 0
       ===================================================== */
    function initReveal() {
        var selector = [
            '.hero-section',
            '.quick-links-section > h3',
            '.quick-card',
            '.video-card-section',
            '.link-card',
            '.gallery-item',
            '.contact-list li',
            '.skill-category',
            '.skill-item',
            '.skill-tag',
            '.about-image',
            '.about-content'
        ].join(',');

        var items = Array.prototype.slice.call(document.querySelectorAll(selector));
        var bars = Array.prototype.slice.call(document.querySelectorAll('.progress-bar'));

        // ถ้าเบราว์เซอร์เก่ามาก ไม่มี IntersectionObserver ก็ปล่อยให้แสดงปกติ
        if (!('IntersectionObserver' in window)) return;

        // ลำดับของแต่ละใบในกลุ่มเดียวกัน (ไว้หน่วงเวลาให้โผล่ทีละใบ)
        var counter = new Map();
        items.forEach(function (el) {
            var n = counter.get(el.parentNode) || 0;
            counter.set(el.parentNode, n + 1);
            el.setAttribute('data-p3i', n);
            el.classList.add('reveal');
        });

        // แถบ progress: จำความกว้างจริงไว้ แล้วตั้งเป็น 0 รอเติมทีหลัง
        bars.forEach(function (bar) {
            var fill = bar.querySelector('.progress');
            if (fill) {
                fill.setAttribute('data-w', fill.style.width);
                fill.style.width = '0';
            }
        });

        var observer = new IntersectionObserver(function (entries) {
            // ช่วงเปิดหน้าใหม่ ให้รอแถบ wipe ปัดออกก่อน
            var base = performance.now() < 1200 ? 450 : 0;

            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                observer.unobserve(el);

                var i = Math.min(parseInt(el.getAttribute('data-p3i') || '0', 10), 8);
                var delay = base + i * 70;

                if (el.classList.contains('progress-bar')) {
                    var fill = el.querySelector('.progress');
                    if (fill) {
                        setTimeout(function () {
                            fill.style.width = fill.getAttribute('data-w');
                        }, base + 300);
                    }
                    return;
                }

                el.style.animationDelay = delay + 'ms';
                el.classList.add('is-visible');
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { observer.observe(el); });
        bars.forEach(function (bar) { observer.observe(bar); });
    }


    initNav();
    initReveal();
})();
