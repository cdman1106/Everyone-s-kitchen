(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); btn.textContent = '☰'; btn.setAttribute('aria-expanded','false');
    }));
  }
  document.querySelectorAll('[data-sample]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault(); alert('サンプルサイトです。正式な電話番号・URLに差し替えてください。');
  }));

  const $ = (id) => document.getElementById(id);
  const safe = (value) => typeof value === 'string' ? value : '';

  function makeSpecialCard(item) {
    const article = document.createElement('article');
    article.className = 'special-card' + (item.soldOut ? ' soldout' : '');
    if (safe(item.image).startsWith('data:image/')) {
      const wrap = document.createElement('div');
      wrap.className = 'special-image';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = safe(item.name) || '本日のおすすめ';
      wrap.appendChild(img);
      article.appendChild(wrap);
    }
    const body = document.createElement('div');
    body.className = 'special-body';
    const tag = document.createElement('span');
    tag.className = 'today-tag';
    tag.textContent = 'おすすめ';
    body.appendChild(tag);
    const h3 = document.createElement('h3');
    h3.textContent = safe(item.name) || '本日のおすすめ';
    body.appendChild(h3);
    if (item.price) {
      const price = document.createElement('div');
      price.className = 'today-price';
      price.textContent = safe(item.price);
      body.appendChild(price);
    }
    if (item.description) {
      const p = document.createElement('p');
      p.textContent = safe(item.description);
      body.appendChild(p);
    }
    article.appendChild(body);
    return article;
  }

  function renderOwnerContent(data) {
    if (!data || typeof data !== 'object') return;
    const notice = data.notice || {};
    const noticeEl = $('todayNotice');
    if (noticeEl && notice.enabled && safe(notice.text).trim()) {
      $('todayNoticeText').textContent = notice.text;
      noticeEl.hidden = false;
    }

    const daily = data.dailyLunch || {};
    const specials = Array.isArray(data.specials) ? data.specials.filter(x => x && x.enabled) : [];
    const today = $('todaySection');
    if (!today) return;
    today.hidden = false;
    const hasDaily = !!daily.enabled;
    const hasAny = hasDaily || specials.length > 0;
    const empty = $('todayEmpty');
    if (empty) empty.hidden = hasAny;

    if (data.updatedAt && $('todayUpdated')) {
      try {
        const d = new Date(data.updatedAt);
        $('todayUpdated').textContent = `最終更新 ${d.toLocaleString('ja-JP', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}`;
      } catch (_) {}
    }

    if ($('dailyLunchCard')) $('dailyLunchCard').hidden = true;
    if (daily.enabled && $('dailyLunchCard')) {
      const card = $('dailyLunchCard');
      card.hidden = false;
      card.classList.toggle('soldout', !!daily.soldOut);
      $('dailyLunchName').textContent = safe(daily.name) || '本日の日替わり';
      $('dailyLunchPrice').textContent = safe(daily.price);
      $('dailyLunchPrice').hidden = !safe(daily.price).trim();
      $('dailyLunchDescription').textContent = safe(daily.description);
      $('dailyLunchDescription').hidden = !safe(daily.description).trim();
      $('dailyLunchSoldout').hidden = !daily.soldOut;
      if (safe(daily.image).startsWith('data:image/')) {
        $('dailyLunchImage').src = daily.image;
        $('dailyLunchImageWrap').hidden = false;
      }
    }

    const grid = $('todaySpecialGrid');
    if (grid) {
      grid.textContent = '';
      specials.forEach(item => grid.appendChild(makeSpecialCard(item)));
      grid.hidden = specials.length === 0;
    }
  }

  if ($('todaySection') || $('todayNotice')) {
    fetch('/api/content?t=' + Date.now(), {cache:'no-store', headers:{'cache-control':'no-cache'}})
      .then(r => r.ok ? r.json() : Promise.reject(new Error('content api unavailable')))
      .then(renderOwnerContent)
      .catch(() => { /* API未設定時は通常サイトとして表示 */ });
  }
})();
