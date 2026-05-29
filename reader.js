// ── 設定 ────────────────────────────────────────────────────────────────────
const API_BASE   = "https://api.petrowaves.tw";
const SHOPEE_URL = "https://shopee.tw";

// ── 從 URL 取得參數 ──────────────────────────────────────────────────────────
const params    = new URLSearchParams(window.location.search);
const novelSlug = params.get("slug") || "xingxiangzhiyin";
const chapterId = parseInt(params.get("ch")) || 0;

// ── DOM 元素 ─────────────────────────────────────────────────────────────────
const titleEl    = document.getElementById("chapter-title");
const contentEl  = document.getElementById("chapter-content");
const fontDisplay = document.getElementById("font-display");

// ── 字體大小控制 ─────────────────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem("reader_font") || "19");

function applyFont() {
  contentEl.style.fontSize = fontSize + "px";
  if (fontDisplay) fontDisplay.textContent = fontSize + "px";
  localStorage.setItem("reader_font", fontSize);
}

document.getElementById("font-small").onclick = () => {
  if (fontSize > 14) { fontSize -= 2; applyFont(); }
};
document.getElementById("font-large").onclick = () => {
  if (fontSize < 28) { fontSize += 2; applyFont(); }
};
document.getElementById("toggle-dark").onclick = () => {
  document.body.classList.toggle("dark-mode");
  const btn = document.getElementById("toggle-dark");
  btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ 日間" : "🌙 夜間";
};

applyFont();

// ── 蝦皮跳轉解鎖機制 ─────────────────────────────────────────────────────────
function getShopeeKey(nextId) { return `shopee_visited_${novelSlug}_${nextId}`; }
function hasVisitedShopee(nextId) { return localStorage.getItem(getShopeeKey(nextId)) === "1"; }
function markShopeeVisited(nextId) { localStorage.setItem(getShopeeKey(nextId), "1"); }

function goToShopeeAndWait(nextId) {
  markShopeeVisited(nextId);
  window.open(SHOPEE_URL, "_blank");
  window.addEventListener("focus", function onFocus() {
    window.removeEventListener("focus", onFocus);
    window.location.href = `reader.html?slug=${novelSlug}&ch=${nextId}`;
  });
}

// ── 載入章節內容 ─────────────────────────────────────────────────────────────
async function loadChapter() {
  if (!chapterId) {
    titleEl.textContent = "找不到章節";
    contentEl.textContent = "請從章節列表進入。";
    return;
  }

  titleEl.textContent = "載入中…";
  contentEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/novels/${novelSlug}`);
    if (!res.ok) throw new Error("找不到小說");
    const novel = await res.json();

    const chapters = (novel.chapters || [])
      .filter(ch => ch.status === "published" && ch.is_unlocked)
      .sort((a, b) => a.order - b.order);

    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) throw new Error("找不到此章節，或尚未發布");

    document.title = `${chapter.title}｜${novel.title}`;
    titleEl.textContent = `第 ${chapter.order} 章：${chapter.title}`;

    const paragraphs = (chapter.content || "（尚無內容）")
      .split(/\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join("");
    contentEl.innerHTML = paragraphs;

    // ── 導航 ──────────────────────────────────────────────────────────────
    const idx  = chapters.findIndex(ch => ch.id === chapterId);
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];

    const nav = document.createElement("div");
    nav.className = "chapter-nav";

    const prevHtml = prev
      ? `<a href="reader.html?slug=${novelSlug}&ch=${prev.id}">← ${prev.title}</a>`
      : `<a class="disabled">← 已是第一章</a>`;

    let nextHtml;
    if (!next) {
      nextHtml = `<a class="disabled">已是最新章 →</a>`;
    } else if (hasVisitedShopee(next.id)) {
      nextHtml = `<a href="reader.html?slug=${novelSlug}&ch=${next.id}">${next.title} →</a>`;
    } else {
      nextHtml = `<a id="next-shopee-btn" style="cursor:pointer">${next.title} →</a>`;
    }

    nav.innerHTML = `${prevHtml}<a href="chapter-list.html">章節列表</a>${nextHtml}`;
    document.querySelector(".reader").appendChild(nav);

    const shopeeBtn = document.getElementById("next-shopee-btn");
    if (shopeeBtn && next) {
      shopeeBtn.onclick = () => goToShopeeAndWait(next.id);
    }

  } catch (err) {
    titleEl.textContent = "載入失敗";
    contentEl.innerHTML = `<span style="color:#ff6b6b">⚠️ ${err.message}</span><br>
      <small style="color:#555">請確認後端服務運行中（${API_BASE}）</small>`;
  }
}

loadChapter();
