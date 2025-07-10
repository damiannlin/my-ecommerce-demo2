/* File: chat-widget.js */
(function(){
  // --- 1. 基本設定 & 連續對話用 chatId ---
  window.ChatWidgetConfig = {
    webhook: {
      url: 'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
      route: 'general'
    }
  };

  function getChatId() {
    let cid = sessionStorage.getItem('chatId');
    if (!cid) {
      cid = 'chat_' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem('chatId', cid);
    }
    return cid;
  }

  // --- 2. 存／取 chatHistory 的工具 ---
  function loadHistory() {
    try {
      const raw = sessionStorage.getItem('chatHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function saveHistory(history) {
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
  }

  // --- 3. 將一筆訊息渲染到畫面 & 同步到 history ---
  function appendMessage(role, contentHtml) {
    const bodyEl = document.getElementById('chat-widget-body');
    if (!bodyEl) return;
    const wrapper = document.createElement('div');
    wrapper.className = (role === 'user' ? 'user-message chat-message' : 'bot-message chat-message');
    
    if (role === 'user') {
      wrapper.innerHTML = `<span>${contentHtml}</span>`;
    } else {
      wrapper.innerHTML = `<div>${contentHtml}</div>`;
    }
    
    bodyEl.appendChild(wrapper);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    // 存到 history
    const hist = loadHistory();
    hist.push({ role, html: contentHtml });
    saveHistory(hist);
  }

  // --- 4. 初始化 chat 視窗（含重建舊訊息） ---
  function initChat() {
    // a) 建立按鈕與容器（若不存在）
    if (!document.getElementById('chat-widget-button')) {
      const btn = document.createElement('button');
      btn.id = 'chat-widget-button';
      btn.innerHTML = '💬';
      btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:#854fff;color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:24px;z-index:1001;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);transition:all .3s;';
      document.body.appendChild(btn);
    }
    if (!document.getElementById('chat-widget-container')) {
      const container = document.createElement('div');
      container.id = 'chat-widget-container';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:none;flex-direction:column;z-index:1000;overflow:hidden;';
      container.innerHTML = `
        <div id="chat-widget-header" style="background:#854fff;color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>🤖 AI Shopping Assistant</span>
          <button id="chat-widget-close" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">✖</button>
        </div>
        <div id="chat-widget-body" style="flex:1;padding:12px;overflow-y:auto;background:#f9f9f9;"></div>
        <div id="chat-widget-footer" style="padding:8px;border-top:1px solid #ddd;display:flex;gap:6px;background:#fff;">
          <input type="text" id="chat-widget-input" placeholder="Type your message here..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:20px;outline:none;"/>
          <button id="chat-widget-send" style="background:#854fff;color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;">Send</button>
        </div>
      `;
      document.body.appendChild(container);
    }

    // 添加樣式（這是關鍵！）
    if (!document.getElementById('chat-widget-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-widget-styles';
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
        .bot-message > div { 
          background: #854fff; color: white;
          padding: 10px 14px; border-radius: 16px 16px 16px 4px;
          display: inline-block; max-width: 85%;
        }
        .bot-message a { color: #fff; text-decoration: underline; }
        
        /* 修復圖片顯示問題 */
        .bot-message img {
          max-width: 100%;
          max-height: 200px;
          height: auto;
          display: block;
          margin: 8px 0;
          border-radius: 8px;
          object-fit: contain;
        }
        
        /* 確保圖片在對話框內正確顯示 */
        .bot-message > div img {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* 如果是產品卡片中的圖片，使用更小的尺寸 */
        .bot-message .product-card img,
        .bot-message div[style*="display: flex"] img {
          max-width: 80px;
          max-height: 80px;
          width: 80px;
          height: 80px;
          margin: 0;
        }
      `;
      document.head.appendChild(style);
    }

    // b) 重建舊訊息
    const history = loadHistory();
    const bodyEl = document.getElementById('chat-widget-body');
    bodyEl.innerHTML = ''; // 清空再載入
    
    if (history.length) {
      history.forEach(item => {
        const div = document.createElement('div');
        div.className = (item.role === 'user' ? 'user-message chat-message' : 'bot-message chat-message');
        
        if (item.role === 'user') {
          div.innerHTML = `<span>${item.html}</span>`;
        } else {
          div.innerHTML = `<div>${item.html}</div>`;
        }
        
        bodyEl.appendChild(div);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      // 如果沒有歷史，就顯示預設歡迎
      appendMessage('bot', `<strong>Hi 👋 Welcome to our Demo Store!</strong><br><br>I'm your AI shopping assistant. How can I help you today?`);
    }

    // c) 綁定開／關
    const chatBtn = document.getElementById('chat-widget-button');
    const chatContainer = document.getElementById('chat-widget-container');
    chatBtn.addEventListener('click', () => {
      chatContainer.style.display = 'flex';
      chatBtn.style.display = 'none';
      document.getElementById('chat-widget-input').focus();
    });
    document.getElementById('chat-widget-close')?.addEventListener('click', () => {
      chatContainer.style.display = 'none';
      chatBtn.style.display = 'flex';
    });
  }

  // --- 5. 送出訊息 & 處理回覆 ---
  async function sendMessage() {
    const inputEl = document.getElementById('chat-widget-input');
    const msg = inputEl.value.trim();
    if (!msg) return;
    
    // 顯示使用者訊息（HTML 轉義）
    const escapedMsg = msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    appendMessage('user', escapedMsg);

    // 顯示 Loading
    const bodyEl = document.getElementById('chat-widget-body');
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
      document.getElementById('__loading')?.remove();

      const reply = data.output || data.response || data.text || '抱歉，出錯了。';
      // 直接把 HTML 或 Markdown 解析放進去
      if (reply.includes('<div') || reply.includes('<img') || reply.includes('<p>')) {
        appendMessage('bot', reply);
      } else if (typeof marked !== 'undefined') {
        appendMessage('bot', marked.parse(reply));
      } else {
        appendMessage('bot', reply);
      }
    } catch (e) {
      document.getElementById('__loading')?.remove();
      appendMessage('bot', '連線失敗，請稍後再試。');
    }

    inputEl.value = '';
  }

  // --- 6. 啟動時機 ---  
  function boot() {
    initChat();
    // 綁定送出
    const sendBtn = document.getElementById('chat-widget-send');
    const inputEl = document.getElementById('chat-widget-input');
    sendBtn?.addEventListener('click', sendMessage);
    inputEl?.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
