// ── 設定 ────────────────────────────────────────────────────────────────────
const API_BASE = "https://api.petrowaves.tw";
const SHOPEE_URL = "https://s.shopee.tw/8ATHeR686w";

// ── 從 URL 取得參數 ──────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const novelSlug = params.get("slug") || "xingxiangzhiyin";
const chapterId = parseInt(params.get("ch")) || 0;

// ── DOM 元素 ─────────────────────────────────────────────────────────────────
const titleEl = document.getElementById("chapter-title");
const contentEl = document.getElementById("chapter-content");

// ── 字型 & 夜間模式 ──────────────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem("reader_font") || "19");

function applyFont() {
  contentEl.style.fontSize = fontSize + "px";
  localStorage.setItem("reader_font", fontSize);
}

document.getElementById("font-small").onclick = () => { if (fontSize > 14) { fontSize -= 2; applyFont(); } };
document.getElementById("font-large").onclick = () => { if (fontSize < 28) { fontSize += 2; applyFont(); } };
document.getElementById("toggle-dark").onclick = () => { document.body.classList.toggle("dark-mode"); };

applyFont();

// ── 蝦皮跳轉解鎖機制 ─────────────────────────────────────────────────────────
// localStorage key: shopee_visited_{novelSlug}_{nextChapterId}
function getShopeeKey(nextId) {
  return `shopee_visited_${novelSlug}_${nextId}`;
}

function hasVisitedShopee(nextId) {
  return localStorage.getItem(getShopeeKey(nextId)) === "1";
}

function markShopeeVisited(nextId) {
  localStorage.setItem(getShopeeKey(nextId), "1");
}

function goToShopeeAndWait(nextId, nextChapter) {
  // 標記「已點擊前往蝦皮」
  markShopeeVisited(nextId);
  // 開新分頁前往蝦皮
  window.open(SHOPEE_URL, "_blank");
  // 監聽使用者回來後解鎖
  window.addEventListener("focus", function onFocus() {
    window.removeEventListener("focus", onFocus);
    // 跳轉下一章
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

    // ── 導航按鈕 ──────────────────────────────────────────────────────────
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];

    const nav = document.createElement("div");
    nav.className = "chapter-nav";

    // 上一章
    const prevHtml = prev
      ? `<a href="reader.html?slug=${novelSlug}&ch=${prev.id}">← ${prev.title}</a>`
      : `<a class="disabled">← 已是第一章</a>`;

    // 下一章（蝦皮跳轉機制）
    let nextHtml;
    if (!next) {
      nextHtml = `<a class="disabled">已是最新章 →</a>`;
    } else if (hasVisitedShopee(next.id)) {
      // 已去過蝦皮，直接跳轉
      nextHtml = `<a href="reader.html?slug=${novelSlug}&ch=${next.id}">${next.title} →</a>`;
    } else {
      // 尚未去蝦皮，點了先跳蝦皮
      nextHtml = `<a id="next-shopee-btn" style="cursor:pointer">${next.title} →</a>`;
    }

    nav.innerHTML = `${prevHtml}<a href="chapter-list.html">章節列表</a>${nextHtml}`;
    document.querySelector(".reader").appendChild(nav);

    // 綁定蝦皮跳轉事件
    const shopeeBtn = document.getElementById("next-shopee-btn");
    if (shopeeBtn && next) {
      shopeeBtn.onclick = () => goToShopeeAndWait(next.id, next);
    }

  } catch (err) {
    titleEl.textContent = "載入失敗";
    contentEl.innerHTML = `<span style="color:#ff6b6b">⚠️ ${err.message}</span><br>
      <small style="color:#555">請確認後端服務運行中（${API_BASE}）</small>`;
  }
}

loadChapter();
