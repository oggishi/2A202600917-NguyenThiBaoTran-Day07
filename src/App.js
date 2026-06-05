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
    grid-template-columns: 300px 1fr;
    flex: 1;
    min-height: 0;
  }

  .sidebar {
    border-right: 1px solid var(--border);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
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

  .doc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 6px;
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

  .doc-card:hover::before, .doc-card.active::before { background: var(--accent); }
  .doc-card:hover { border-color: rgba(0,255,157,0.2); background: var(--surface2); }
  .doc-card.active { border-color: rgba(0,255,157,0.3); background: rgba(0,255,157,0.04); }
  .doc-card.active .doc-name { color: var(--accent); }

  .doc-name {
    font-family: var(--mono);
    font-size: 11px;
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

  .config-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }

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
    padding: 7px 9px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  .config-select:focus, .config-input:focus { border-color: var(--accent2); }
  option { background: var(--surface2); }

  .slider-row { display: flex; align-items: center; gap: 10px; }

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

  .content { display: flex; flex-direction: column; overflow: hidden; }

  .tabbar {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: rgba(14,14,26,0.4);
    padding: 0 24px;
    overflow-x: auto;
  }

  .tab {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    padding: 14px 18px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .tab:hover { color: var(--text); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab.highlight { color: var(--accent2); }
  .tab.highlight.active { color: var(--accent2); border-bottom-color: var(--accent2); }

  .tab-content { flex: 1; overflow-y: auto; padding: 28px; }

  .query-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 18px;
    margin-bottom: 20px;
    position: relative;
  }

  .query-input {
    background: transparent;
    border: none;
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    font-weight: 600;
    width: 100%;
    outline: none;
    resize: none;
    line-height: 1.5;
    min-height: 44px;
  }

  .query-input::placeholder { color: var(--text-dim); }

  .query-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-row { display: flex; align-items: center; gap: 10px; }

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
    letter-spacing: 0.1em;
    padding: 9px 22px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    white-space: nowrap;
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

  .btn-run.accent2 { background: var(--accent2); color: #fff; }
  .btn-run.accent2:hover { background: #9177ff; box-shadow: 0 4px 20px rgba(123,97,255,0.3); }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
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
    padding: 14px 16px;
    margin-bottom: 10px;
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
  .result-card:hover { border-color: rgba(123,97,255,0.3); }

  .result-rank { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }

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
    max-height: 110px;
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

  .answer-box {
    background: linear-gradient(135deg, rgba(0,255,157,0.04), rgba(123,97,255,0.04));
    border: 1px solid rgba(0,255,157,0.2);
    border-radius: 4px;
    padding: 18px 20px;
    margin-bottom: 24px;
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
    white-space: pre-line;
  }

  .loading-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--accent2), var(--accent), var(--accent2));
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;
    border-radius: 2px;
    margin-bottom: 20px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .chunk-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    text-align: center;
  }

  .stat-val {
    font-family: var(--mono);
    font-size: 26px;
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

  .strategy-compare { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

  .strategy-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px;
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

  .chunk-preview { margin-top: 10px; max-height: 180px; overflow-y: auto; }

  .chunk-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 7px 9px;
    margin-bottom: 5px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    line-height: 1.5;
    cursor: pointer;
    transition: border-color 0.1s;
    word-break: break-word;
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

  .btn-sm:hover { border-color: var(--accent2); color: var(--accent2); }

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

  /* ── Compare tab ── */
  .compare-strategy-header {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 8px;
  }

  .compare-col-label {
    border-radius: 4px 4px 0 0;
    padding: 10px 14px;
    text-align: center;
  }

  .compare-results {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    animation: fadeIn 0.4s ease;
  }

  .compare-col {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0 0 4px 4px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .compare-answer {
    background: var(--surface2);
    border-radius: 3px;
    padding: 10px 12px;
  }

  .compare-chunk {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 8px 10px;
    transition: border-color 0.1s;
  }

  .compare-chunk:hover { border-color: var(--accent2); }

  .query-history-item {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-mid);
    padding: 8px 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 3px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    color: var(--text-dim);
    text-align: center;
  }

  .empty-icon { font-size: 36px; margin-bottom: 14px; opacity: 0.4; }

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

// ─── Document metadata ─────────────────────────────────────────────────────────
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

// ─── Full document texts for real chunking demo ───────────────────────────────
const DOCUMENT_FULL_TEXTS = {
  luatbhxh: `LUẬT BẢO HIỂM XÃ HỘI (Số 41/2024/QH15)

Điều 1. Phạm vi điều chỉnh
Luật này quy định về quyền, trách nhiệm của cơ quan, tổ chức, cá nhân đối với bảo hiểm xã hội và tổ chức thực hiện bảo hiểm xã hội; trợ cấp hưu trí xã hội; đăng ký tham gia và quản lý thu, đóng bảo hiểm xã hội; các chế độ, chính sách bảo hiểm xã hội bắt buộc, bảo hiểm xã hội tự nguyện; quỹ bảo hiểm xã hội.

Điều 3. Giải thích từ ngữ
Bảo hiểm xã hội là sự bảo đảm thay thế hoặc bù đắp một phần thu nhập của người tham gia bảo hiểm xã hội khi họ bị giảm hoặc mất thu nhập do ốm đau, thai sản, tai nạn lao động, bệnh nghề nghiệp, khi nghỉ hưu hoặc chết, trên cơ sở đóng vào quỹ bảo hiểm xã hội hoặc do ngân sách nhà nước bảo đảm.
Bảo hiểm xã hội bắt buộc là loại hình bảo hiểm xã hội do Nhà nước tổ chức mà người lao động, người sử dụng lao động thuộc đối tượng tham gia bảo hiểm xã hội bắt buộc phải tham gia.
Bảo hiểm xã hội tự nguyện là loại hình bảo hiểm xã hội do Nhà nước tổ chức mà công dân Việt Nam tự nguyện tham gia và được lựa chọn mức đóng phù hợp với thu nhập.

Điều 32. Tỷ lệ đóng bảo hiểm xã hội
Tỷ lệ đóng bảo hiểm xã hội bắt buộc bao gồm: 3% tiền lương làm căn cứ đóng bảo hiểm xã hội vào quỹ ốm đau và thai sản; 22% tiền lương làm căn cứ đóng bảo hiểm xã hội vào quỹ hưu trí và tử tuất.
Tỷ lệ đóng bảo hiểm xã hội tự nguyện bằng 22% thu nhập làm căn cứ đóng bảo hiểm xã hội vào quỹ hưu trí và tử tuất.

Điều 33. Mức đóng bảo hiểm xã hội bắt buộc của người lao động
Mức đóng hằng tháng bằng 8% tiền lương làm căn cứ đóng bảo hiểm xã hội bắt buộc vào quỹ hưu trí và tử tuất.
Người sử dụng lao động đóng vào quỹ ốm đau và thai sản là 3% mức tiền lương tháng của người lao động, và đóng vào quỹ hưu trí và tử tuất là 14% mức tiền lương tháng.
Người tham gia bảo hiểm xã hội tự nguyện được hưởng chế độ hưu trí và tử tuất theo quy định của Luật Bảo hiểm xã hội khi đủ điều kiện về tuổi và số năm đóng bảo hiểm xã hội.`,

  luatld: `BỘ LUẬT LAO ĐỘNG (Số 45/2019/QH14)

Điều 1. Phạm vi điều chỉnh
Bộ luật Lao động quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, tổ chức đại diện người lao động trong quan hệ lao động và các quan hệ khác liên quan trực tiếp đến quan hệ lao động; quản lý nhà nước về lao động.

Điều 25. Thử việc
Người sử dụng lao động và người lao động có thể thỏa thuận thử việc, trừ trường hợp hợp đồng lao động có thời hạn dưới 01 tháng.
Thời gian thử việc không quá 180 ngày đối với chức vụ quản lý doanh nghiệp theo quy định của Luật Doanh nghiệp, Luật Quản lý, sử dụng vốn nhà nước đầu tư vào sản xuất, kinh doanh tại doanh nghiệp.
Thời gian thử việc không quá 60 ngày đối với công việc có chức danh nghề cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên.
Thời gian thử việc không quá 30 ngày đối với công việc có chức danh nghề cần trình độ chuyên môn kỹ thuật trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ.
Thời gian thử việc không quá 6 ngày làm việc đối với công việc khác.

Điều 113. Nghỉ hằng năm
Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ hằng năm, hưởng nguyên lương theo hợp đồng lao động như sau: 12 ngày làm việc đối với người làm công việc trong điều kiện bình thường; 14 ngày làm việc đối với người làm công việc nặng nhọc, độc hại, nguy hiểm hoặc người làm việc ở những nơi có điều kiện sinh sống khắc nghiệt; 16 ngày làm việc đối với người làm công việc đặc biệt nặng nhọc, độc hại, nguy hiểm hoặc người làm việc ở những nơi có điều kiện sinh sống đặc biệt khắc nghiệt.

Điều 169. Tuổi nghỉ hưu
Tuổi nghỉ hưu của người lao động trong điều kiện lao động bình thường: lao động nam đủ 62 tuổi vào năm 2028; lao động nữ đủ 60 tuổi vào năm 2035.
Lộ trình điều chỉnh tuổi nghỉ hưu: từ năm 2021, tuổi nghỉ hưu của lao động nam là đủ 60 tuổi 3 tháng và tăng thêm 3 tháng mỗi năm; tuổi nghỉ hưu của lao động nữ là đủ 55 tuổi 4 tháng và tăng thêm 4 tháng mỗi năm.
Năm 2025, tuổi nghỉ hưu của lao động nam là đủ 60 tuổi 3 tháng, lao động nữ là đủ 55 tuổi 4 tháng.`,

  luatvieclam: `LUẬT VIỆC LÀM (Số 74/2025/QH15)

Điều 1. Phạm vi điều chỉnh
Luật này quy định chính sách hỗ trợ tạo việc làm, đăng ký lao động, hệ thống thông tin thị trường lao động, phát triển kỹ năng nghề, dịch vụ việc làm, bảo hiểm thất nghiệp và quản lý nhà nước về việc làm.

Điều 4. Bảo hiểm thất nghiệp
Bảo hiểm thất nghiệp là loại hình bảo hiểm bắt buộc do Nhà nước tổ chức mà người lao động, người sử dụng lao động tham gia để hỗ trợ duy trì việc làm, đào tạo, tư vấn, giới thiệu việc làm và bù đắp một phần thu nhập cho người lao động khi bị mất việc làm, trên cơ sở đóng vào Quỹ bảo hiểm thất nghiệp.

Điều 45. Điều kiện hưởng trợ cấp thất nghiệp
Người lao động được hưởng trợ cấp thất nghiệp khi có đủ các điều kiện sau đây:
Thứ nhất, đã chấm dứt hợp đồng lao động hoặc hợp đồng làm việc, trừ các trường hợp người lao động đơn phương chấm dứt hợp đồng lao động trái pháp luật.
Thứ hai, đã đóng bảo hiểm thất nghiệp từ đủ 12 tháng trở lên trong thời gian 24 tháng trước khi chấm dứt hợp đồng lao động đối với hợp đồng lao động xác định thời hạn và hợp đồng lao động không xác định thời hạn.
Thứ ba, đã nộp hồ sơ hưởng trợ cấp thất nghiệp tại trung tâm dịch vụ việc làm trong thời hạn 03 tháng kể từ ngày chấm dứt hợp đồng lao động hoặc hợp đồng làm việc.
Thứ tư, chưa tìm được việc làm sau 15 ngày kể từ ngày nộp hồ sơ.

Điều 49. Mức và thời gian hưởng trợ cấp thất nghiệp
Mức trợ cấp thất nghiệp hằng tháng bằng 60% mức bình quân tiền lương tháng đóng bảo hiểm thất nghiệp của 06 tháng liền kề trước khi thất nghiệp, tối đa không quá 05 lần mức lương tối thiểu vùng theo quy định của Chính phủ.
Thời gian hưởng trợ cấp thất nghiệp được tính theo số tháng đóng bảo hiểm thất nghiệp: đóng đủ 12 tháng đến đủ 36 tháng thì được hưởng 03 tháng trợ cấp; sau đó, cứ đóng đủ thêm 12 tháng thì được hưởng thêm 01 tháng trợ cấp, tối đa không quá 12 tháng.`,
};

// ─── Real JS chunking algorithms (mirrors Python implementations) ─────────────
function fixedSizeChunk(text, chunkSize = 500, overlap = 50) {
  if (!text) return [];
  if (text.length <= chunkSize) return [text];
  const step = chunkSize - overlap;
  const chunks = [];
  for (let start = 0; start < text.length; start += step) {
    chunks.push(text.slice(start, start + chunkSize));
    if (start + chunkSize >= text.length) break;
  }
  return chunks;
}

function sentenceChunk(text, maxPerChunk = 3) {
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (!sentences.length) return [];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += maxPerChunk) {
    chunks.push(sentences.slice(i, i + maxPerChunk).join(' '));
  }
  return chunks;
}

function recursiveChunk(text, separators = ['\n\n', '\n', '. ', ' ', ''], chunkSize = 500) {
  if (!text || text.length <= chunkSize) return text ? [text] : [];
  if (!separators.length) {
    return Array.from({ length: Math.ceil(text.length / chunkSize) }, (_, i) =>
      text.slice(i * chunkSize, (i + 1) * chunkSize)
    );
  }
  const [sep, ...rest] = separators;
  if (sep === '') {
    return Array.from({ length: Math.ceil(text.length / chunkSize) }, (_, i) =>
      text.slice(i * chunkSize, (i + 1) * chunkSize)
    );
  }
  const pieces = text.split(sep);
  const result = [];
  let current = '';
  for (let i = 0; i < pieces.length; i++) {
    const prefix = i > 0 && current ? sep : '';
    const candidate = current + prefix + pieces[i];
    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current) result.push(current);
      if (pieces[i].length > chunkSize) {
        result.push(...recursiveChunk(pieces[i], rest, chunkSize));
        current = '';
      } else {
        current = pieces[i];
      }
    }
  }
  if (current) result.push(current);
  return result.length ? result : [text];
}

