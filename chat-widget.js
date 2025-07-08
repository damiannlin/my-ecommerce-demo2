// chat-widget.js
// 確保整個 DOM 就緒後再執行
document.addEventListener('DOMContentLoaded', () => {
  // 參考各元素
  const chatBtn = document.getElementById('chat-widget-button');
  const chatContainer = document.getElementById('chat-widget-container');
  const closeBtn   = chatContainer.querySelector('#chat-widget-header button');
  const sendBtn    = document.getElementById('chat-widget-send');
  const inputEl    = document.getElementById('chat-widget-input');
  const bodyEl     = document.getElementById('chat-widget-body');

  // 打開 / 關閉
  chatBtn.addEventListener('click', () => {
    chatContainer.style.display = 'flex';
    chatBtn.style.display       = 'none';
    inputEl.focus();
  });
  closeBtn.addEventListener('click', () => {
    chatContainer.style.display = 'none';
    chatBtn.style.display       = 'flex';
  });

  // 生成或讀取 chatId
  function getChatId() {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2,11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  }

  // 發送訊息
  async function sendMessage() {
    const msg = inputEl.value.trim();
    if (!msg) return;

    // 顯示使用者訊息
    const um = document.createElement('div');
    um.className = 'user-message chat-message';
    um.innerHTML = `<span>${msg}</span>`;
    bodyEl.appendChild(um);

    // 顯示 loading
    const lm = document.createElement('div');
    lm.id = '__loading';
    lm.className = 'bot-message chat-message';
    lm.innerHTML = `<div>Thinking…</div>`;
    bodyEl.appendChild(lm);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    try {
      const res = await fetch('https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'x-cors-api-key':'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
        },
        body: JSON.stringify({
          chatId: getChatId(),
          sessionId: getChatId(),
          message: msg,
          route: 'general'
        })
      });
      const data = await res.json();

      // 移除 loading
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();

      // 顯示機器人回覆
      const reply = data.output || data.response || data.text || 'Sorry, something went wrong.';
      const bm = document.createElement('div');
      bm.className = 'bot-message chat-message';
      bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
      bodyEl.appendChild(bm);
      bodyEl.scrollTop = bodyEl.scrollHeight;

    } catch (err) {
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();

      const errEl = document.createElement('div');
      errEl.className = 'bot-message chat-message';
      errEl.innerHTML = `<div>Connection failed. Please try again later.</div>`;
      bodyEl.appendChild(errEl);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    inputEl.value = '';
  }

  // 綁定送出
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });

  /* --------- Fake Store 取產品 --------- */
  async function loadProducts() {
    try {
      const resp = await fetch('https://fakestoreapi.com/products?limit=8');
      const products = await resp.json();
      const container = document.getElementById('products-container');
      container.innerHTML = '<div class="products-grid">' +
        products.map(p => `
          <div class="product-card">
            <img src="${p.image}" alt="${p.title}" class="product-image"/>
            <div class="product-info">
              <h3 class="product-title">${p.title}</h3>
              <div class="product-price">$${p.price.toFixed(2)}</div>
              <div class="product-rating">
                ${'⭐'.repeat(Math.round(p.rating.rate))} ${p.rating.rate}/5 (${p.rating.count})
              </div>
              <button class="btn-primary" onclick="window.location='product.html?id=${p.id}'">
                View Details
              </button>
            </div>
          </div>
        `).join('') +
      '</div>';
    } catch (e) {
      document.getElementById('products-container').innerHTML =
        '<p style="text-align:center;color:#666;">Error loading products.</p>';
    }
  }
  loadProducts();
});
