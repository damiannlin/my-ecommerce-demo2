// File: chat-widget.js

(function() {
    // Chat widget configuration
    window.ChatWidgetConfig = {
        webhook: {
            url: 'https://proxy.cors.sh/https://damiannstudio.app.n8n.cloud/webhook/f4b34c09-655e-4fee-8593-825a3000fcec/chat',
            route: 'general'
        }
    };

    // Generate or retrieve a persistent chat ID
    function getChatId() {
        let cid = sessionStorage.getItem('chatId');
        if (!cid) {
            cid = 'chat_' + Math.random().toString(36).substring(2, 11);
            sessionStorage.setItem('chatId', cid);
        }
        return cid;
    }

    // Elements
    const chatBtn = document.getElementById('chat-widget-button');
    const chatContainer = document.getElementById('chat-widget-container');
    const inputEl = document.getElementById('chat-widget-input');
    const sendBtn = document.getElementById('chat-widget-send');
    const bodyEl = document.getElementById('chat-widget-body');

    // Open chat window
    chatBtn.addEventListener('click', () => {
        chatContainer.style.display = 'flex';
        chatBtn.style.display = 'none';
        inputEl.focus();
    });

    // Close chat window
    window.closeChatWidget = function() {
        chatContainer.style.display = 'none';
        chatBtn.style.display = 'flex';
    };

    // Send user message and fetch bot reply
    async function sendMessage() {
        const msg = inputEl.value.trim();
        if (!msg) return;

        // Render user message
        const um = document.createElement('div');
        um.className = 'user-message chat-message';
        um.innerHTML = `<span>${msg}</span>`;
        bodyEl.appendChild(um);
        bodyEl.scrollTop = bodyEl.scrollHeight;

        // Render loading indicator
        const loader = document.createElement('div');
        loader.id = '__loading';
        loader.className = 'bot-message chat-message';
        loader.innerHTML = `<div>Thinking...</div>`;
        bodyEl.appendChild(loader);
        bodyEl.scrollTop = bodyEl.scrollHeight;

        inputEl.value = '';

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

            // Remove loader
            document.getElementById('__loading')?.remove();

            // Determine reply text
            const reply = data.output || data.response || data.text || '抱歉，出錯了。';

            // Render bot reply
            const bm = document.createElement('div');
            bm.className = 'bot-message chat-message';
            bm.innerHTML = `<div>${marked.parse(reply)}</div>`;
            bodyEl.appendChild(bm);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        } catch (e) {
            // Remove loader
            document.getElementById('__loading')?.remove();

            // Render error message
            const err = document.createElement('div');
            err.className = 'bot-message chat-message';
            err.innerHTML = `<div>連線失敗，請稍後再試。</div>`;
            bodyEl.appendChild(err);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }
    }

    // Attach event listeners
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
    });
})();
