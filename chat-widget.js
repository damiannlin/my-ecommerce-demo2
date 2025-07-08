// chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
  // -- 幫助函式：從 sessionStorage 載入已存訊息 --
  function loadStoredMessages() {
    try {
      const json = sessionStorage.getItem('chatMessages');
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }

  // -- 幫助函式：將訊息列表存回 sessionStorage --
  function saveStoredMessages(messages) {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
  }

  // -- 建立聊天按鈕 --
  const chatBtn = document.createElement('button');
  chatBtn.id = 'chat-widget-button';
  chatBtn.textContent = '💬';
  document.body.appendChild(chatBtn);

  // -- 建立聊天容器 --
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-widget-container';
  chatContainer.style.display = 'none';
  chatContainer.innerHTML = `
    <div id="chat-widget-header">
      <span>🤖 AI Shopping Assistant</span>
      <button id="chat-widget-close">✖</button>
    </div>
    <div id="chat-widget-body"></div>
    <div id="chat-widget-footer">
      <input type="text" id="chat-widget-input" placeholder="Type your message here..." />
      <button id="chat-widget-send">Send</button>
    </div>
  `;
  document.body.appendChild(chatContainer);

  // -- 載入標記工具 --
  const markedScript = document.createElement('script');
  markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  document.body.appendChild(markedScript);

  // -- 重新播放已存訊息到畫面上 --
  const bodyEl = chatContainer.querySelector('#chat-widget-body');
  let stored = loadStoredMessages();
  stored.forEach(msg => {
    const div = document.createElement('div');
    div.className = msg.from === 'user' ? 'user-message chat-message' : 'bot-message chat-message';
    if (msg.from === 'bot') {
      div.innerHTML = `<div>${marked.parse(msg.text)}</div>`;
    } else {
      div.innerHTML = `<span>${msg.text}</span>`;
    }
    bodyEl.appendChild(div);
  });
  bodyEl.scrollTop = bodyEl.scrollHeight;

  // -- 綁定開關按鈕事件 --
  chatBtn.addEventListener('click', () => {
    chatContainer.style.display = 'flex';
    chatBtn.style.display = 'none';
    document.getElementById('chat-widget-input').focus();
  });
  chatContainer.querySelector('#chat-widget-close').addEventListener('click', () => {
    chatContainer.style.display = 'none';
    chatBtn.style.display = 'flex';
  });

  // -- 生成唯一 chatId (同一分頁跨頁不變) --
  function getChatId() {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  }

  // -- 傳送訊息主流程 --
  async function sendMessage() {
    const inputEl = document.getElementById('chat-widget-input');
    const msg = inputEl.value.trim();
    if (!msg) return;

    // 1. 清空並顯示使用者訊息
    const um = document.createElement('div');
    um.className = 'user-message chat-message';
    um.innerHTML = `<span>${msg}</span>`;
    bodyEl.appendChild(um);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    // 2. 存到 sessionStorage
    stored.push({ from: 'user', text: msg });
    saveStoredMessages(stored);

    // 3. 顯示思考中
    const lm = document.createElement('div');
    lm.id = '__loading';
    lm.className = 'bot-message chat-message';
    lm.innerHTML = `<div>Thinking...</div>`;
    bodyEl.appendChild(lm);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    inputEl.value = '';

    try {
      const res = await fetch(window.ChatWidgetConfig.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cors-api-key': window.ChatWidgetConfig.webhook.corsKey
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

      // 4. 顯示機器人回覆
      const reply = data.output || data.response || data.text || '抱歉，出錯了。';
      const bm = document.createElement('div');
      bm.className = 'bot-message chat-message';
      bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
      bodyEl.appendChild(bm);
      bodyEl.scrollTop = bodyEl.scrollHeight;

      // 存回 sessionStorage
      stored.push({ from: 'bot', text: reply });
      saveStoredMessages(stored);
    } catch (e) {
      // 移除 loading
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();

      // 顯示錯誤訊息
      const err = document.createElement('div');
      err.className = 'bot-message chat-message';
      err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
      bodyEl.appendChild(err);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }

  // -- 綁定送出事件 --
  chatContainer.querySelector('#chat-widget-send').addEventListener('click', sendMessage);
  chatContainer.querySelector('#chat-widget-input')
    .addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

  // -- 暴露給 About 等頁面的設定參數 --
  window.ChatWidgetConfig = {
    webhook: {
      url: 'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
      route: 'general',
      corsKey: 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
    }
  };
});
