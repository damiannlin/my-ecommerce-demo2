// chat-widget.js - 修復版
// 這個版本會自動在所有頁面插入聊天元件，並確保對話連貫

(function() {
  // 配置
  const CONFIG = {
    webhook: {
      url: 'https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
      corsProxy: 'https://proxy.cors.sh/',
      apiKey: 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
    },
    storage: {
      chatId: 'demo_store_chat_id',
      history: 'demo_store_chat_history'
    }
  };

  // 獲取或生成唯一的聊天 ID
  function getChatId() {
    let chatId = localStorage.getItem(CONFIG.storage.chatId);
    if (!chatId) {
      chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(CONFIG.storage.chatId, chatId);
    }
    return chatId;
  }

  // 讀取聊天記錄
  function loadHistory() {
    const raw = localStorage.getItem(CONFIG.storage.history);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 保存聊天記錄
  function saveHistory(history) {
    localStorage.setItem(CONFIG.storage.history, JSON.stringify(history));
  }

  // 創建聊天視窗 HTML
  function createChatWidget() {
    // 檢查是否已存在
    if (document.getElementById('chat-widget-button')) {
      return;
    }

    // 創建按鈕
    const button = document.createElement('button');
    button.id = 'chat-widget-button';
    button.innerHTML = '💬';
    button.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      width: 60px; height: 60px; border-radius: 50%;
      background: #854fff; color: white; border: none;
      font-size: 24px; cursor: pointer; z-index: 1001;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      transition: all 0.3s;
    `;

    // 創建聊天容器
    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      width: 350px; height: 500px;
      background: white; border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: none; flex-direction: column;
      z-index: 1000; overflow: hidden;
    `;

    container.innerHTML = `
      <div id="chat-widget-header" style="background: #854fff; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">🤖 AI Shopping Assistant</span>
        <button id="chat-widget-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">✖</button>
      </div>
      <div id="chat-widget-body" style="flex: 1; padding: 12px; overflow-y: auto; background: #f9f9f9;">
        <div class="bot-message chat-message">
          <div style="background: #854fff; color: white; padding: 10px 14px; border-radius: 16px 16px 16px 4px; display: inline-block; max-width: 85%;">
            <strong>Hi 👋 Welcome to Demo Store!</strong><br><br>
            I'm your AI shopping assistant. How can I help you today?
          </div>
        </div>
      </div>
      <div id="chat-widget-footer" style="padding: 8px; border-top: 1px solid #ddd; display: flex; gap: 6px; background: white;">
        <input id="chat-widget-input" placeholder="Type your message..." style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none;" />
        <button id="chat-widget-send" style="background: #854fff; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Send</button>
      </div>
    `;

    // 加入樣式
    const style = document.createElement('style');
    style.textContent = `
      #chat-widget-button:hover { transform: scale(1.1); box-shadow: 0 6px 15px rgba(0,0,0,0.4); }
      #chat-widget-send:hover { background: #6b3fd4; }
      .chat-message { margin: 8px 0; }
      .user-message { text-align: right; }
      .user-message span { 
        background: #e3f2fd; color: #333;
        padding: 8px 12px; border-radius: 16px 16px 4px 16px;
        display: inline-block; max-width: 80%;
      }
      .bot-message { text-align: left; }
      .bot-message div { 
        background: #854fff; color: white;
        padding: 10px 14px; border-radius: 16px 16px 16px 4px;
        display: inline-block; max-width: 85%;
      }
      .bot-message a { color: #fff; text-decoration: underline; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);
    document.body.appendChild(container);
  }

  // 渲染歷史記錄
  function renderHistory() {
    const body = document.getElementById('chat-widget-body');
    if (!body) return;

    const history = loadHistory();
    
    // 保留歡迎訊息
    body.innerHTML = `
      <div class="bot-message chat-message">
        <div style="background: #854fff; color: white; padding: 10px 14px; border-radius: 16px 16px 16px 4px; display: inline-block; max-width: 85%;">
          <strong>Hi 👋 Welcome to Demo Store!</strong><br><br>
          I'm your AI shopping assistant. How can I help you today?
        </div>
      </div>
    `;

    // 添加歷史訊息
    history.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`;
      
      if (msg.role === 'user') {
        div.innerHTML = `<span>${escapeHtml(msg.content)}</span>`;
      } else {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = typeof marked !== 'undefined' ? marked.parse(msg.content) : msg.content;
        div.appendChild(wrapper);
      }
      
      body.appendChild(div);
    });

    body.scrollTop = body.scrollHeight;
  }

  // HTML 轉義
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 添加訊息
  function appendMessage(role, content) {
    const history = loadHistory();
    history.push({ role, content, timestamp: new Date().toISOString() });
    
    // 限制歷史記錄數量（保留最近 50 條）
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    saveHistory(history);
    renderHistory();
  }

  // 開啟聊天
  function openChat() {
    const button = document.getElementById('chat-widget-button');
    const container = document.getElementById('chat-widget-container');
    const input = document.getElementById('chat-widget-input');
    
    if (button) button.style.display = 'none';
    if (container) container.style.display = 'flex';
    if (input) input.focus();
    
    renderHistory();
  }

  // 關閉聊天
  function closeChat() {
    const button = document.getElementById('chat-widget-button');
    const container = document.getElementById('chat-widget-container');
    
    if (button) button.style.display = 'flex';
    if (container) container.style.display = 'none';
  }

  // 發送訊息
  async function sendMessage() {
    const input = document.getElementById('chat-widget-input');
    const body = document.getElementById('chat-widget-body');
    
    if (!input || !body) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    input.disabled = true;
    
    // 添加用戶訊息
    appendMessage('user', text);
    
    // 添加載入訊息
    const loadingDiv = document.createElement('div');
    loadingDiv.id = '__loading';
    loadingDiv.className = 'bot-message chat-message';
    loadingDiv.innerHTML = '<div style="background: #854fff; color: white; padding: 10px 14px; border-radius: 16px 16px 16px 4px; display: inline-block;">Thinking...</div>';
    body.appendChild(loadingDiv);
    body.scrollTop = body.scrollHeight;
    
    try {
      // 決定是否使用 CORS proxy
      let fetchUrl = CONFIG.webhook.url;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // 如果是從 file:// 或需要 CORS proxy
      if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
        fetchUrl = CONFIG.webhook.corsProxy + CONFIG.webhook.url;
        headers['x-cors-api-key'] = CONFIG.webhook.apiKey;
      }
      
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          chatId: getChatId(),
          sessionId: getChatId(),
          message: text,
          route: 'general'
        })
      });
      
      const data = await response.json();
      
      // 移除載入訊息
      const loading = document.getElementById('__loading');
      if (loading) loading.remove();
      
      // 添加回覆
      const reply = data.output || data.response || data.text || 'Sorry, I encountered an error. Please try again.';
      appendMessage('bot', reply);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // 移除載入訊息
      const loading = document.getElementById('__loading');
      if (loading) loading.remove();
      
      // 添加錯誤訊息
      appendMessage('bot', 'Sorry, I\'m having connection issues. Please try again later.');
    }
    
    input.disabled = false;
    input.focus();
  }

  // 初始化
  function init() {
    // 等待 DOM 載入
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // 創建聊天元件
    createChatWidget();
    
    // 綁定事件
    const button = document.getElementById('chat-widget-button');
    const closeBtn = document.getElementById('chat-widget-close');
    const sendBtn = document.getElementById('chat-widget-send');
    const input = document.getElementById('chat-widget-input');
    
    if (button) button.addEventListener('click', openChat);
    if (closeBtn) closeBtn.addEventListener('click', closeChat);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }

  // 啟動
  init();
})();
