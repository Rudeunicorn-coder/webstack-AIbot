/*!
 * ============================================================================
 * WebStackPro Website Chat Widget  v1.1
 * ----------------------------------------------------------------------------
 * Embed on any page with:
 *   <script src="https://YOUR_APP/webstackpro-widget.js"
 *           data-business="YOUR_WEBSTACKPRO_BUSINESS_ID" async></script>
 *
 * The widget creates a floating chat bubble on your site. Every customer
 * message is streamed into the WebStackPro Unified Inbox through the
 * WebStackPro AI agent, which replies automatically.
 *
 * v1.1 adds: per-business branding (name, colors, greeting), lead capture
 * (name + email), business-hours awareness and an optional "Powered by"
 * footer controlled from the WebStackPro dashboard.
 *
 * Powered by WebStackPro — Automate. Convert. Grow.
 * ============================================================================
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var businessId = (script && script.getAttribute("data-business")) || "";
  var apiUrl =
    (script && script.getAttribute("data-api")) ||
    "http://localhost:4000";

  // Brand colors: WebStackPro navy + cyan (defaults, overridden by config)
  var NAVY = "#0A1F44";
  var CYAN = "#00D4FF";

  if (!businessId) {
    console.warn("[WebStackPro] Missing data-business attribute. Widget disabled.");
    return;
  }

  var CONFIG_KEY = "webstackpro_widget_" + businessId;
  var stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch (e) {
    stored = {};
  }

  var visitorId = stored.visitorId || "wsp_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
  var visitorName = stored.name || "";
  var visitorEmail = stored.email || "";
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ visitorId: visitorId, name: visitorName, email: visitorEmail }));

  var lastMessageCount = Number(stored.count || 0);
  var pollTimer = null;
  var widgetConfig = null;

  // ---------------------------------------------------------------- styles --
  function buildCss(primary, accent) {
    return [
      "#webstackpro-widget-root *{box-sizing:border-box;margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif}",
      "#webstackpro-widget-root{position:fixed;bottom:20px;right:20px;z-index:2147483000;font-size:14px;line-height:1.45}",
      "#wsp-fab{display:flex;align-items:center;gap:10px;border:0;cursor:pointer;color:#fff;padding:14px 20px;border-radius:9999px;box-shadow:0 8px 28px rgba(10,31,68,.35);background:" + primary + ";font-weight:600}",
      "#wsp-fab:hover{box-shadow:0 8px 34px rgba(0,212,255,.5)}",
      "#wsp-fab-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:9999px;background:" + accent + ";color:" + primary + ";font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px;display:none}",
      "#wsp-panel{position:absolute;bottom:84px;right:0;width:360px;max-width:88vw;height:520px;max-height:72vh;background:#fff;border-radius:16px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 20px 60px rgba(10,31,68,.4);border:1px solid rgba(0,212,255,.35)}",
      "#wsp-header{background:" + primary + ";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}",
      "#wsp-header h4{font-size:15px;font-weight:700}",
      "#wsp-header p{font-size:11px;opacity:.75}",
      "#wsp-dot{width:8px;height:8px;border-radius:50%;background:" + accent + ";box-shadow:0 0 8px " + accent + ";animation:wspPulse 1.6s infinite}",
      "@keyframes wspPulse{0%,100%{opacity:1}50%{opacity:.4}}",
      "#wsp-close{margin-left:auto;background:rgba(255,255,255,.12);border:0;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1}",
      "#wsp-messages{flex:1;overflow-y:auto;padding:14px;background:#f4f7fb;display:flex;flex-direction:column;gap:8px}",
      ".wsp-msg{max-width:82%;padding:9px 12px;border-radius:12px;font-size:13px;white-space:pre-wrap;word-break:break-word}",
      ".wsp-customer{align-self:flex-end;background:" + primary + ";color:#fff;border-bottom-right-radius:3px}",
      ".wsp-bot{align-self:flex-start;background:#fff;color:#0A1F44;border:1px solid #e2e8f0;border-bottom-left-radius:3px}",
      ".wsp-bot small{display:block;margin-top:3px;font-size:9px;color:" + accent + ";font-weight:700;text-transform:uppercase}",
      "#wsp-lead{flex:1;overflow-y:auto;padding:16px;background:#f4f7fb;display:flex;flex-direction:column;justify-content:center;gap:10px}",
      "#wsp-lead .wsp-lead-title{font-size:14px;font-weight:700;color:" + primary + ";text-align:center}",
      "#wsp-lead .wsp-lead-sub{font-size:12px;color:#64748b;text-align:center}",
      "#wsp-lead input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:13px;outline:none}",
      "#wsp-lead input:focus{border-color:" + accent + ";box-shadow:0 0 0 3px rgba(0,212,255,.2)}",
      "#wsp-lead button{border:0;background:" + accent + ";color:" + primary + ";font-weight:700;padding:10px 16px;border-radius:10px;cursor:pointer}",
      "#wsp-inputbar{display:flex;gap:8px;padding:12px;background:#fff;border-top:1px solid #e2e8f0}",
      "#wsp-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:13px;outline:none}",
      "#wsp-input:focus{border-color:" + accent + ";box-shadow:0 0 0 3px rgba(0,212,255,.2)}",
      "#wsp-send{border:0;background:" + accent + ";color:" + primary + ";font-weight:700;padding:10px 16px;border-radius:10px;cursor:pointer}",
      "#wsp-send:disabled{opacity:.5;cursor:not-allowed}",
      "#wsp-typing{font-size:11px;color:#64748b;padding:2px 4px;display:none}",
      "#wsp-footer{font-size:9px;color:#94a3b8;text-align:center;padding:4px;background:#fff;border-top:1px solid #eef2f7}",
      "#wsp-footer a{color:" + accent + ";text-decoration:none;font-weight:700}",
    ].join("");
  }

  var style = document.createElement("style");
  style.textContent = buildCss(NAVY, CYAN);
  document.head.appendChild(style);

  // --------------------------------------------------------------- markup --
  var root = document.createElement("div");
  root.id = "webstackpro-widget-root";

  root.innerHTML =
    [
      '<div id="wsp-panel" role="dialog" aria-label="WebStackPro chat">',
      '  <div id="wsp-header">',
      '    <span id="wsp-dot"></span>',
      '    <div><h4 id="wsp-title">Chat with us</h4><p id="wsp-subtitle">Powered by WebStackPro AI · replies 24/7</p></div>',
      '    <button id="wsp-close" aria-label="Close">×</button>',
      "  </div>",
      '  <div id="wsp-lead" style="display:none">',
      '    <div class="wsp-lead-title" id="wsp-lead-title">Before we chat, what should we call you?</div>',
      '    <div class="wsp-lead-sub" id="wsp-lead-sub">This helps us personalise your experience.</div>',
      '    <input id="wsp-lead-name" placeholder="Your name" autocomplete="name" />',
      '    <input id="wsp-lead-email" placeholder="Your email (optional)" type="email" autocomplete="email" />',
      '    <button id="wsp-lead-start">Start chatting</button>',
      "  </div>",
      '  <div id="wsp-messages"></div>',
      '  <div id="wsp-typing">WebStackPro AI is typing…</div>',
      '  <div id="wsp-inputbar">',
      '    <input id="wsp-input" placeholder="Type your message…" autocomplete="off" />',
      '    <button id="wsp-send">Send</button>',
      "  </div>",
      "</div>",
      '<button id="wsp-fab">',
      '  <span id="wsp-fab-badge">0</span>',
      '  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.02 2 11c0 2.86 1.44 5.4 3.72 7.1L5 22l4.3-2.14c.85.22 1.75.34 2.7.34 5.52 0 10-4.02 10-9s-4.48-9-10-9z"/></svg>',
      '  <span id="wsp-fab-label">Chat with us</span>',
      "</button>",
    ].join("\n");

  document.body.appendChild(root);

  var panel = document.getElementById("wsp-panel");
  var fab = document.getElementById("wsp-fab");
  var badge = document.getElementById("wsp-fab-badge");
  var fabLabel = document.getElementById("wsp-fab-label");
  var messages = document.getElementById("wsp-messages");
  var lead = document.getElementById("wsp-lead");
  var leadName = document.getElementById("wsp-lead-name");
  var leadEmail = document.getElementById("wsp-lead-email");
  var leadStart = document.getElementById("wsp-lead-start");
  var input = document.getElementById("wsp-input");
  var sendBtn = document.getElementById("wsp-send");
  var closeBtn = document.getElementById("wsp-close");
  var typing = document.getElementById("wsp-typing");
  var title = document.getElementById("wsp-title");
  var subtitle = document.getElementById("wsp-subtitle");

  // --------------------------------------------------------------- helpers --
  function addMessage(role, text) {
    var row = document.createElement("div");
    row.className = "wsp-msg " + (role === "user" ? "wsp-customer" : "wsp-bot");
    row.textContent = text;
    if (role !== "user") {
      var tag = document.createElement("small");
      tag.textContent = widgetConfig && widgetConfig.showPoweredBy === false ? "" : "Powered by WebStackPro AI";
      row.appendChild(tag);
    }
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function persist() {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ visitorId: visitorId, name: visitorName, email: visitorEmail, count: lastMessageCount })
    );
  }

  async function post(text) {
    typing.style.display = "block";
    sendBtn.disabled = true;
    try {
      var res = await fetch(apiUrl + "/api/webhooks/webwidget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId,
          externalId: visitorId,
          name: visitorName || "Website Visitor",
          email: visitorEmail || null,
          text: text,
        }),
      });
      await res.json();
    } catch (err) {
      addMessage("bot", "Sorry, WebStackPro is offline right now. Please try again soon.");
    } finally {
      typing.style.display = "none";
      sendBtn.disabled = false;
    }
  }

  async function poll() {
    try {
      var res = await fetch(
        apiUrl + "/api/webhooks/webwidget/messages?businessId=" + encodeURIComponent(businessId) +
          "&externalId=" + encodeURIComponent(visitorId)
      );
      var data = await res.json();
      var items = (data.conversation && data.conversation.messages) || [];
      if (items.length !== lastMessageCount) {
        messages.innerHTML = "";
        var lastRole = null;
        items.forEach(function (item) {
          var role = item.role === "user" ? "user" : "bot";
          if (role !== lastRole || role === "bot") addMessage(role, item.text);
          lastRole = role;
        });
        lastMessageCount = items.length;
        persist();
      }
    } catch (err) {
      /* silent — retry next tick */
    }
  }

  function showChat() {
    messages.style.display = "flex";
    lead.style.display = "none";
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  function showLead() {
    messages.style.display = "none";
    lead.style.display = "flex";
    leadName.focus();
  }

  function applyConfig(cfg) {
    widgetConfig = cfg;
    if (cfg.primaryColor) {
      NAVY = cfg.primaryColor;
      style.textContent = buildCss(cfg.primaryColor, cfg.accentColor || CYAN);
    }
    title.textContent = cfg.name || "Chat with us";
    subtitle.textContent =
      (cfg.showPoweredBy === false ? "" : "Powered by WebStackPro AI · ") +
      "replies 24/7";
    fabLabel.textContent = cfg.name || "Chat with us";
    if (cfg.greeting && (!stored.sentGreeting || lastMessageCount === 0)) {
      addMessage("bot", cfg.greeting);
      stored.sentGreeting = true;
    }
  }

  async function loadConfig() {
    try {
      var res = await fetch(apiUrl + "/api/webhooks/webwidget/config?businessId=" + encodeURIComponent(businessId));
      var data = await res.json();
      applyConfig(data.config || {});
    } catch (_) {
      /* keep defaults */
    }
  }

  // ---------------------------------------------------------------- events --
  fab.addEventListener("click", function () {
    var open = panel.style.display === "flex";
    panel.style.display = open ? "none" : "flex";
    badge.style.display = "none";
    if (!open) {
      if (widgetConfig && widgetConfig.collectLead && !visitorName) {
        showLead();
      } else {
        showChat();
        poll();
      }
    }
  });

  closeBtn.addEventListener("click", function () {
    panel.style.display = "none";
  });

  leadStart.addEventListener("click", function () {
    var name = (leadName.value || "").trim();
    if (!name) {
      leadName.focus();
      return;
    }
    visitorName = name;
    visitorEmail = (leadEmail.value || "").trim() || visitorEmail;
    persist();
    showChat();
    poll();
  });

  leadEmail.addEventListener("keydown", function (e) {
    if (e.key === "Enter") leadStart.click();
  });

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });

  function send() {
    var text = (input.value || "").trim();
    if (!text) return;
    addMessage("user", text);
    input.value = "";
    post(text);
  }

  // Poll the WebStackPro inbox for AI/human replies every 3 seconds.
  pollTimer = setInterval(poll, 3000);

  loadConfig();

  console.log("[WebStackPro] Website widget active for business " + businessId + ". Automate. Convert. Grow.");
})();
