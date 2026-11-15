// Claude-hívás: a claude.ai-on a beépített felületet használja,
// máshol a saját Anthropic API-kulcsodat (csak ebben a böngészőben tárolva).

const AI_KEY = "forma_ai_key";
const AI_MODEL = "claude-sonnet-4-5";

// Elmentett API-kulcs olvasása
function aiKey() {
  try {
    return localStorage.getItem(AI_KEY) || "";
  } catch (e) {
    return "";
  }
}

// Claude-ot hívhatjuk-e? (claude.ai felület vagy saját kulcs)
function aiReady() {
  const inClaude = !!(window.claude && typeof window.claude.use === "function");
  return inClaude || !!aiKey();
}

// Egy kérés elküldése, a válasz JSON objektumként tér vissza
async function aiJson(prompt) {
  // 1) claude.ai: beépített felület, kulcs nélkül
  if (window.claude && typeof window.claude.use === "function") {
    const sample = await claude.use("sample");
    if (sample) return sample.json(prompt, { modelTier: "default", cache: false });
  }

  // 2) máshol: közvetlen API-hívás a saját kulccsal
  const key = aiKey();
  if (!key) {
    const err = new Error("no_key");
    err.code = "no_key";
    throw err;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (response.status === 429) {
    const err = new Error("rate_limited");
    err.code = "rate_limited";
    throw err;
  }
  if (!response.ok) {
    const err = new Error("http_" + response.status);
    err.code = response.status === 401 ? "bad_key" : "http";
    throw err;
  }

  // A válasz szövegéből kivágjuk a JSON objektumot
  const data = await response.json();
  const text = data.content.map(part => part.text || "").join("");
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}

// A Mentés fül kártyája az API-kulcs megadásához
function aiPanel() {
  const info = window.claude
    ? "A claude.ai-on a Claude külön kulcs nélkül működik."
    : "Itt a Claude-feldolgozáshoz saját Anthropic API-kulcs kell (console.anthropic.com). A kulcs csak ebben a böngészőben tárolódik, soha nem kerül fel GitHubra. Az API használata külön díjas.";

  return `<div class="card"><h2>Claude használata bárhol</h2>
    <p class="mute">${info}</p>
    <div class="row">
      <label>API-kulcs<input type="password" id="aik" placeholder="sk-ant-…" value="${esc(aiKey())}" autocomplete="off"></label>
      <button class="btn" onclick="saveAiKey()">Mentés</button>
      <button class="btn ghost" onclick="clearAiKey()">Törlés</button>
    </div>
    <p id="aist" class="mute" role="status" aria-live="polite"></p></div>`;
}

function saveAiKey() {
  const status = $("#aist");
  try {
    const value = $("#aik").value.trim();
    if (value) localStorage.setItem(AI_KEY, value);
    else localStorage.removeItem(AI_KEY);
    status.textContent = value ? "A kulcs elmentve." : "A kulcs törölve.";
  } catch (e) {
    status.textContent = "A böngésző nem engedi a mentést.";
  }
}

function clearAiKey() {
  $("#aik").value = "";
  saveAiKey();
}