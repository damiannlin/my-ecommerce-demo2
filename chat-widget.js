  1 // File: chat-widget.js
  2 // n8n Chat Widget Integration — 把這整份獨立成一個檔案
  3 
  4 window.ChatWidgetConfig = {
  5     webhook: {
  6         url: 'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
  7         route: 'general'
  8     }
  9 };
 10 
 11 function getChatId() {
 12     let cid = sessionStorage.getItem('chatId');
 13     if (!cid) {
 14         cid = 'chat_' + Math.random().toString(36).slice(2, 11);
 15         sessionStorage.setItem('chatId', cid);
 16     }
 17     return cid;
 18 }
 19 
 20 const chatBtn = document.getElementById('chat-widget-button');
 21 const chatContainer = document.getElementById('chat-widget-container');
 22 
 23 chatBtn.addEventListener('click', () => {
 24     chatContainer.style.display = 'flex';
 25     chatBtn.style.display = 'none';
 26     document.getElementById('chat-widget-input').focus();
 27 });
 28 
 29 function closeChatWidget() {
 30     chatContainer.style.display = 'none';
 31     chatBtn.style.display = 'flex';
 32 }
 33 
 34 async function sendMessage() {
 35     const inputEl = document.getElementById('chat-widget-input');
 36     const msg = inputEl.value.trim();
 37     if (!msg) return;
 38     const bodyEl = document.getElementById('chat-widget-body');
 39 
 40     // 使用者訊息
 41     const um = document.createElement('div');
 42     um.className = 'user-message chat-message';
 43     um.innerHTML = `<span>${msg}</span>`;
 44     bodyEl.appendChild(um);
 45 
 46     // 加載狀態
 47     const lm = document.createElement('div');
 48     lm.id = '__loading';
 49     lm.className = 'bot-message chat-message';
 50     lm.innerHTML = `<div>Thinking...</div>`;
 51     bodyEl.appendChild(lm);
 52     bodyEl.scrollTop = bodyEl.scrollHeight;
 53 
 54     try {
 55         const res = await fetch(window.ChatWidgetConfig.webhook.url, {
 56             method: 'POST',
 57             headers: {
 58                 'Content-Type': 'application/json',
 59                 'x-cors-api-key': 'live_6ed1988eef69805095b983da8425845588a78d58a8183e8bf26e028268bd4d47'
 60             },
 61             body: JSON.stringify({
 62                 chatId: getChatId(),
 63                 sessionId: getChatId(),
 64                 message: msg,
 65                 route: window.ChatWidgetConfig.webhook.route
 66             })
 67         });
 68         const data = await res.json();
 69         const loadingEl = document.getElementById('__loading');
 70         if (loadingEl) loadingEl.remove();
 71 
 72         const reply = data.output || data.response || data.text || '抱歉，出錯了。';
 73         const bm = document.createElement('div');
 74         bm.className = 'bot-message chat-message';
 75         bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
 76         bodyEl.appendChild(bm);
 77         bodyEl.scrollTop = bodyEl.scrollHeight;
 78     } catch (e) {
 79         const loadingEl = document.getElementById('__loading');
 80         if (loadingEl) loadingEl.remove();
 81         const err = document.createElement('div');
 82         err.className = 'bot-message chat-message';
 83         err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
 84         bodyEl.appendChild(err);
 85     }
 86 
 87     inputEl.value = '';
 88 }
 89 
 90 document.getElementById('chat-widget-send').addEventListener('click', sendMessage);
 91 document.getElementById('chat-widget-input').addEventListener('keypress', e => {
 92     if (e.key === 'Enter') sendMessage();
 93 });
