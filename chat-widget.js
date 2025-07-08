// chat-widget.js

document.addEventListener('DOMContentLoaded', () => {
  // 元素
  const CHAT_BTN    = document.getElementById('chat-widget-button');
  const CHAT_WIN    = document.getElementById('chat-widget-container');
  const CHAT_CLOSE  = document.getElementById('chat-widget-close');
  const CHAT_BODY   = document.getElementById('chat-widget-body');
  const CHAT_INPUT  = document.getElementById('chat-widget-input');
  const CHAT_SEND   = document.getElementById('chat-widget-send');

  // Storage Key
  const STORAGE_KEY = 'demo_store_chat_history';

  // 讀歷史
  function loadHistory() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    try { return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }

  // 存歷史
  function saveHistory(h) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  }

  // 渲染
  function renderHistory() {
    CHAT_BODY.innerHTML = '';
    const history = loadHistory();
    history.forEach(msg => {
      const div = document.createElement('div');
      div.classList.add('chat-message', msg.role === 'user' ? 'user-message' : 'bot-message');
      if (msg.role === 'user') {
        div.innerHTML = `<span>${msg.content}</span>`;
      } else {
        div.innerHTML = `<div>${marked.parseInline(msg.content)}</div>`;
      }
      CHAT_BODY.appendChild(div);
    });
    CHAT_BODY.scrollTop = CHAT_BODY.scrollHeight;
  }

  // 新增並渲染
  function appendMessage(role, content) {
    const h = loadHistory();
    h.push({ role, content });
    saveHistory(h);
    renderHistory();
  }

  // 開啟
  function openChat() {
    renderHistory();
    CHAT_WIN.style.display = 'flex';
    CHAT_BTN.style.display = 'none';
    CHAT_INPUT.focus();
  }

  // 關閉
  function closeChat() {
    CHAT_WIN.style.display = 'none';
    CHAT_BTN.style.display = 'flex';
  }

  // 送訊息
  async function sendMessage() {
    const text = CHAT_INPUT.value.trim();
    if (!text) return;
    CHAT_INPUT.value = '';
    appendMessage('user', text);

    // loading
    const loadDiv = document.createElement('div');
    loadDiv.id = '__loading';
    loadDiv.className = 'bot-message chat-message';
    loadDiv.innerHTML = `<div>Thinking...</div>`;
    CHAT_BODY.appendChild(loadDiv);
    CHAT_BODY.scrollTop = CHAT_BODY.scrollHeight;

    try {
      const res = await fetch(
        'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cors-api-key': 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
          },
          body: JSON.stringify({
            chatId: sessionStorage.getItem(STORAGE_KEY) || new Date().toISOString(),
            sessionId: sessionStorage.getItem(STORAGE_KEY) || new Date().toISOString(),
            message: text,
            route: 'general'
          })
        }
      );
      const data = await res.json();
      document.getElementById('__loading')?.remove();
      const reply = data.output || data.response || data.text || '抱歉，出錯了。';
      appendMessage('bot', reply);
    } catch {
      document.getElementById('__loading')?.remove();
      appendMessage('bot', '連線失敗，請稍後再試。');
    }
  }

  // 綁事件
  CHAT_BTN.addEventListener('click', openChat);
  CHAT_CLOSE.addEventListener('click', closeChat);
  CHAT_SEND.addEventListener('click', sendMessage);
  CHAT_INPUT.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });

  // 初始狀態
  closeChat();
});
