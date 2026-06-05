import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── CSS-in-JS styles ────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #07070d;
    --surface:   #0e0e1a;
    --surface2:  #14142a;
    --border:    #1e1e3a;
    --accent:    #00ff9d;
    --accent2:   #7b61ff;
    --accent3:   #ff6b6b;
    --text:      #e8e8f0;
    --text-dim:  #6b6b8a;
    --text-mid:  #a8a8c0;
    --mono:      'Space Mono', monospace;
    --sans:      'Syne', sans-serif;
  }

  html, body { height: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    overflow-x: hidden;
  }

  /* grid noise bg */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }

  #root { position: relative; z-index: 1; min-height: 100vh; }

  /* ── Layout ── */
  .app { display: flex; flex-direction: column; min-height: 100vh; }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 56px;
    border-bottom: 1px solid var(--border);
    background: rgba(7,7,13,0.85);
    backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 50;
  }

  .topbar-logo {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--accent);
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .topbar-logo .dot {
    width: 8px; height: 8px;
    background: var(--accent);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .topbar-badge {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 2px;
    letter-spacing: 0.08em;
  }

  .main-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    flex: 1;
    min-height: 0;
  }

  /* ── Sidebar ── */
  .sidebar {
    border-right: 1px solid var(--border);
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    overflow-y: auto;
    background: rgba(14,14,26,0.5);
  }

  .section-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── Document cards ── */
  .doc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 8px;
    position: relative;
    overflow: hidden;
  }

  .doc-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border);
    transition: background 0.15s;
  }

  .doc-card:hover::before,
  .doc-card.active::before { background: var(--accent); }

  .doc-card:hover {
    border-color: rgba(0,255,157,0.2);
    background: var(--surface2);
  }

  .doc-card.active {
    border-color: rgba(0,255,157,0.3);
    background: rgba(0,255,157,0.04);
  }

  .doc-card.active .doc-name { color: var(--accent); }

  .doc-name {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .doc-meta {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    display: flex;
    gap: 10px;
  }

  .tag {
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 2px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent2);
  }

  /* ── Config panel ── */
  .config-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .config-label {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-mid);
    letter-spacing: 0.05em;
  }

  .config-select, .config-input {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--mono);
    font-size: 12px;
    padding: 8px 10px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  .config-select:focus, .config-input:focus {
    border-color: var(--accent2);
  }

  option { background: var(--surface2); }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  input[type=range] {
    flex: 1;
    accent-color: var(--accent);
    height: 4px;
    cursor: pointer;
  }

  .slider-val {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    min-width: 28px;
    text-align: right;
  }

  /* ── Main content ── */
  .content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Tab bar ── */
  .tabbar {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: rgba(14,14,26,0.4);
    padding: 0 32px;
  }

  .tab {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    padding: 14px 20px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    text-transform: uppercase;
  }

  .tab:hover { color: var(--text); }
  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
  }

  /* ── Query panel ── */
  .query-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 24px;
    position: relative;
  }

  .query-input {
    background: transparent;
    border: none;
    color: var(--text);
    font-family: var(--sans);
    font-size: 16px;
    font-weight: 600;
    width: 100%;
    outline: none;
    resize: none;
    line-height: 1.5;
    min-height: 48px;
  }

  .query-input::placeholder { color: var(--text-dim); }

  .query-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .filter-tag {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
  }

  .filter-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-mid);
    font-family: var(--mono);
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .btn-run {
    background: var(--accent);
    color: var(--bg);
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    padding: 10px 24px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
  }

  .btn-run:hover {
    background: #00e88c;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,255,157,0.25);
  }

  .btn-run:disabled {
    background: var(--border);
    color: var(--text-dim);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Results ── */
  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .results-count {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.08em;
  }

  .result-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px 18px;
    margin-bottom: 12px;
    transition: border-color 0.15s;
    animation: fadeIn 0.3s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .result-card:nth-child(1) { animation-delay: 0s; }
  .result-card:nth-child(2) { animation-delay: 0.06s; }
  .result-card:nth-child(3) { animation-delay: 0.12s; }
  .result-card:nth-child(4) { animation-delay: 0.18s; }
  .result-card:nth-child(5) { animation-delay: 0.24s; }

  .result-card:hover { border-color: rgba(123,97,255,0.3); }

  .result-rank {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .rank-badge {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent2);
    padding: 2px 8px;
    border-radius: 2px;
    min-width: 32px;
    text-align: center;
  }

  .rank-badge.top1 { background: var(--accent); color: var(--bg); }
  .rank-badge.top2 { background: var(--accent2); }
  .rank-badge.top3 { background: #ff9f43; color: var(--bg); }

  .score-bar-wrap {
    flex: 1;
    height: 4px;
    background: var(--surface2);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-bar {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--accent2), var(--accent));
    transition: width 0.5s ease;
  }

  .score-val {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    min-width: 48px;
    text-align: right;
  }

  .result-source {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .result-text {
    font-family: var(--sans);
    font-size: 13px;
    color: var(--text-mid);
    line-height: 1.65;
    border-left: 2px solid var(--border);
    padding-left: 12px;
    max-height: 120px;
    overflow: hidden;
    position: relative;
  }

  .result-text.expanded { max-height: none; }

  .expand-btn {
    background: none;
    border: none;
    color: var(--accent2);
    font-family: var(--mono);
    font-size: 10px;
    cursor: pointer;
    margin-top: 6px;
    letter-spacing: 0.05em;
    padding: 0;
  }

  /* ── Answer box ── */
  .answer-box {
    background: linear-gradient(135deg, rgba(0,255,157,0.04), rgba(123,97,255,0.04));
    border: 1px solid rgba(0,255,157,0.2);
    border-radius: 4px;
    padding: 20px 22px;
    margin-bottom: 28px;
    animation: fadeIn 0.4s ease;
  }

  .answer-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--accent);
    margin-bottom: 10px;
    text-transform: uppercase;
  }

  .answer-text {
    font-family: var(--sans);
    font-size: 14px;
    color: var(--text);
    line-height: 1.7;
  }

  .loading-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--accent2), var(--accent), var(--accent2));
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;
    border-radius: 2px;
    margin-bottom: 24px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Chunking tab ── */
  .chunk-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 18px;
    text-align: center;
  }

  .stat-val {
    font-family: var(--mono);
    font-size: 28px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 4px;
  }

  .stat-label {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .strategy-compare {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .strategy-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
  }

  .strategy-name {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent2);
    letter-spacing: 0.1em;
    margin-bottom: 10px;
    text-transform: uppercase;
  }

  .strategy-stat {
    display: flex;
    justify-content: space-between;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    margin-bottom: 6px;
  }

  .strategy-stat span:last-child { color: var(--text); }

  .chunk-preview {
    margin-top: 12px;
    max-height: 160px;
    overflow-y: auto;
  }

  .chunk-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 8px 10px;
    margin-bottom: 6px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    line-height: 1.5;
    cursor: pointer;
    transition: border-color 0.1s;
  }

  .chunk-item:hover { border-color: var(--accent2); color: var(--text); }

  /* ── Similarity tab ── */
  .similarity-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    gap: 12px;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px 16px;
    margin-bottom: 10px;
    animation: fadeIn 0.3s ease both;
  }

  .sim-input {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--sans);
    font-size: 13px;
    padding: 8px 10px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s;
  }

  .sim-input:focus { border-color: var(--accent2); }

  .sim-vs {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    text-align: center;
  }

  .sim-score {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 700;
    min-width: 60px;
    text-align: center;
  }

  .sim-score.high { color: var(--accent); }
  .sim-score.mid  { color: #ff9f43; }
  .sim-score.low  { color: var(--accent3); }

  .btn-sm {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 11px;
    padding: 6px 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.05em;
  }

  .btn-sm:hover {
    border-color: var(--accent2);
    color: var(--accent2);
  }

  .add-pair-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: transparent;
    border: 1px dashed var(--border);
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 11px;
    padding: 12px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.08em;
    margin-top: 8px;
  }

  .add-pair-btn:hover { border-color: var(--accent2); color: var(--accent2); }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    color: var(--text-dim);
    text-align: center;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-title {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text-mid);
    margin-bottom: 8px;
    letter-spacing: 0.08em;
  }

  .empty-sub {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.7;
  }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface2);
    border: 1px solid var(--accent);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 12px;
    padding: 10px 18px;
    border-radius: 3px;
    z-index: 999;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
