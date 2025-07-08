// chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. 參考按鈕與容器
  const btn = document.getElementById('chat-widget-button');
  const container = document.getElementById('chat-widget-container');

  // 2. 建立 widget 裡的 HTML 結構
  container.innerHTML = `
    <div id="chat-widget-header">
      <span>🤖 AI Shopping Assistant</span>
      <button id="chat-widget-close">✖</button>
    </div>
    <div id="chat-widget-body">
      <div class="bot-message chat-message">
        <div><strong>Hi 👋 Welcome to Demo Store!</strong><br><br>How can I help you today?</div>
      </div>
    </div>
    <div id="chat-widget-footer">
      <input type="text" id="chat-widget-input" placeholder="Type your message here..." />
      <button id="chat-widget-send">Send</button>
    </div>
  `;

  // 3. 顯示/隱藏邏輯
  btn.addEventListener('click', () => {
    container.style.display = 'flex';
    btn.style.display = 'none';
    document.getElementById('chat-widget-input').focus();
  });
  document.getElementById('chat-widget-close').addEventListener('click', () => {
    container.style.display = 'none';
    btn.style.display = 'flex';
  });

  // 4. 產生唯一 chatId
  function getChatId() {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  }

  // 5. 傳送訊息並接收回覆
  async function sendMessage() {
    const inputEl = document.getElementById('chat-widget-input');
    const msg = inputEl.value.trim();
    if (!msg) return;
    const bodyEl = document.getElementById('chat-widget-body');

    // 顯示使用者訊息
    const um = document.createElement('div');
    um.className = 'user-message chat-message';
    um.innerHTML = `<span>${msg}</span>`;
    bodyEl.appendChild(um);

    // 顯示 loading
    const lm = document.createElement('div');
    lm.id = '__loading';
    lm.className = 'bot-message chat-message';
    lm.innerHTML = `<div>Thinking...</div>`;
    bodyEl.appendChild(lm);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    try {
      const res = await fetch(window.ChatWidgetConfig.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cors-api-key': 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
        },
        body: JSON.stringify({
          chatId: getChatId(),
          sessionId: getChatId(),
          message: msg,
          route: window.ChatWidgetConfig.webhook.route
        })
      });
      const data = await res.json();

      // 移除 loading
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();

      // 顯示回覆
      const reply = data.output || data.response || data.text || '抱歉，出錯了。';
      const bm = document.createElement('div');
      bm.className = 'bot-message chat-message';
      bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
      bodyEl.appendChild(bm);
      bodyEl.scrollTop = bodyEl.scrollHeight;

    } catch (e) {
      // 移除 loading 並顯示錯誤
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();
      const err = document.createElement('div');
      err.className = 'bot-message chat-message';
      err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
      bodyEl.appendChild(err);
    }

    inputEl.value = '';
  }

  // 6. 綁定送出按鈕與 Enter 鍵
  document.getElementById('chat-widget-send').addEventListener('click', sendMessage);
  document.getElementById('chat-widget-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
});