// ─── Retrieval via Jaccard similarity ─────────────────────────────────────────
function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .split(/[\s.,;:!?()[\]\-—/\n\t]+/)
      .filter(w => w.length > 2)
  );
}

function jaccardScore(a, b) {
  const setA = tokenize(a);
  const setB = tokenize(b);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function buildChunks(docs, strategyKey, chunkSize, filterType) {
  const filtered = filterType === 'all' ? docs : docs.filter(d => d.law_type === filterType);
  const chunks = [];
  for (const doc of filtered) {
    const text = DOCUMENT_FULL_TEXTS[doc.id] || doc.excerpt;
    let pieces = [];
    if (strategyKey === 'fixed') pieces = fixedSizeChunk(text, chunkSize, Math.max(20, Math.floor(chunkSize * 0.1)));
    else if (strategyKey === 'sentence') pieces = sentenceChunk(text, 3);
    else pieces = recursiveChunk(text, undefined, chunkSize);
    for (const p of pieces) {
      if (p.trim().length > 10) {
        chunks.push({ content: p.trim(), doc_id: doc.id, doc_name: doc.name, law_type: doc.law_type, law_number: doc.law_number });
      }
    }
  }
  return chunks;
}

function retrieveReal(query, chunks, topK) {
  return chunks
    .map(c => ({ ...c, score: jaccardScore(query, c.content) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function generateAnswer(query, results) {
  if (!results.length) return 'Không tìm thấy thông tin liên quan.';
  const top = results[0];
  if (top.score < 0.02) return 'Không đủ thông tin để trả lời câu hỏi này dựa trên văn bản đã tải.';
  return `Theo ${top.doc_name} (${top.law_number}):\n\n${top.content}`;
}

// ─── Mock functions (Query/RAG tab) ───────────────────────────────────────────
function mockSimilarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
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
  const top = results[0];
  return `Dựa trên văn bản pháp luật (${top.doc_name} — ${top.law_number}):\n\n${top.content}`;
}

function scoreClass(s) { return s > 0.6 ? "high" : s > 0.3 ? "mid" : "low"; }

// ─── Strategy config ───────────────────────────────────────────────────────────
const STRATEGIES = [
  { key: 'fixed',     label: 'FixedSize',  desc: 'chunk_size=500, overlap=50', color: 'var(--accent)' },
  { key: 'sentence',  label: 'Sentence',   desc: 'max_sentences=3',            color: 'var(--accent2)' },
  { key: 'recursive', label: 'Recursive',  desc: 'chunk_size=500',             color: '#ff9f43' },
];

// ─── Similarity tab ────────────────────────────────────────────────────────────
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
  const computeAll = () => setPairs(prev => prev.map(p => ({ ...p, score: mockSimilarity(p.a, p.b) })));

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

      <div style={{ marginTop: 28, padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4 }}>
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

// ─── Chunking tab (real chunking) ─────────────────────────────────────────────
function ChunkingTab({ selectedDoc, strategy, chunkSize, setStrategy, setChunkSize }) {
  const [realChunks, setRealChunks] = useState(null);

  useEffect(() => {
    if (!selectedDoc) { setRealChunks(null); return; }
    const text = DOCUMENT_FULL_TEXTS[selectedDoc.id] || selectedDoc.excerpt;
    setRealChunks({
      fixed_size: fixedSizeChunk(text, chunkSize, Math.max(20, Math.floor(chunkSize * 0.1))),
      by_sentences: sentenceChunk(text, 3),
      recursive: recursiveChunk(text, undefined, chunkSize),
    });
  }, [selectedDoc, chunkSize]);

  if (!selectedDoc) return (
    <div className="empty">
      <div className="empty-icon">⬡</div>
      <div className="empty-title">Chọn tài liệu từ sidebar</div>
      <div className="empty-sub">để xem kết quả chunking comparison</div>
    </div>
  );

  const strategies = realChunks ? [
    { key: "fixed_size",   label: "FixedSize",  color: "var(--accent)" },
    { key: "by_sentences", label: "Sentence",   color: "var(--accent2)" },
    { key: "recursive",    label: "Recursive",  color: "#ff9f43" },
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedDoc.name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>
          {selectedDoc.chars.toLocaleString()} ký tự · {selectedDoc.law_number}
        </div>
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
            {realChunks ? realChunks.fixed_size.length : '—'}
          </div>
          <div className="stat-label">Chunks (demo text)</div>
        </div>
      </div>

      <div className="section-label">ChunkingStrategyComparator().compare() — demo text</div>

      {realChunks && (
        <div className="strategy-compare">
          {strategies.map(({ key, label, color }) => {
            const chunks = realChunks[key];
            const avgLen = chunks.length
              ? Math.round(chunks.reduce((s, c) => s + c.length, 0) / chunks.length)
              : 0;
            return (
              <div key={key} className="strategy-card">
                <div className="strategy-name" style={{ color }}>{label}</div>
                <div className="strategy-stat"><span>Chunks</span><span>{chunks.length}</span></div>
                <div className="strategy-stat"><span>Avg length</span><span>{avgLen} chars</span></div>
                <div className="strategy-stat">
                  <span>Min / Max</span>
                  <span>{Math.min(...chunks.map(c => c.length))} / {Math.max(...chunks.map(c => c.length))}</span>
                </div>
                <div className="chunk-preview">
                  {chunks.slice(0, 5).map((c, n) => (
                    <div key={n} className="chunk-item" title={c}>
                      <span style={{ color, marginRight: 4 }}>#{n + 1}</span>
                      {c.slice(0, 60)}{c.length > 60 ? '…' : ''}
                    </div>
                  ))}
                  {chunks.length > 5 && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: 4 }}>
                      +{chunks.length - 5} more chunks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Compare tab ───────────────────────────────────────────────────────────────
function CompareTab() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState(500);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const run = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));

    const item = { query: query.trim(), ts: Date.now(), strategies: {} };
    for (const { key } of STRATEGIES) {
      const chunks = buildChunks(DOCUMENTS, key, chunkSize, filterType);
      const results = retrieveReal(item.query, chunks, topK);
      const avgLen = chunks.length
        ? Math.round(chunks.reduce((s, c) => s + c.content.length, 0) / chunks.length)
        : 0;
      item.strategies[key] = {
        totalChunks: chunks.length,
        avgLen,
        results,
        answer: generateAnswer(item.query, results),
      };
    }
    setHistory(prev => [item, ...prev]);
    setLoading(false);
  }, [query, filterType, topK, chunkSize]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
  };

  const loadQuery = (q, f) => {
    setQuery(q);
    setFilterType(f);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div>
      {/* Controls */}
      <div className="query-box" style={{ marginBottom: 16 }}>
        <textarea
          ref={inputRef}
          className="query-input"
          placeholder="Nhập câu hỏi pháp luật... (Ctrl+Enter để so sánh)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
        />
        <div className="query-footer">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="filter-tag">FILTER:</span>
            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All docs</option>
              <option value="bhxh">bhxh</option>
              <option value="lao_dong">lao_dong</option>
              <option value="viec_lam">viec_lam</option>
            </select>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>CHUNK={chunkSize}</span>
            <input type="range" min="100" max="800" step="100" value={chunkSize}
              onChange={e => setChunkSize(+e.target.value)}
              style={{ width: 80, height: 4, accentColor: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>TOP-K={topK}</span>
            <input type="range" min="1" max="5" step="1" value={topK}
              onChange={e => setTopK(+e.target.value)}
              style={{ width: 60, height: 4, accentColor: 'var(--accent2)' }} />
          </div>
          <button className="btn-run accent2" onClick={run} disabled={loading || !query.trim()}>
            {loading ? 'COMPARING…' : '⚡ COMPARE ALL'}
          </button>
        </div>
      </div>

      {/* Strategy headers */}
      <div className="compare-strategy-header">
        {STRATEGIES.map(({ key, label, desc, color }) => (
          <div key={key} className="compare-col-label" style={{
            background: 'var(--surface)',
            border: `1px solid var(--border)`,
            borderTop: `3px solid ${color}`,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color }}>{label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>

      {loading && <div className="loading-bar" />}

      {/* Empty state */}
      {history.length === 0 && !loading && (
        <div className="empty" style={{ paddingTop: 32 }}>
          <div className="empty-icon">⚡</div>
          <div className="empty-title">So sánh 3 chiến lược Chunking</div>
          <div className="empty-sub">
            Nhập câu hỏi và nhấn COMPARE ALL<br/>
            Xem cùng query cho kết quả khác nhau với mỗi strategy<br/>
            <span style={{ color: 'var(--accent2)', marginTop: 8, display: 'block' }}>
              Gợi ý: thử các Benchmark Queries bên sidebar
            </span>
          </div>
          {/* Quick launch benchmark queries */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 500 }}>
            {BENCHMARK_QUERIES.map((bq, i) => (
              <button key={i} onClick={() => loadQuery(bq.query, bq.filter)} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-mid)', fontFamily: 'var(--mono)', fontSize: 10,
                padding: '8px 12px', borderRadius: 3, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.target.style.borderColor = 'var(--accent2)'}
                onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
              >
                <span style={{ color: 'var(--accent2)', marginRight: 6 }}>Q{i+1}</span>
                {bq.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {history.map((item, hi) => (
        <div key={item.ts} style={{ marginBottom: 28, animation: hi === 0 ? 'fadeIn 0.4s ease' : 'none' }}>
          {/* Query label */}
          <div className="query-history-item">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em', minWidth: 28 }}>
              Q{history.length - hi}
            </span>
            <span style={{ flex: 1 }}>{item.query}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)' }}>
              chunk={chunkSize} · top-{topK}
            </span>
          </div>

          {/* 3-column comparison */}
          <div className="compare-results">
            {STRATEGIES.map(({ key, label, color }) => {
              const s = item.strategies[key];
              return (
                <div key={key} className="compare-col">
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                      color: 'var(--bg)', background: color, padding: '2px 8px', borderRadius: 2,
                    }}>{label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                      {s.totalChunks} chunks
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                      avg {s.avgLen}ch
                    </span>
                  </div>

                  {/* Answer */}
                  <div className="compare-answer" style={{ borderLeft: `2px solid ${color}` }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 9, color, letterSpacing: '0.15em',
                      textTransform: 'uppercase', marginBottom: 6,
                    }}>Answer</div>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text)',
                      lineHeight: 1.65, whiteSpace: 'pre-line',
                    }}>{s.answer}</div>
                  </div>

                  {/* Retrieved chunks */}
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>Retrieved Chunks</div>

                  {s.results.length === 0 && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: 8 }}>
                      No results
                    </div>
                  )}

                  {s.results.map((r, ri) => (
                    <div key={ri} className="compare-chunk">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                          color: ri === 0 ? 'var(--accent)' : ri === 1 ? 'var(--accent2)' : '#ff9f43',
                        }}>#{ri + 1}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>
                          {r.score.toFixed(4)}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text-dim)',
                        lineHeight: 1.5, maxHeight: 90, overflow: 'hidden',
                      }}>{r.content}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 5 }}>
                        {r.doc_name} · {r.law_number}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("compare");
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

  const TABS = [
    { id: "compare",    label: "⚡ Compare",   cls: "highlight" },
    { id: "query",      label: "Query / RAG",  cls: "" },
    { id: "chunking",   label: "Chunking",     cls: "" },
    { id: "similarity", label: "Similarity",   cls: "" },
  ];

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
          <div style={{ display: "flex", gap: 8 }}>
            <div className="topbar-badge">CHUNKING STRATEGIES</div>
            <div className="topbar-badge" style={{ color: "var(--accent)", borderColor: "rgba(0,255,157,0.3)" }}>
              {DOCUMENTS.length} DOCS
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
                  <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <span className="tag">{doc.law_type}</span>
                    <span className="tag" style={{ color: "var(--text-dim)", fontSize: 9 }}>{doc.law_number}</span>
                  </div>
                </div>
              ))}
              {selectedDoc && (
                <button className="btn-sm" style={{ width: "100%", marginTop: 2 }} onClick={() => setSelectedDoc(null)}>
                  CLEAR SELECTION
                </button>
              )}
            </div>

            <div>
              <div className="section-label">Config (Query tab)</div>
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
                  onClick={() => {
                    setQuery(bq.query);
                    setFilterType(bq.filter);
                    setTab("query");
                    showToast("Query loaded ✓");
                  }}>
                  <div className="doc-name" style={{ whiteSpace: "normal", fontSize: 10 }}>{bq.query}</div>
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
              {TABS.map(t => (
                <div
                  key={t.id}
                  className={`tab ${t.cls} ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </div>
              ))}
            </div>

            <div className="tab-content">
              {/* ── Compare tab ── */}
              {tab === "compare" && <CompareTab />}

              {/* ── Query/RAG tab ── */}
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
                        Nhập câu hỏi hoặc click benchmark query bên trái<br/>
                        Hệ thống sẽ retrieve top-{topK} chunks từ vector store
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Chunking tab ── */}
              {tab === "chunking" && (
                <ChunkingTab
                  selectedDoc={selectedDoc}
                  strategy={strategy}
                  chunkSize={chunkSize}
                  setStrategy={setStrategy}
                  setChunkSize={setChunkSize}
                />
              )}

              {/* ── Similarity tab ── */}
              {tab === "similarity" && <SimilarityTab />}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
