// chat-widget.js - 增強版（修復格式和圖片顯示）

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
      width: 380px; height: 600px;
      background: white; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      display: none; flex-direction: column;
      z-index: 1000; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    container.innerHTML = `
      <div id="chat-widget-header" style="background: #854fff; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 16px 16px 0 0;">
        <span style="font-weight: 600; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">🤖</span> AI Assistant
        </span>
        <button id="chat-widget-close" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>
      <div id="chat-widget-body" style="flex: 1; padding: 16px; overflow-y: auto; background: #f8f9fa;">
        <div class="bot-message chat-message">
          <div>
            <strong>Hi 👋 Welcome to Demo Store!</strong><br><br>
            I'm your AI shopping assistant. How can I help you today?
          </div>
        </div>
      </div>
      <div id="chat-widget-footer" style="padding: 16px; border-top: 1px solid #e5e7eb; background: white; border-radius: 0 0 16px 16px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <input id="chat-widget-input" placeholder="Type a message..." style="flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; font-size: 14px; transition: border 0.2s;" />
          <button id="chat-widget-send" style="background: #854fff; color: white; border: none; padding: 12px 20px; border-radius: 24px; cursor: pointer; font-weight: 500; transition: all 0.2s;">Send</button>
        </div>
      </div>
    `;

    // 加入樣式
    const style = document.createElement('style');
    style.textContent = `
      #chat-widget-button:hover { 
        transform: scale(1.1); 
        box-shadow: 0 6px 20px rgba(133, 79, 255, 0.4); 
      }
      
      #chat-widget-close:hover { 
        background: rgba(255,255,255,0.3) !important; 
      }
      
      #chat-widget-input:focus { 
        border-color: #854fff !important; 
      }
      
      #chat-widget-send:hover { 
        background: #6b3fd4 !important; 
        transform: scale(1.02);
      }
      
      #chat-widget-send:active { 
        transform: scale(0.98);
      }
      
      .chat-message { 
        margin: 12px 0; 
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .user-message { 
        text-align: right; 
      }
      
      .user-message span { 
        background: #854fff;
        color: white;
        padding: 12px 16px;
        border-radius: 18px 18px 4px 18px;
        display: inline-block;
        max-width: 75%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .bot-message { 
        text-align: left; 
      }
      
      .bot-message > div { 
        background: white;
        color: #1f2937;
        padding: 12px 16px;
        border-radius: 18px 18px 18px 4px;
        display: inline-block;
        max-width: 85%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        font-size: 14px;
        line-height: 1.6;
      }
      
      .bot-message strong {
        color: #111827;
      }
      
      .bot-message a { 
        color: #854fff;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;
      }
      
      .bot-message a:hover {
        border-bottom-color: #854fff;
      }
      
      /* 產品卡片樣式 */
      .product-card {
        background: #f3f4f6;
        border-radius: 12px;
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #e5e7eb;
      }
      
      .product-card img {
        width: 80px;
        height: 80px;
        object-fit: contain;
        border-radius: 8px;
        background: white;
        padding: 8px;
        float: left;
        margin-right: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .product-info {
        overflow: hidden;
      }
      
      .product-title {
        font-weight: 600;
        color: #111827;
        font-size: 14px;
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-price {
        color: #854fff;
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .product-category {
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 4px;
      }
      
      .product-rating {
        color: #f59e0b;
        font-size: 12px;
      }
      
      .product-link {
        display: inline-block;
        margin-top: 8px;
        color: #854fff;
        font-size: 13px;
        font-weight: 500;
      }
      
      /* 載入動畫 */
      .typing-indicator {
        display: inline-flex;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border-radius: 18px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .typing-indicator span {
        height: 8px;
        width: 8px;
        background: #9ca3af;
        border-radius: 50%;
        display: inline-block;
        margin: 0 2px;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
      .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }
      
      /* 捲軸樣式 */
      #chat-widget-body::-webkit-scrollbar {
        width: 6px;
      }
      
      #chat-widget-body::-webkit-scrollbar-track {
        background: transparent;
      }
      
      #chat-widget-body::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
      
      #chat-widget-body::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);
    document.body.appendChild(container);
  }

  // 處理產品顯示格式
  function formatProductDisplay(text) {
    // 檢查是否包含產品資訊格式
    const lines = text.split('\n');
    let formattedHtml = '';
    let inProductSection = false;
    let currentProduct = null;

    lines.forEach(line => {
      // 檢測產品標題（例如：**1. Product Name**）
      const productMatch = line.match(/^\*?\*?(\d+)\.\s+(.+?)\*?\*?$/);
      if (productMatch) {
        if (currentProduct) {
          formattedHtml += createProductCard(currentProduct);
        }
        currentProduct = {
          title: productMatch[2].replace(/\*/g, ''),
          details: []
        };
        inProductSection = true;
      }
      // 檢測產品詳情
      else if (inProductSection && line.trim()) {
        if (line.includes('💰') || line.includes('Price:') || line.includes('價格:')) {
          const priceMatch = line.match(/\$?([\d.]+)/);
          if (priceMatch) currentProduct.price = '$' + priceMatch[1];
        }
        else if (line.includes('📦') || line.includes('Category:') || line.includes('分類:')) {
          currentProduct.category = line.replace(/[📦]|Category:|分類:/g, '').trim();
        }
        else if (line.includes('⭐') || line.includes('Rating:') || line.includes('評分:')) {
          currentProduct.rating = line;
        }
        else if (line.includes('🔗') || line.includes('[View Details]') || line.includes('[查看詳情]')) {
          const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            currentProduct.link = { text: linkMatch[1], url: linkMatch[2] };
          }
        }
        currentProduct.details.push(line);
      }
      // 處理分隔線
      else if (line.includes('---')) {
        if (currentProduct) {
          formattedHtml += createProductCard(currentProduct);
          currentProduct = null;
        }
      }
      // 普通文字
      else {
        if (currentProduct) {
          formattedHtml += createProductCard(currentProduct);
          currentProduct = null;
          inProductSection = false;
        }
        if (line.trim()) {
          formattedHtml += `<p>${marked.parseInline(line)}</p>`;
        }
      }
    });

    // 處理最後一個產品
    if (currentProduct) {
      formattedHtml += createProductCard(currentProduct);
    }

    return formattedHtml || marked.parse(text);
  }

  // 創建產品卡片
  function createProductCard(product) {
    return `
      <div class="product-card">
        <div class="product-info">
          <div class="product-title">${product.title}</div>
          ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
          ${product.category ? `<div class="product-category">${product.category}</div>` : ''}
          ${product.rating ? `<div class="product-rating">${product.rating}</div>` : ''}
          ${product.link ? `<a href="${product.link.url}" target="_blank" class="product-link">${product.link.text} →</a>` : ''}
        </div>
      </div>
    `;
  }

  // 渲染歷史記錄
  function renderHistory() {
    const body = document.getElementById('chat-widget-body');
    if (!body) return;

    const history = loadHistory();
    
    // 保留歡迎訊息
    body.innerHTML = `
      <div class="bot-message chat-message">
        <div>
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
        // 使用格式化函數處理產品顯示
        wrapper.innerHTML = formatProductDisplay(msg.content);
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
    const sendBtn = document.getElementById('chat-widget-send');
    
    if (!input || !body) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    
    // 添加用戶訊息
    appendMessage('user', text);
    
    // 添加載入動畫
    const loadingDiv = document.createElement('div');
    loadingDiv.id = '__loading';
    loadingDiv.className = 'bot-message chat-message';
    loadingDiv.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
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
      
      // 移除載入動畫
      const loading = document.getElementById('__loading');
      if (loading) loading.remove();
      
      // 添加回覆
      const reply = data.output || data.response || data.text || 'Sorry, I encountered an error. Please try again.';
      appendMessage('bot', reply);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // 移除載入動畫
      const loading = document.getElementById('__loading');
      if (loading) loading.remove();
      
      // 添加錯誤訊息
      appendMessage('bot', 'Sorry, I\'m having connection issues. Please try again later.');
    }
    
    input.disabled = false;
    sendBtn.disabled = false;
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
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  // 啟動
  init();
})();
