

(function () {

  const style = document.createElement("style");
  style.textContent = `
    #cr-chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #F97316;
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      transition: transform 0.2s ease;
    }
    #cr-chat-toggle:hover { transform: scale(1.08); }

    #cr-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 32px);
      height: 480px;
      max-height: calc(100vh - 140px);
      background: #14151a;
      border: 1px solid #2a2b32;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #cr-chat-panel.cr-open { display: flex; }

    #cr-chat-header {
      background: #1c1d24;
      color: #fff;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 15px;
      border-bottom: 1px solid #2a2b32;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #cr-chat-header span.cr-accent { color: #F97316; }
    #cr-chat-close {
      background: none;
      border: none;
      color: #888;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    }
    #cr-chat-close:hover { color: #fff; }

    #cr-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cr-msg {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.45;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .cr-msg-bot {
      background: #22232b;
      color: #e6e6e6;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .cr-msg-user {
      background: #F97316;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .cr-msg-loading {
      background: #22232b;
      color: #999;
      align-self: flex-start;
      font-style: italic;
    }

    #cr-chat-input-row {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #2a2b32;
      background: #1c1d24;
    }
    #cr-chat-input {
      flex: 1;
      background: #0e0f13;
      border: 1px solid #2a2b32;
      border-radius: 10px;
      padding: 10px 12px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    #cr-chat-input:focus { border-color: #F97316; }
    #cr-chat-send {
      background: #F97316;
      border: none;
      color: #fff;
      border-radius: 10px;
      padding: 0 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    #cr-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  // ---------- HTML inject karein ----------
  const toggle = document.createElement("button");
  toggle.id = "cr-chat-toggle";
  toggle.setAttribute("aria-label", "Open chat");
  toggle.textContent = "💬";

  const panel = document.createElement("div");
  panel.id = "cr-chat-panel";
  panel.innerHTML = `
    <div id="cr-chat-header">
      <span>Call<span class="cr-accent">Rolin</span> Assistant</span>
      <button id="cr-chat-close" aria-label="Close chat">&times;</button>
    </div>
    <div id="cr-chat-messages"></div>
    <div id="cr-chat-input-row">
      <input id="cr-chat-input" type="text" placeholder="Type your question..." />
      <button id="cr-chat-send">Send</button>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#cr-chat-messages");
  const inputEl = panel.querySelector("#cr-chat-input");
  const sendBtn = panel.querySelector("#cr-chat-send");
  const closeBtn = panel.querySelector("#cr-chat-close");

  let hasGreeted = false;

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = "cr-msg cr-msg-" + sender;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function openPanel() {
    panel.classList.add("cr-open");
    if (!hasGreeted) {
      addMessage(
        "Hi! I'm the CallRolin assistant. Ask me anything about our products, deployment options, or services.",
        "bot"
      );
      hasGreeted = true;
    }
    inputEl.focus();
  }

  function closePanel() {
    panel.classList.remove("cr-open");
  }

  toggle.addEventListener("click", () => {
    if (panel.classList.contains("cr-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener("click", closePanel);

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "user");
    inputEl.value = "";
    sendBtn.disabled = true;

    const loadingMsg = addMessage("Typing...", "loading");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      loadingMsg.remove();

      if (!res.ok) {
        addMessage(data.error || "Something went wrong. Please try again.", "bot");
      } else {
        addMessage(data.answer, "bot");
      }
    } catch (err) {
      loadingMsg.remove();
      addMessage("Connection issue. Please try again in a moment.", "bot");
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();