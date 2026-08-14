/* ============================================================
   APP — рендер секций из window.SITE и вся интерактивность.
   Не содержит текстов клиента — их место в content.js.
   ============================================================ */
(function () {
  "use strict";
  const S = window.SITE;

  /* ---------- утилиты ---------- */
  const DAY_NAMES = { 1: "Понедельник", 2: "Вторник", 3: "Среда", 4: "Четверг", 5: "Пятница", 6: "Суббота", 0: "Воскресенье" };
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  function moscowNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  }

  function fmtHour(h) {
    const hh = Math.floor(h);
    const mm = h % 1 ? "30" : "00";
    return `${hh}:${mm}`;
  }

  function computeStatus(hours) {
    const now = moscowNow();
    const day = now.getDay();
    const [openH, closeH] = hours[day];
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    if (minutesNow >= openH * 60 && minutesNow < closeH * 60) {
      return { open: true, text: `Открыто · до ${fmtHour(closeH)}` };
    }
    let nextDay = day, tomorrow = false;
    if (minutesNow >= closeH * 60) { nextDay = (day + 1) % 7; tomorrow = true; }
    const [nOpen] = hours[nextDay];
    return { open: false, text: `Закрыто · откроется в ${fmtHour(nOpen)}${tomorrow ? " завтра" : ""}` };
  }

  function tailRule(onInk, widths) {
    const w = widths || [26, 8, 18, 6, 14];
    return `<div class="tail-rule${onInk ? " tail-rule--on-ink" : ""}">${w.map(x => `<span style="width:${x}px"></span>`).join("")}</div>`;
  }

  function routeUrl(kind) {
    const b = S.business;
    if (kind === "route2gis") return `https://2gis.ru/search/${encodeURIComponent(b.mapQuery)}`;
    if (b.lat && b.lng) return `https://yandex.ru/maps/?ll=${b.lng}%2C${b.lat}&z=17&pt=${b.lng}%2C${b.lat}`;
    return `https://yandex.ru/maps/?text=${encodeURIComponent(b.mapQuery)}`;
  }

  function resolveAction(action) {
    if (action === "route") return { href: routeUrl("route"), external: true };
    if (action === "route2gis") return { href: routeUrl("route2gis"), external: true };
    return { href: action, external: false };
  }

  const ICONS = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-1 1.8-2 1.7C10 18.7 5.3 14 4.8 6c-.1-1 .7-2 1.7-2.5Z"/></svg>`,
    bowl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11h17a7.5 6 0 0 1-17 0Z"/><path d="M8 11c0-2.5 1.8-5 4-5s4 2.5 4 5"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h9M18 6h1M5 18h1M8 18h11M5 12h4M13 12h6"/><circle cx="16" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></svg>`,
    photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.4"/><path d="M20 15.5l-5-5-8 8"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L12 16.8 6.9 19.2l1.2-5.6L4 9.8l5.6-.6L12 4Z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>`
  };

  /* ---------- header ---------- */
  function renderHeader() {
    const status = computeStatus(S.hours);
    document.getElementById("site-header").innerHTML = `
      <div class="header-inner">
        <a class="brand" href="#main">
          <img src="${S.business.logo}" alt="${S.business.name}">
          <span class="brand-word">${S.business.name}</span>
        </a>
        <ul class="nav-links">
          <li><a href="#constructor">${ICONS.sliders}Собери сам</a></li>
          <li><a href="#menu">${ICONS.bowl}Меню</a></li>
          <li><a href="#gallery">${ICONS.photo}Внутри</a></li>
          <li><a href="#reviews">${ICONS.star}Отзывы</a></li>
          <li><a href="#location">${ICONS.pin}Адреса</a></li>
        </ul>
        <span class="status-pill js-status ${status.open ? "is-open" : ""}"><span class="status-dot"></span>${status.text}</span>
      </div>`;
  }

  /* ---------- hero ---------- */
  /* асимметричная вёрстка: фото на всю высоту у правого края (bleed),
     заголовок наплывает на фото слева — не центр+круг, как в кофейном
     шаблоне, а более редакционная, плакатная композиция. */
  function renderHero() {
    if (!S.sections.hero) return;
    const h = S.hero;
    const primary = resolveAction(h.ctaPrimary.action);
    const b = S.business;
    const heroEl = document.getElementById("hero");
    heroEl.classList.add("glow-field", "glow-field--warm");
    heroEl.innerHTML = `
      <div class="hero-media">
        <img src="${h.image}" alt="${h.imageAlt || ""}">
        ${h.imageCaption ? `<span class="hero-media-caption">${h.imageCaption}</span>` : ""}
      </div>
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow eyebrow--on-ink">${h.eyebrow}</span>
          ${tailRule(true)}
          <h1 class="hero-headline">${h.headline}</h1>
          <p class="hero-sub">${h.sub}</p>
          <div class="badge-award hero-badge">
            <span class="badge-award-star">★ ${b.rating}</span>
            <span class="badge-award-sep">·</span>
            <span>${b.ratingCount} оценок</span>
            <span class="badge-award-sep">·</span>
            <span class="badge-award-name">${b.award}</span>
          </div>
          <div class="hero-ctas">
            <a class="btn btn-primary" href="${primary.href}" ${primary.external ? 'target="_blank" rel="noopener"' : ""}>${h.ctaPrimary.label}</a>
            <a class="btn btn-ghost" href="${h.ctaSecondary.action}">${h.ctaSecondary.label}</a>
          </div>
        </div>
      </div>`;
  }

  /* ---------- бегущая строка ингредиентов ---------- */
  function renderMarquee() {
    if (!S.sections.marquee || !S.marquee || !S.marquee.length) return;
    const el = document.getElementById("marquee");
    const line = S.marquee.join(" &nbsp;·&nbsp; ") + " &nbsp;·&nbsp; ";
    el.innerHTML = `
      <div class="marquee-track" aria-hidden="true">
        <span>${line}</span><span>${line}</span>
      </div>`;
  }

  /* ---------- amenities ---------- */
  function renderAmenities() {
    if (!S.sections.amenities) return;
    document.getElementById("amenities").innerHTML = `
      <div class="container reveal">
        <span class="eyebrow">Что есть на месте</span>
        ${tailRule(false)}
        <div class="amenities-row">
          ${S.amenities.map(a => `<span class="amenity-chip">${ICONS.check}${a}</span>`).join("")}
        </div>
      </div>`;
  }

  /* ---------- конструктор поке ---------- */
  const TOPPING_PALETTE = ["#7BB661", "#E8B33D", "#C7482A", "#8FBF8C", "#D9944B", "#B5473A", "#E7C08A", "#D68C4A", "#EDE0B0", "#E4849C", "#C9C9C9", "#F0A5A0"];
  const PROTEIN_COLOR = { "Курица": "#E8C99A", "Лосось": "#FF8A65", "Тунец": "#B84A3E", "Креветки": "#F0A99A" };
  const BASE_COLOR = { "Рис": "#F2ECD8", "Киноа": "#D8C9A3" };
  const SAUCE_COLOR = { "Ореховый": "#B98A4E", "Сладкий чили": "#D94F3D", "Пикантный кимчи": "#C23B2E", "Медово-горчичный": "#E0A93A", "Азиатский": "#6B7A3A", "Крабовый": "#E4849C" };

  function renderConstructor() {
    if (!S.sections.constructor) return;
    const c = S.constructor;
    const el = document.getElementById("constructor");
    el.classList.add("glow-field", "glow-field--warm");
    el.innerHTML = `
      <div class="container">
        <div class="constructor-head reveal">
          <span class="eyebrow eyebrow--on-ink">${c.title}</span>
          ${tailRule(true)}
          <h2>Потыкайте — соберите поке прямо тут</h2>
          <p>${c.subtitle}</p>
        </div>
        <div class="constructor-layout">
          <div class="constructor-steps reveal">
            <div>
              <span class="constructor-step-label">${c.base.label}</span>
              <div class="chip-row js-c-base">
                ${c.base.options.map((o, i) => `<button type="button" class="opt-chip${i === 0 ? " is-active" : ""}" data-value="${o.name}">${o.name}</button>`).join("")}
              </div>
            </div>
            <div>
              <span class="constructor-step-label">${c.protein.label}</span>
              <div class="chip-row js-c-protein">
                ${c.protein.options.map((o, i) => `<button type="button" class="opt-chip${i === 0 ? " is-active" : ""}" data-value="${o.name}" data-price="${o.price}">${o.name}<span class="opt-chip-price">+${o.price}₽</span></button>`).join("")}
              </div>
            </div>
            <div>
              <span class="constructor-step-label">${c.toppings.label} <span class="constructor-step-note">${c.toppings.note}</span></span>
              <div class="chip-row js-c-toppings">
                ${c.toppings.options.map((name, i) => `<button type="button" class="opt-chip${i < 3 ? " is-active" : ""}" data-value="${name}">${name}</button>`).join("")}
              </div>
            </div>
            <div>
              <span class="constructor-step-label">${c.sauce.label}</span>
              <div class="chip-row js-c-sauce">
                ${c.sauce.options.map((name, i) => `<button type="button" class="opt-chip${i === 0 ? " is-active" : ""}" data-value="${name}">${name}</button>`).join("")}
              </div>
            </div>
          </div>
          <div class="constructor-preview reveal" style="transition-delay:120ms">
            <div class="bowl-preview">
              <div class="bowl-preview-fill js-bowl-fill"></div>
              <div class="bowl-preview-sauce js-bowl-sauce"></div>
              <div class="bowl-preview-rim"></div>
            </div>
            <div class="constructor-price">
              <div class="constructor-price-amount js-c-total">${c.basePrice} ₽</div>
              <div class="constructor-price-note">основа ${c.basePrice} ₽ + добавки</div>
            </div>
            <p class="constructor-summary js-c-summary"></p>
          </div>
        </div>
      </div>`;
  }

  function initConstructor() {
    const c = S.constructor;
    const root = document.getElementById("constructor");
    if (!c || !root || !S.sections.constructor) return;

    const state = {
      base: c.base.options[0].name,
      protein: c.protein.options[0],
      toppings: new Set(c.toppings.options.slice(0, 3)),
      sauce: c.sauce.options[0]
    };

    function pickSingle(groupSel, value, onPick) {
      root.querySelectorAll(`${groupSel} .opt-chip`).forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.value === value);
      });
      onPick(value);
    }

    root.querySelector(".js-c-base").addEventListener("click", e => {
      const btn = e.target.closest(".opt-chip"); if (!btn) return;
      pickSingle(".js-c-base", btn.dataset.value, v => state.base = v);
      update();
    });
    root.querySelector(".js-c-protein").addEventListener("click", e => {
      const btn = e.target.closest(".opt-chip"); if (!btn) return;
      pickSingle(".js-c-protein", btn.dataset.value, v => state.protein = { name: v, price: Number(btn.dataset.price) });
      update();
    });
    root.querySelector(".js-c-sauce").addEventListener("click", e => {
      const btn = e.target.closest(".opt-chip"); if (!btn) return;
      pickSingle(".js-c-sauce", btn.dataset.value, v => state.sauce = v);
      update();
    });
    root.querySelector(".js-c-toppings").addEventListener("click", e => {
      const btn = e.target.closest(".opt-chip"); if (!btn) return;
      const v = btn.dataset.value;
      if (state.toppings.has(v)) { state.toppings.delete(v); btn.classList.remove("is-active"); }
      else { state.toppings.add(v); btn.classList.add("is-active"); }
      update();
    });

    function update() {
      const total = c.basePrice + state.protein.price;
      root.querySelector(".js-c-total").textContent = `${total} ₽`;
      root.querySelector(".constructor-price-note").textContent = `основа ${c.basePrice} ₽ + протеин «${state.protein.name}» ${state.protein.price} ₽`;
      const toppingsList = Array.from(state.toppings);
      root.querySelector(".js-c-summary").innerHTML =
        `<b>${state.base}</b>, <b>${state.protein.name}</b>, ${toppingsList.join(", ") || "без топпингов"}, соус «${state.sauce}»`;

      /* живой боул: конус-градиент из выбранных ингредиентов */
      const baseColor = BASE_COLOR[state.base] || "#F2ECD8";
      const proteinColor = PROTEIN_COLOR[state.protein.name] || "#E8A87C";
      const stops = [];
      let pos = 0;
      const baseSize = 44, proteinSize = 20;
      stops.push(`${baseColor} ${pos}% ${pos + baseSize}%`); pos += baseSize;
      stops.push(`${proteinColor} ${pos}% ${pos + proteinSize}%`); pos += proteinSize;
      const remaining = 100 - pos;
      const each = toppingsList.length ? remaining / toppingsList.length : 0;
      toppingsList.forEach((t, i) => {
        const color = TOPPING_PALETTE[c.toppings.options.indexOf(t) % TOPPING_PALETTE.length];
        stops.push(`${color} ${pos}% ${pos + each}%`); pos += each;
      });
      if (pos < 100) stops.push(`${baseColor} ${pos}% 100%`);
      root.querySelector(".js-bowl-fill").style.background = `conic-gradient(${stops.join(",")})`;
      const sauceColor = SAUCE_COLOR[state.sauce] || "#B98A4E";
      root.querySelector(".js-bowl-sauce").style.background = `radial-gradient(circle at 50% 45%, ${sauceColor} 0%, transparent 55%)`;
    }

    update();
  }

  /* ---------- reviews ---------- */
  function renderReviews() {
    if (!S.sections.reviews) return;
    const r = S.reviews;
    const el = document.getElementById("reviews");
    el.classList.add("glow-field", "glow-field--cool");
    el.innerHTML = `
      <div class="container">
        <div class="reviews-head reveal">
          <div>
            <span class="eyebrow eyebrow--on-ink">Отзывы</span>
            ${tailRule(true)}
            <h2>${S.business.rating} из 5 · ${S.business.reviewCount} отзывов</h2>
          </div>
          <span class="badge-award"><span class="badge-award-star">★ ${S.business.award}</span><span class="badge-award-sep">·</span><span>${S.business.awardSource}</span></span>
        </div>
        <div class="reviews-layout">
          <div class="review-bars reveal">
            ${r.breakdown.map(b => `
              <div class="review-bar-row">
                <span>${b.label}</span>
                <span class="review-bar-track"><span class="review-bar-fill js-bar" style="--pct:${b.percent}%" data-pct="${b.percent}"></span></span>
                <span>${b.percent}%</span>
              </div>`).join("")}
          </div>
          <div class="reviews-grid">
            ${r.items.map((rv, i) => `
              <div class="review-card spotlight reveal" style="transition-delay:${(i % 4) * 70}ms">
                <div class="review-top"><span class="review-name">${rv.name}</span><span class="review-date">${rv.date}</span></div>
                <p class="review-text">${rv.text}</p>
              </div>`).join("")}
          </div>
        </div>
      </div>`;
  }

  /* ---------- menu ---------- */
  function renderMenu() {
    if (!S.sections.menu) return;
    document.getElementById("menu").innerHTML = `
      <div class="container">
        <div class="menu-head reveal">
          <span class="eyebrow eyebrow--on-ink">Меню</span>
          ${tailRule(true)}
          <h2>Готовое поке и напитки</h2>
          <p>Цены и вес — из меню доставки Яндекс.Еда. В зале возможна другая цена и своя сборка — см. конструктор выше.</p>
        </div>
        ${S.menu.map(cat => `
          <div class="menu-category">
            <span class="menu-category-title">${cat.category}</span>
            <div class="menu-grid">
              ${cat.items.map((item, i) => `
                <button class="menu-item spotlight reveal js-lightbox-trigger" style="transition-delay:${(i % 4) * 70}ms" data-image="${item.image}" data-caption="${item.name} · ${item.price} ₽ · ${item.weight} — ${item.desc}">
                  <span class="menu-item-photo">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                    <span class="menu-item-price-tag">${item.price} ₽</span>
                    <span class="menu-item-weight-tag">${item.weight}</span>
                  </span>
                  <span class="menu-item-body">
                    <span class="menu-item-name">${item.name}</span>
                    <span class="menu-item-desc">${item.desc}</span>
                  </span>
                </button>`).join("")}
            </div>
          </div>`).join("")}
      </div>`;
  }

  /* ---------- gallery ---------- */
  function renderGallery() {
    if (!S.sections.gallery) return;
    document.getElementById("gallery").innerHTML = `
      <div class="container">
        <div class="reveal">
          <span class="eyebrow">Внутри</span>
          ${tailRule(false)}
          <h2>Как у нас на самом деле</h2>
        </div>
        <div class="gallery-grid">
          ${S.gallery.map((g, i) => `
            <button class="gallery-item reveal js-lightbox-trigger" style="transition-delay:${(i % 4) * 60}ms" data-image="${g.image}" data-caption="${g.caption}">
              <img src="${g.image}" alt="${g.caption}" loading="lazy">
              <figcaption>${g.caption}</figcaption>
            </button>`).join("")}
        </div>
      </div>`;
  }

  /* ---------- лайтбокс: общий для меню и галереи ---------- */
  function initLightbox() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="lightbox js-lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фото">
        <button class="lightbox-close js-lightbox-close" aria-label="Закрыть">${ICONS.close}</button>
        <div>
          <img class="js-lightbox-img" src="" alt="">
          <p class="lightbox-caption js-lightbox-caption"></p>
        </div>
      </div>`);

    const lightbox = document.querySelector(".js-lightbox");
    const lbImg = document.querySelector(".js-lightbox-img");
    const lbCaption = document.querySelector(".js-lightbox-caption");
    let lastFocused = null;

    function openLightbox(src, caption, trigger) {
      lbImg.src = src; lbImg.alt = caption; lbCaption.textContent = caption;
      lightbox.classList.add("is-open");
      lastFocused = trigger;
      document.querySelector(".js-lightbox-close").focus();
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }
    document.addEventListener("click", e => {
      const trigger = e.target.closest(".js-lightbox-trigger");
      if (trigger) { openLightbox(trigger.dataset.image, trigger.dataset.caption, trigger); return; }
    });
    document.querySelector(".js-lightbox-close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox(); });
  }

  /* ---------- location ---------- */
  function renderLocation() {
    if (!S.sections.location) return;
    const status = computeStatus(S.hours);
    const b = S.business;
    const mapSrc = (b.lat && b.lng)
      ? `https://yandex.ru/map-widget/v1/?ll=${b.lng}%2C${b.lat}&z=16&pt=${b.lng}%2C${b.lat},pm2rdm`
      : `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(b.mapQuery)}&z=16`;
    document.getElementById("location").innerHTML = `
      <div class="container">
        <span class="eyebrow">${S.location.title}</span>
        ${tailRule(false)}
        <div class="location-grid">
          <div class="location-card reveal">
            <p class="location-address">${S.business.address}</p>
            ${S.business.addressNote ? `<p class="eyebrow" style="margin-bottom:10px">${S.business.addressNote}</p>` : ""}
            <p class="location-text">${S.location.text}</p>
            <span class="status-pill status-pill--on-paper js-status-2 ${status.open ? "is-open" : ""}" style="margin-bottom:20px"><span class="status-dot"></span>${status.text}</span>
            <table class="hours-table">
              ${DAY_ORDER.map(d => `
                <tr class="js-day" data-day="${d}">
                  <td>${DAY_NAMES[d]}</td>
                  <td>${fmtHour(S.hours[d][0])}–${fmtHour(S.hours[d][1])}</td>
                </tr>`).join("")}
            </table>
            <div class="location-ctas">
              ${S.business.phoneHref ? `<a class="btn btn-primary" href="${S.business.phoneHref}">${ICONS.phone}${S.business.phone}</a>` : ""}
              ${S.location.routeLinks.map(l => {
                const r = resolveAction(l.action);
                return `<a class="btn btn-ghost btn-ghost--on-paper" href="${r.href}" target="_blank" rel="noopener">${l.label}</a>`;
              }).join("")}
            </div>
          </div>
          <div class="location-map reveal" style="transition-delay:120ms">
            <a class="location-map-fallback" href="${routeUrl("route")}" target="_blank" rel="noopener">Карта не загрузилась — открыть на Яндекс Картах →</a>
            <iframe src="${mapSrc}" title="Карта: ${S.business.address}" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>`;
    const today = moscowNow().getDay();
    document.querySelectorAll(".js-day").forEach(row => {
      if (Number(row.dataset.day) === today) row.classList.add("is-today");
    });
  }

  /* ---------- footer ---------- */
  function renderFooter() {
    document.getElementById("site-footer").innerHTML = `
      <div class="footer-inner reveal">
        <a class="footer-brand" href="#main">
          <img src="${S.business.logo}" alt="${S.business.name}">
          <span>${S.business.name}</span>
        </a>
        <div class="footer-social">
          ${S.business.instagram ? `<a href="${S.business.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.instagram}</a>` : ""}
        </div>
        <p class="footer-credit">${S.footer.credit}</p>
      </div>`;
  }

  /* ---------- meta ---------- */
  function renderMeta() {
    document.title = S.meta.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.name = "description"; document.head.appendChild(desc); }
    desc.content = S.meta.description;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
    icon.href = S.meta.favicon;
  }

  function tickStatus() {
    const status = computeStatus(S.hours);
    document.querySelectorAll(".js-status, .js-status-2").forEach(el => {
      el.classList.toggle("is-open", status.open);
      el.innerHTML = `<span class="status-dot"></span>${status.text}`;
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    let items = Array.from(document.querySelectorAll(".reveal"));
    if (!items.length) return;
    function sweep() {
      const vh = window.innerHeight;
      items = items.filter(el => {
        if (el.getBoundingClientRect().top >= vh * 0.92) return true;
        el.classList.add("is-visible");
        return false;
      });
      if (!items.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", sweep);
      }
    }
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { sweep(); ticking = false; });
    }
    sweep();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sweep);
  }

  function initReviewBars() {
    const bars = document.querySelectorAll(".js-bar");
    if (!bars.length) return;
    if (!("IntersectionObserver" in window)) { bars.forEach(el => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    bars.forEach(el => io.observe(el));
  }

  function initSpotlight() {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.querySelectorAll(".spotlight").forEach(card => {
      card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
      });
    });
  }

  function initTilt() {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.querySelectorAll(".btn-primary").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform = `perspective(300px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-2px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- init ---------- */
  renderMeta();
  renderHeader();
  renderHero();
  renderMarquee();
  renderAmenities();
  renderConstructor();
  renderMenu();
  renderGallery();
  renderReviews();
  renderLocation();
  renderFooter();
  initConstructor();
  initLightbox();
  initReveal();
  initReviewBars();
  initSpotlight();
  initTilt();
  setInterval(tickStatus, 60000);
})();