`;

// ─── Mock data (mirrors the lab's Python objects) ─────────────────────────────
const DOCUMENTS = [
  {
    id: "luatbhxh",
    name: "Luật BHXH",
    law_number: "41/2024/QH15",
    year: 2024,
    law_type: "bhxh",
    chars: 61279,
    excerpt: "Luật Bảo hiểm xã hội — Quốc hội ban hành ngày 29/06/2024. Quy định về quyền, trách nhiệm của cơ quan, tổ chức, cá nhân đối với bảo hiểm xã hội và tổ chức thực hiện bảo hiểm xã hội...",
  },
  {
    id: "luatld",
    name: "Bộ luật Lao động",
    law_number: "45/2019/QH14",
    year: 2019,
    law_type: "lao_dong",
    chars: 70355,
    excerpt: "Bộ luật Lao động — Quốc hội ban hành ngày 20/11/2019. Quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động...",
  },
  {
    id: "luatvieclam",
    name: "Luật Việc làm",
    law_number: "74/2025/QH15",
    year: 2025,
    law_type: "viec_lam",
    chars: 33986,
    excerpt: "Luật Việc làm — Quốc hội ban hành ngày 16/06/2025. Quy định chính sách hỗ trợ tạo việc làm, đăng ký lao động, bảo hiểm thất nghiệp...",
  },
];

const BENCHMARK_QUERIES = [
  { query: "Người lao động đóng BHXH bắt buộc bao nhiêu phần trăm?", filter: "bhxh" },
  { query: "Thời gian thử việc tối đa cho trình độ đại học trở lên là bao nhiêu ngày?", filter: "lao_dong" },
  { query: "Điều kiện hưởng trợ cấp thất nghiệp là gì?", filter: "viec_lam" },
  { query: "Người lao động được nghỉ phép năm bao nhiêu ngày?", filter: "lao_dong" },
  { query: "Tuổi nghỉ hưu của lao động nữ năm 2025 là bao nhiêu?", filter: "lao_dong" },
];

// ─── Mock similarity engine ───────────────────────────────────────────────────
function mockSimilarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  // Add semantic bonus for domain keywords
  const domainPairs = [
    ["bhxh","bảo hiểm"], ["lao động","người lao động"], ["hợp đồng","hđlđ"],
    ["nghỉ phép","phép năm"], ["thất nghiệp","mất việc"], ["lương","tiền lương"],
    ["đóng","mức đóng"], ["hưu","nghỉ hưu"]
  ];
  let bonus = 0;
  for (const [x, y] of domainPairs) {
    if ((a.toLowerCase().includes(x) && b.toLowerCase().includes(y)) ||
        (a.toLowerCase().includes(y) && b.toLowerCase().includes(x))) bonus += 0.12;
  }
  return Math.min(0.99, jaccard * 2.2 + bonus + Math.random() * 0.04);
}

// ─── Mock RAG retrieval ───────────────────────────────────────────────────────
function mockRetrieve(query, docs, strategy, topK, filterType) {
  const filtered = filterType === "all" ? docs : docs.filter(d => d.law_type === filterType);
  const chunks = [];
  for (const doc of filtered) {
    const sentences = doc.excerpt.split(/(?<=[.!?])\s+/);
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      if (s.length > 20) {
        chunks.push({ content: s, doc_id: doc.id, doc_name: doc.name, law_type: doc.law_type, law_number: doc.law_number });
      }
    }
    // add synthetic law chunks
    chunks.push(...getSyntheticChunks(doc, strategy));
  }
  const scored = chunks.map(c => ({ ...c, score: mockSimilarity(query, c.content) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function getSyntheticChunks(doc, strategy) {
  const base = [
    {
      bhxh: "Mức đóng bảo hiểm xã hội bắt buộc của người lao động là 8% mức tiền lương tháng vào quỹ hưu trí và tử tuất.",
      lao_dong: "Thời gian thử việc không quá 60 ngày đối với công việc có chức danh nghề cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên.",
      viec_lam: "Người lao động đóng bảo hiểm thất nghiệp đủ 12 tháng trong 24 tháng trước khi chấm dứt hợp đồng lao động được hưởng trợ cấp thất nghiệp.",
    },
    {
      bhxh: "Người sử dụng lao động đóng bảo hiểm xã hội bắt buộc vào quỹ ốm đau và thai sản là 3% mức tiền lương tháng của người lao động.",
      lao_dong: "Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ hằng năm, hưởng nguyên lương theo hợp đồng lao động 12 ngày làm việc.",
      viec_lam: "Mức trợ cấp thất nghiệp hằng tháng bằng 60% mức bình quân tiền lương tháng đóng bảo hiểm thất nghiệp của 06 tháng liền kề trước khi thất nghiệp.",
    },
    {
      bhxh: "Người tham gia bảo hiểm xã hội tự nguyện được hưởng chế độ hưu trí và tử tuất theo quy định của Luật Bảo hiểm xã hội.",
      lao_dong: "Tuổi nghỉ hưu của người lao động trong điều kiện lao động bình thường là đủ 60 tuổi 3 tháng đối với lao động nam, đủ 55 tuổi 4 tháng đối với lao động nữ vào năm 2025.",
      viec_lam: "Thời gian hưởng trợ cấp thất nghiệp được tính theo số tháng đóng bảo hiểm thất nghiệp, cứ đóng đủ 12 tháng đến đủ 36 tháng thì được hưởng 03 tháng trợ cấp.",
    },
  ];
  const chunks = [];
  for (const entry of base) {
    const content = entry[doc.law_type];
    if (content) {
      chunks.push({ content, doc_id: doc.id, doc_name: doc.name, law_type: doc.law_type, law_number: doc.law_number });
    }
  }
  return chunks;
}

function mockAnswer(query, results) {
  if (!results.length) return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.";
  const top = results[0].content;
  return `Dựa trên văn bản pháp luật (${results[0].doc_name} — ${results[0].law_number}):\n\n${top}`;
}

function mockChunkStats(doc, strategy, chunkSize) {
  const n = Math.ceil(doc.chars / (chunkSize * (strategy === "recursive" ? 0.9 : strategy === "sentence" ? 1.1 : 1)));
  return {
    fixed_size:  { count: Math.ceil(doc.chars / chunkSize), avg_length: chunkSize - 30 },
    by_sentences: { count: Math.ceil(doc.chars / (chunkSize * 1.1)), avg_length: chunkSize + 40 },
    recursive:   { count: Math.ceil(doc.chars / (chunkSize * 0.9)), avg_length: chunkSize - 10 },
  };
}

// ─── Score colour helper ──────────────────────────────────────────────────────
function scoreClass(s) { return s > 0.6 ? "high" : s > 0.3 ? "mid" : "low"; }

// ─── Components ──────────────────────────────────────────────────────────────
function SimilarityTab() {
  const [pairs, setPairs] = useState([
    { a: "Người lao động đóng bảo hiểm xã hội bắt buộc bằng 8% mức tiền lương tháng.", b: "Mức đóng BHXH của người lao động là 8% tiền lương hàng tháng vào quỹ hưu trí.", score: null },
    { a: "Người lao động có quyền đơn phương chấm dứt hợp đồng khi bị ngược đãi.", b: "Quỹ bảo hiểm thất nghiệp được quản lý tập trung, thống nhất, công khai.", score: null },
    { a: "", b: "", score: null },
  ]);

  const compute = (i) => {
    setPairs(prev => prev.map((p, idx) => idx === i ? { ...p, score: mockSimilarity(p.a, p.b) } : p));
  };

  const update = (i, field, val) => {
    setPairs(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val, score: null } : p));
  };

  const addPair = () => setPairs(p => [...p, { a: "", b: "", score: null }]);

  const computeAll = () => {
    setPairs(prev => prev.map(p => ({ ...p, score: mockSimilarity(p.a, p.b) })));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Cosine Similarity Tester</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>Ex 3.3 — Dự đoán trước khi chạy, so sánh kết quả thực tế</div>
        </div>
        <button className="btn-sm" onClick={computeAll}>▶ RUN ALL</button>
      </div>

      {pairs.map((p, i) => (
        <div key={i} className="similarity-row" style={{ animationDelay: `${i * 0.06}s` }}>
          <textarea className="sim-input" rows={2} placeholder="Câu A..." value={p.a} onChange={e => update(i, "a", e.target.value)} />
          <div className="sim-vs">VS</div>
          <textarea className="sim-input" rows={2} placeholder="Câu B..." value={p.b} onChange={e => update(i, "b", e.target.value)} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div className={`sim-score ${p.score !== null ? scoreClass(p.score) : ""}`}>
              {p.score !== null ? p.score.toFixed(3) : "—"}
            </div>
            <button className="btn-sm" onClick={() => compute(i)}>RUN</button>
          </div>
        </div>
      ))}

      <button className="add-pair-btn" onClick={addPair}>+ ADD PAIR</button>

      <div style={{ marginTop: 28, padding: 18, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4 }}>
        <div className="section-label">Thang đánh giá</div>
        <div style={{ display: "flex", gap: 24, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
          <span><span style={{ color: "var(--accent)" }}>▲ 0.6–1.0</span> — HIGH (cùng ý nghĩa)</span>
          <span><span style={{ color: "#ff9f43" }}>◆ 0.3–0.6</span> — MID (liên quan)</span>
          <span><span style={{ color: "var(--accent3)" }}>▼ 0.0–0.3</span> — LOW (khác chủ đề)</span>
        </div>
      </div>
    </div>
  );
}

function ChunkingTab({ selectedDoc, strategy, chunkSize, setStrategy, setChunkSize }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (selectedDoc) {
      setStats(mockChunkStats(selectedDoc, strategy, chunkSize));
    }
  }, [selectedDoc, strategy, chunkSize]);

  if (!selectedDoc) return (
    <div className="empty">
      <div className="empty-icon">⬡</div>
      <div className="empty-title">Chọn tài liệu từ sidebar</div>
      <div className="empty-sub">để xem kết quả chunking comparison</div>
    </div>
  );

  const strategies = stats ? [
    { key: "fixed_size", label: "FixedSize", color: "var(--accent)" },
    { key: "by_sentences", label: "Sentence", color: "var(--accent2)" },
    { key: "recursive", label: "Recursive", color: "#ff9f43" },
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedDoc.name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>{selectedDoc.chars.toLocaleString()} ký tự · {selectedDoc.law_number}</div>
      </div>

      <div className="chunk-grid">
        <div className="stat-card">
          <div className="stat-val">{(selectedDoc.chars / 1000).toFixed(1)}K</div>
          <div className="stat-label">Tổng ký tự</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{chunkSize}</div>
          <div className="stat-label">Chunk size</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: "var(--accent2)" }}>
            {stats ? stats[strategy === "fixed" ? "fixed_size" : strategy === "sentence" ? "by_sentences" : "recursive"]?.count ?? "—" : "—"}
          </div>
          <div className="stat-label">Chunks ({["fixed","sentence","recursive"].find(s => s === strategy) || "fixed"})</div>
        </div>
      </div>

      <div className="section-label">ChunkingStrategyComparator().compare()</div>

      {stats && (
        <div className="strategy-compare">
          {strategies.map(({ key, label, color }) => (
            <div key={key} className="strategy-card" style={{ borderColor: strategy === key.replace("fixed_size","fixed").replace("by_sentences","sentence") ? color : undefined }}>
              <div className="strategy-name" style={{ color }}>{label}</div>
              <div className="strategy-stat">
                <span>Chunks</span>
                <span>{stats[key].count}</span>
              </div>
              <div className="strategy-stat">
                <span>Avg length</span>
                <span>{stats[key].avg_length.toFixed(0)} chars</span>
              </div>
              <div className="strategy-stat">
                <span>Coverage</span>
                <span>{((stats[key].count * stats[key].avg_length / selectedDoc.chars) * 100).toFixed(0)}%</span>
              </div>
              <div className="chunk-preview">
                {[1,2,3].map(n => (
                  <div key={n} className="chunk-item">
                    chunk_{n.toString().padStart(3,"0")} · {stats[key].avg_length.toFixed(0)} chars
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("query");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [strategy, setStrategy] = useState("recursive");
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState(500);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [toast, setToast] = useState("");
  const textareaRef = useRef();

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setAnswer("");
    setExpandedCards({});
    await new Promise(r => setTimeout(r, 600));
    const docs = selectedDoc ? [selectedDoc] : DOCUMENTS;
    const res = mockRetrieve(query, docs, strategy, topK, filterType);
    setResults(res);
    setAnswer(mockAnswer(query, res));
    setLoading(false);
  }, [query, selectedDoc, strategy, topK, filterType]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleQuery();
  };

  const rankClass = (i) => i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "";

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-logo">
            <div className="dot" />
            RAG_LAB / DAY-07
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="topbar-badge">EMBEDDING & VECTOR STORE</div>
            <div className="topbar-badge" style={{ color: "var(--accent)", borderColor: "rgba(0,255,157,0.3)" }}>
              {DOCUMENTS.length} DOCS LOADED
            </div>
          </div>
        </div>

        <div className="main-layout">
          {/* Sidebar */}
          <div className="sidebar">
            <div>
              <div className="section-label">Documents</div>
              {DOCUMENTS.map(doc => (
                <div
                  key={doc.id}
                  className={`doc-card ${selectedDoc?.id === doc.id ? "active" : ""}`}
                  onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                >
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-meta">
                    <span>{doc.chars.toLocaleString()} chars</span>
                    <span>{doc.year}</span>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="tag">{doc.law_type}</span>
                    <span className="tag" style={{ color: "var(--text-dim)", fontSize: 9 }}>{doc.law_number}</span>
                  </div>
                </div>
              ))}
              {selectedDoc && (
                <button className="btn-sm" style={{ width: "100%", marginTop: 4 }} onClick={() => setSelectedDoc(null)}>
                  CLEAR SELECTION
                </button>
              )}
            </div>

            <div>
              <div className="section-label">Config</div>
              <div className="config-row">
                <div className="config-label">CHUNKING STRATEGY</div>
                <select className="config-select" value={strategy} onChange={e => setStrategy(e.target.value)}>
                  <option value="fixed">FixedSizeChunker</option>
                  <option value="sentence">SentenceChunker</option>
                  <option value="recursive">RecursiveChunker</option>
                </select>
              </div>
              <div className="config-row">
                <div className="config-label">CHUNK SIZE — {chunkSize}</div>
                <div className="slider-row">
                  <input type="range" min="100" max="1000" step="50" value={chunkSize}
                    onChange={e => setChunkSize(+e.target.value)} />
                  <span className="slider-val">{chunkSize}</span>
                </div>
              </div>
              <div className="config-row">
                <div className="config-label">TOP-K — {topK}</div>
                <div className="slider-row">
                  <input type="range" min="1" max="10" step="1" value={topK}
                    onChange={e => setTopK(+e.target.value)} />
                  <span className="slider-val">{topK}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="section-label">Benchmark Queries</div>
              {BENCHMARK_QUERIES.map((bq, i) => (
                <div key={i} className="doc-card" style={{ cursor: "pointer" }}
                  onClick={() => { setQuery(bq.query); setFilterType(bq.filter); setTab("query"); showToast("Query loaded ✓"); }}>
                  <div className="doc-name" style={{ whiteSpace: "normal", fontSize: 11 }}>{bq.query}</div>
                  <div className="doc-meta" style={{ marginTop: 4 }}>
                    <span className="tag">{bq.filter}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="content">
            <div className="tabbar">
              {[
                { id: "query", label: "Query / RAG" },
                { id: "chunking", label: "Chunking" },
                { id: "similarity", label: "Similarity" },
              ].map(t => (
                <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                  {t.label}
                </div>
              ))}
            </div>

            <div className="tab-content">
              {tab === "query" && (
                <>
                  <div className="query-box">
                    <textarea
                      ref={textareaRef}
                      className="query-input"
                      placeholder="Nhập câu hỏi pháp luật... (Ctrl+Enter để chạy)"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                    />
                    <div className="query-footer">
                      <div className="filter-row">
                        <span className="filter-tag">FILTER:</span>
                        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                          <option value="all">All documents</option>
                          <option value="bhxh">bhxh</option>
                          <option value="lao_dong">lao_dong</option>
                          <option value="viec_lam">viec_lam</option>
                        </select>
                      </div>
                      <button className="btn-run" onClick={handleQuery} disabled={loading || !query.trim()}>
                        {loading ? "SEARCHING..." : "▶ RUN QUERY"}
                      </button>
                    </div>
                  </div>

                  {loading && <div className="loading-bar" />}

                  {answer && (
                    <div className="answer-box">
                      <div className="answer-label">◆ Agent Answer</div>
                      <div className="answer-text">{answer}</div>
                    </div>
                  )}

                  {results.length > 0 && (
                    <>
                      <div className="results-header">
                        <div className="section-label" style={{ margin: 0 }}>Retrieved Chunks</div>
                        <div className="results-count">TOP-{results.length} · strategy: {strategy} · filter: {filterType}</div>
                      </div>
                      {results.map((r, i) => (
                        <div key={i} className="result-card">
                          <div className="result-rank">
                            <div className={`rank-badge ${rankClass(i)}`}>#{i+1}</div>
                            <div className="score-bar-wrap">
                              <div className="score-bar" style={{ width: `${Math.min(100, r.score * 100)}%` }} />
                            </div>
                            <div className="score-val">{r.score.toFixed(4)}</div>
                          </div>
                          <div className="result-source">
                            <span>📄 {r.doc_name}</span>
                            <span className="tag">{r.law_type}</span>
                            <span>{r.law_number}</span>
                          </div>
                          <div className={`result-text ${expandedCards[i] ? "expanded" : ""}`}>
                            {r.content}
                          </div>
                          <button className="expand-btn" onClick={() => setExpandedCards(p => ({ ...p, [i]: !p[i] }))}>
                            {expandedCards[i] ? "▲ thu gọn" : "▼ xem thêm"}
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {!loading && results.length === 0 && !answer && (
                    <div className="empty">
                      <div className="empty-icon">◈</div>
                      <div className="empty-title">Chưa có kết quả</div>
                      <div className="empty-sub">
                        Nhập câu hỏi hoặc click vào benchmark query bên trái<br/>
                        Hệ thống sẽ retrieve top-{topK} chunks từ vector store
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === "chunking" && (
                <ChunkingTab
                  selectedDoc={selectedDoc}
                  strategy={strategy}
                  chunkSize={chunkSize}
                  setStrategy={setStrategy}
                  setChunkSize={setChunkSize}
                />
              )}

              {tab === "similarity" && <SimilarityTab />}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
