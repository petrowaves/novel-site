// ── 設定 ────────────────────────────────────────────────────────────────────
// 部署後改成你的後端網址，例如 https://api.yourdomain.com
const API_BASE = "https://api.petrowaves.tw";

// ── 從 URL 取得參數 ──────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const novelSlug = params.get("slug") || "xingxiangzhiyin";
const chapterId = parseInt(params.get("ch")) || 0;

// ── DOM 元素 ─────────────────────────────────────────────────────────────────
const titleEl = document.getElementById("chapter-title");
const contentEl = document.getElementById("chapter-content");

// ── 字型 & 夜間模式控制 ──────────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem("reader_font") || "19");

function applyFont() {
  contentEl.style.fontSize = fontSize + "px";
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
};

applyFont();

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
    // 取該小說所有章節（含內容）
    const res = await fetch(`${API_BASE}/novels/${novelSlug}`);
    if (!res.ok) throw new Error("找不到小說");
    const novel = await res.json();

    const chapters = (novel.chapters || [])
      .filter(ch => ch.status === "published")
      .sort((a, b) => a.order - b.order);

    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) throw new Error("找不到此章節，或尚未發布");

    // 更新頁面標題
    document.title = `${chapter.title}｜${novel.title}`;
    titleEl.textContent = `第 ${chapter.order} 章：${chapter.title}`;

    // 渲染內文（換行轉 <p>）
    const paragraphs = (chapter.content || "（尚無內容）")
      .split(/\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join("");
    contentEl.innerHTML = paragraphs;

    // ── 上一章 / 下一章 導航 ──────────────────────────────────────────────
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];

    // 插入導航按鈕
    const nav = document.createElement("div");
    nav.className = "chapter-nav";
    nav.innerHTML = `
      <a ${prev ? `href="reader.html?slug=${novelSlug}&ch=${prev.id}"` : 'class="disabled"'}>
        ← ${prev ? prev.title : "已是第一章"}
      </a>
      <a href="chapter-list.html">章節列表</a>
      <a ${next ? `href="reader.html?slug=${novelSlug}&ch=${next.id}"` : 'class="disabled"'}>
        ${next ? next.title : "已是最新章"} →
      </a>
    `;
    document.querySelector(".reader").appendChild(nav);

  } catch (err) {
    titleEl.textContent = "載入失敗";
    contentEl.innerHTML = `<span style="color:#ff6b6b">⚠️ ${err.message}</span><br>
      <small style="color:#555">請確認後端服務運行中（${API_BASE}）</small>`;
  }
}

loadChapter();
