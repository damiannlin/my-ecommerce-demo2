// chat-widget.js

// 一組全域變數，方便存取
const CHAT_BTN       = document.getElementById('chat-widget-button');
const CHAT_WIN       = document.getElementById('chat-widget-container');
const CHAT_CLOSE     = document.getElementById('chat-widget-close');
const CHAT_BODY      = document.getElementById('chat-widget-body');
const CHAT_INPUT     = document.getElementById('chat-widget-input');
const CHAT_SEND      = document.getElementById('chat-widget-send');

// SessionStorage 的 Key
const STORAGE_KEY    = 'demo_store_chat_history';

// 建立或取出歷史對話
function loadHistory() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 儲存對話到 Storage
function saveHistory(history) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 清空視窗並重渲染歷史訊息
function renderHistory() {
  CHAT_BODY.innerHTML = '';
  const history = loadHistory();
  history.forEach(({ role, content }) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-message', role === 'user' ? 'user-message' : 'bot-message');
    if (role === 'user') {
      wrapper.innerHTML = `<span>${content}</span>`;
    } else {
      // 使用 marked 解析 markdown，或直接包在 <div>
      const md = marked.parseInline(content);
      wrapper.innerHTML = `<div>${md}</div>`;
    }
    CHAT_BODY.appendChild(wrapper);
  });
  CHAT_BODY.scrollTop = CHAT_BODY.scrollHeight;
}

// 開啟聊天室
function openChat() {
  renderHistory();
  CHAT_WIN.style.display = 'flex';
  CHAT_BTN.style.display = 'none';
  CHAT_INPUT.focus();
}

// 關閉聊天室
function closeChat() {
  CHAT_WIN.style.display = 'none';
  CHAT_BTN.style.display = 'flex';
}

// 將一則訊息加入歷史並重新渲染
function appendMessage(role, content) {
  const history = loadHistory();
  history.push({ role, content });
  saveHistory(history);
  renderHistory();
}

// 送出使用者訊息，並呼叫 n8n webhook
async function sendMessage() {
  const text = CHAT_INPUT.value.trim();
  if (!text) return;
  CHAT_INPUT.value = '';
  appendMessage('user', text);

  // 顯示 loading
  const loading = document.createElement('div');
  loading.className = 'bot-message chat-message';
  loading.id = '__loading';
  loading.innerHTML = `<div>Thinking...</div>`;
  CHAT_BODY.appendChild(loading);
  CHAT_BODY.scrollTop = CHAT_BODY.scrollHeight;

  try {
    const res = await fetch('https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat', {
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
    });
    const data = await res.json();
    // 移除 loading
    document.getElementById('__loading')?.remove();

    const reply = data.output || data.response || data.text || '抱歉，出錯了。';
    appendMessage('bot', reply);
  } catch (err) {
    document.getElementById('__loading')?.remove();
    appendMessage('bot', '連線失敗，請稍後再試。');
  }
}

// 綁定事件
CHAT_BTN.addEventListener('click', openChat);
CHAT_CLOSE.addEventListener('click', closeChat);
CHAT_SEND.addEventListener('click', sendMessage);
CHAT_INPUT.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

// 一開始隱藏視窗，按鈕顯示
closeChat();
