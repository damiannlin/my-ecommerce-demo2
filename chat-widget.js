// ─── chat-widget.js ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 幫助函式：取出或初始化對話歷程
  const getHistory = () => {
    const raw = sessionStorage.getItem('chatHistory');
    return raw ? JSON.parse(raw) : [];
  };
  const saveHistory = (hist) => {
    sessionStorage.setItem('chatHistory', JSON.stringify(hist));
  };

  // 讀取及渲染已存對話
  const chatBody = document.createElement('div');
  chatBody.id = 'chat-widget-body';

  const renderHistory = () => {
    chatBody.innerHTML = '';
    const hist = getHistory();
    hist.forEach(msg => {
      const el = document.createElement('div');
      el.className = msg.sender === 'user'
        ? 'user-message chat-message'
        : 'bot-message chat-message';
      if (msg.sender === 'bot') {
        el.innerHTML = `<div>${marked.parse(msg.text)}</div>`;
      } else {
        el.innerHTML = `<span>${msg.text}</span>`;
      }
      chatBody.appendChild(el);
    });
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  // 建立聊天按鈕與容器
  const chatBtn = document.createElement('button');
  chatBtn.id = 'chat-widget-button';
  chatBtn.textContent = '💬';
  Object.assign(chatBtn.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    width: '60px', height: '60px', borderRadius: '50%',
    background: '#854fff', color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: '24px', zIndex: '1001', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform .2s'
  });
  chatBtn.addEventListener('mouseenter', () => chatBtn.style.transform = 'scale(1.1)');
  chatBtn.addEventListener('mouseleave', () => chatBtn.style.transform = 'scale(1)');

  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-widget-container';
  Object.assign(chatContainer.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    width: '350px', height: '500px', display: 'none',
    flexDirection: 'column', background: '#fff', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: '1000', overflow: 'hidden'
  });

  chatContainer.innerHTML = `
    <div id="chat-widget-header" style="
      background:#854fff; color:#fff; padding:12px; display:flex;
      justify-content:space-between; align-items:center;">
      <span>🤖 AI Shopping Assistant</span>
      <button id="chat-widget-close" style="
        background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">✖
      </button>
    </div>
  `;
  chatContainer.appendChild(chatBody);

  // Footer with input + send
  const footer = document.createElement('div');
  footer.id = 'chat-widget-footer';
  Object.assign(footer.style, {
    padding: '8px', borderTop: '1px solid #ddd', display: 'flex', gap: '6px', background: '#fff'
  });
  footer.innerHTML = `
    <input id="chat-widget-input" type="text" placeholder="Type your message..." style="
      flex:1; padding:8px 12px; border:1px solid #ddd; border-radius:20px; outline:none;" />
    <button id="chat-widget-send" style="
      background:#854fff; color:#fff; border:none; padding:8px 16px;
      border-radius:20px; cursor:pointer;">Send</button>
  `;
  chatContainer.appendChild(footer);

  document.body.appendChild(chatBtn);
  document.body.appendChild(chatContainer);

  // 開／關控制
  chatBtn.addEventListener('click', () => {
    renderHistory();
    chatContainer.style.display = 'flex';
    chatBtn.style.display = 'none';
    document.getElementById('chat-widget-input').focus();
  });
  document.getElementById('chat-widget-close')
    .addEventListener('click', () => {
      chatContainer.style.display = 'none';
      chatBtn.style.display = 'flex';
    });

  // 取 or 建 chatId
  const getChatId = () => {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2,11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  };

  // 送訊息
  const sendBtn = document.getElementById('chat-widget-send');
  const inputEl = document.getElementById('chat-widget-input');

  const postMessage = async (text) => {
    // 加入 user 訊息
    const hist = getHistory();
    hist.push({ sender: 'user', text });
    saveHistory(hist);
    renderHistory();

    // loading
    const loadEl = document.createElement('div');
    loadEl.id = '__loading';
    loadEl.className = 'bot-message chat-message';
    loadEl.innerHTML = `<div>Thinking...</div>`;
    chatBody.appendChild(loadEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    // call n8n webhook
    try {
      const res = await fetch(window.ChatWidgetConfig.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'x-cors-api-key': window.ChatWidgetConfig.webhook.corsKey
        },
        body: JSON.stringify({
          chatId: getChatId(),
          sessionId: getChatId(),
          message: text,
          route: window.ChatWidgetConfig.webhook.route
        })
      });
      const data = await res.json();
      const reply = data.output || data.response || data.text || '抱歉，出錯了。';
      // remove loading
      document.getElementById('__loading')?.remove();
      // push bot reply
      hist.push({ sender: 'bot', text: reply });
      saveHistory(hist);
      renderHistory();
    } catch {
      document.getElementById('__loading')?.remove();
      const err = document.createElement('div');
      err.className = 'bot-message chat-message';
      err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
      chatBody.appendChild(err);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  };

  sendBtn.addEventListener('click', () => {
    const v = inputEl.value.trim();
    if (v) { postMessage(v); inputEl.value = ''; }
  });
  inputEl.addEventListener('keypress', e => {
    if (e.key === 'Enter' && inputEl.value.trim()) {
      postMessage(inputEl.value.trim());
      inputEl.value = '';
    }
  });

  // 暴露設定給 HTML
  window.ChatWidgetConfig = {
    webhook: {
      url: 'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
      route: 'general',
      corsKey: 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
    }
  };
});
