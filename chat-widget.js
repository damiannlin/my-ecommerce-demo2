// chat-widget.js

(function(){
  // ---------- 1. 插入必要 CSS ----------
  const style = document.createElement('style');
  style.textContent = `
    #chat-widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #854fff;
      color: #fff;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      z-index: 10000;
    }
    #chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }
    #chat-widget-header {
      background: #854fff;
      color: #fff;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #chat-widget-header button {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
    }
    #chat-widget-body {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      background: #f9f9f9;
    }
    .chat-message { margin: 8px 0; }
    .user-message span {
      background: #e3f2fd;
      padding: 8px 12px;
      border-radius: 16px 16px 4px 16px;
      display: inline-block;
      max-width: 80%;
    }
    .bot-message div {
      background: #854fff;
      color: #fff;
      padding: 10px 14px;
      border-radius: 16px 16px 16px 4px;
      display: inline-block;
      max-width: 85%;
    }
    .bot-message img {
      max-width: 100%;
      max-height: 120px;
      display: block;
      margin: 12px auto 0;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    #chat-widget-footer {
      padding: 8px;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 6px;
      background: #fff;
    }
    #chat-widget-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
    }
    #chat-widget-send {
      background: #854fff;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // ---------- 2. 插入按鈕與容器到 <body> 最後 ----------
  const btn = document.createElement('button');
  btn.id = 'chat-widget-button';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const container = document.createElement('div');
  container.id = 'chat-widget-container';
  document.body.appendChild(container);

  // ---------- 3. 建立內部結構 ----------
  container.innerHTML = `
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

  // ---------- 4. 顯示 / 隱藏功能 ----------
  btn.addEventListener('click', () => {
    container.style.display = 'flex';
    btn.style.display = 'none';
    document.getElementById('chat-widget-input').focus();
    renderHistory();  // 開啟時重建歷史
  });
  document.getElementById('chat-widget-close').addEventListener('click', () => {
    container.style.display = 'none';
    btn.style.display = 'flex';
  });

  // ---------- 5. 建立唯一 chatId & 歷史紀錄storage ----------
  function getChatId() {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2,11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  }
  function saveMessage(role, content) {
    const key = getChatId() + '_history';
    const history = JSON.parse(sessionStorage.getItem(key) || '[]');
    history.push({ role, content });
    sessionStorage.setItem(key, JSON.stringify(history));
  }
  function renderHistory() {
    const key = getChatId() + '_history';
    const history = JSON.parse(sessionStorage.getItem(key) || '[]');
    const bodyEl = document.getElementById('chat-widget-body');
    bodyEl.innerHTML = '';
    history.forEach(msg => {
      const div = document.createElement('div');
      div.className = msg.role + '-message chat-message';
      if (msg.role === 'user') {
        div.innerHTML = `<span>${msg.content}</span>`;
      } else {
        div.innerHTML = `<div>${msg.content}</div>`;
      }
      bodyEl.appendChild(div);
    });
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  // ---------- 6. 寄送訊息到 n8n 並顯示回覆 ----------
  async function sendMessage() {
    const inputEl = document.getElementById('chat-widget-input');
    const msg = inputEl.value.trim();
    if (!msg) return;
    const bodyEl = document.getElementById('chat-widget-body');

    // 使用者訊息
    const um = document.createElement('div');
    um.className = 'user-message chat-message';
    um.innerHTML = `<span>${msg}</span>`;
    bodyEl.appendChild(um);
    saveMessage('user', msg);

    // loading
    const lm = document.createElement('div');
    lm.id = '__loading';
    lm.className = 'bot-message chat-message';
    lm.innerHTML = `<div>Thinking...</div>`;
    bodyEl.appendChild(lm);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    try {
      const res = await fetch(window.ChatWidgetConfig.webhook.url, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-cors-api-key':'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
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

      const reply = marked.parse(data.output||data.response||data.text||'抱歉，出錯了。');
      const bm = document.createElement('div');
      bm.className = 'bot-message chat-message';
      bm.innerHTML = `<div>${reply}</div>`;
      bodyEl.appendChild(bm);
      saveMessage('bot', reply);

      bodyEl.scrollTop = bodyEl.scrollHeight;
    } catch (e) {
      const loadingEl = document.getElementById('__loading');
      if (loadingEl) loadingEl.remove();
      const err = document.createElement('div');
      err.className = 'bot-message chat-message';
      err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
      bodyEl.appendChild(err);
      saveMessage('bot', '連線失敗，請稍後再試。');
    }
    inputEl.value = '';
  }

  document.getElementById('chat-widget-send').addEventListener('click', sendMessage);
  document.getElementById('chat-widget-input').addEventListener('keypress', e => {
    if (e.key==='Enter') sendMessage();
  });

})();
