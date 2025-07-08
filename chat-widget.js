/* File: chat-widget.js */
(function(){
  // n8n Chat Widget Config
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

  // 等待 DOM 載入完成
  function initChat() {
    // 動態創建聊天按鈕和容器
    if (!document.getElementById('chat-widget-button')) {
      const button = document.createElement('button');
      button.id = 'chat-widget-button';
      button.innerHTML = '💬';
      button.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: #854fff; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 1001; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: all 0.3s;';
      document.body.appendChild(button);
    }

    if (!document.getElementById('chat-widget-container')) {
      const container = document.createElement('div');
      container.id = 'chat-widget-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: none; flex-direction: column; z-index: 1000; overflow: hidden;';
      container.innerHTML = `
        <div id="chat-widget-header" style="background: #854fff; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <span>🤖 AI Shopping Assistant</span>
          <button onclick="closeChatWidget()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">✖</button>
        </div>
        <div id="chat-widget-body" style="flex: 1; padding: 12px; overflow-y: auto; background: #f9f9f9;">
          <div class="bot-message chat-message">
            <div><strong>Hi 👋 Welcome to our Demo Store!</strong><br><br>I'm your AI shopping assistant. How can I help you today?</div>
          </div>
        </div>
        <div id="chat-widget-footer" style="padding: 8px; border-top: 1px solid #ddd; display: flex; gap: 6px; background: white;">
          <input type="text" id="chat-widget-input" placeholder="Type your message here..." style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none;" />
          <button id="chat-widget-send" style="background: #854fff; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Send</button>
        </div>
      `;
      document.body.appendChild(container);
    }

    // 添加基本樣式
    if (!document.getElementById('chat-widget-styles')) {
      const styles = document.createElement('style');
      styles.id = 'chat-widget-styles';
      styles.textContent = `
        #chat-widget-button:hover { transform: scale(1.1); box-shadow: 0 6px 15px rgba(0,0,0,0.4); }
        .chat-message { margin: 8px 0; }
        .user-message { text-align: right; }
        .user-message span { background: #e3f2fd; color: #333; padding: 8px 12px; border-radius: 16px 16px 4px 16px; display: inline-block; max-width: 80%; }
        .bot-message { text-align: left; }
        .bot-message div { background: #854fff; color: white; padding: 10px 14px; border-radius: 16px 16px 16px 4px; display: inline-block; max-width: 85%; }
        .bot-message img { max-width: 100%; max-height: 200px; display: block; margin: 12px 0; border-radius: 8px; }
        .bot-message a { color: #fff; text-decoration: underline; }
      `;
      document.head.appendChild(styles);
    }

    // 開／關 chat 視窗
    const chatBtn = document.getElementById('chat-widget-button');
    const chatContainer = document.getElementById('chat-widget-container');
    
    chatBtn.addEventListener('click', () => {
      chatContainer.style.display = 'flex';
      chatBtn.style.display = 'none';
      document.getElementById('chat-widget-input').focus();
    });
  }

  window.closeChatWidget = function() {
    document.getElementById('chat-widget-container').style.display = 'none';
    document.getElementById('chat-widget-button').style.display = 'flex';
  };

  // 傳訊 & 顯示回覆
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

    // Loading
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
      const bm = document.createElement('div');
      bm.className = 'bot-message chat-message';
      
      // 如果回覆包含 HTML（來自 n8n），直接使用；否則用 marked 解析
      if (reply.includes('<div') || reply.includes('<img')) {
        bm.innerHTML = `<div>${reply}</div>`;
      } else if (typeof marked !== 'undefined') {
        bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
      } else {
        bm.innerHTML = `<div>${reply}</div>`;
      }
      
      bodyEl.appendChild(bm);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } catch (e) {
      document.getElementById('__loading')?.remove();
      const err = document.createElement('div');
      err.className = 'bot-message chat-message';
      err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
      bodyEl.appendChild(err);
    }

    inputEl.value = '';
  }

  // 等待 DOM 載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }

  // 確保事件綁定
  document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('chat-widget-send');
    const inputEl = document.getElementById('chat-widget-input');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }
    
    if (inputEl) {
      inputEl.addEventListener('keypress', e => { 
        if (e.key === 'Enter') sendMessage(); 
      });
    }
  });
})();
