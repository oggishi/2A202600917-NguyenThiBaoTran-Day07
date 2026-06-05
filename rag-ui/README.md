# RAG Lab UI — Day 07: Embedding & Vector Store

Web interface để test và demo hệ thống RAG từ Lab 7.  
Deploy tự động lên GitHub Pages qua GitHub Actions.

## 🚀 Deploy lên GitHub Pages

### Bước 1 — Tạo repo mới trên GitHub
```bash
git init
git remote add origin https://github.com/<your-username>/rag-lab-ui.git
```

### Bước 2 — Bật GitHub Pages
1. Vào **Settings → Pages**
2. Source: chọn **"GitHub Actions"**
3. Save

### Bước 3 — Push code
```bash
git add .
git commit -m "feat: add RAG lab UI with GitHub Actions"
git push -u origin main
```

GitHub Actions sẽ tự động:
1. **Build** React app (`npm run build`)
2. **Deploy** lên `https://<your-username>.github.io/rag-lab-ui/`

---

## 🖥️ Chạy local

```bash
cd rag-ui
npm install
npm start
```

Mở http://localhost:3000

---

## 📁 Cấu trúc

```
rag-ui/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── public/
│   └── index.html
├── src/
│   ├── App.js                  # Toàn bộ UI + mock RAG logic
│   └── index.js
└── package.json
```

---

## 🎯 Features

| Tab | Nội dung |
|-----|----------|
| **Query / RAG** | Nhập câu hỏi → retrieve top-K chunks → agent answer |
| **Chunking** | So sánh FixedSize / Sentence / Recursive trên từng tài liệu |
| **Similarity** | Test cosine similarity giữa các cặp câu (Ex 3.3) |

**Sidebar:**
- Chọn document để filter scope
- Điều chỉnh strategy, chunk_size, top-K
- 5 benchmark queries có sẵn (click để load)

---

## 🔧 Tích hợp với Python backend (tuỳ chọn)

Để kết nối với `src/` Python thực tế, tạo một FastAPI endpoint:

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.store import EmbeddingStore
from src.agent import KnowledgeBaseAgent

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.post("/query")
async def query(body: dict):
    results = store.search(body["query"], top_k=body.get("top_k", 3))
    answer = agent.answer(body["query"])
    return {"results": results, "answer": answer}
```

Sau đó trong `App.js`, thay mock functions bằng `fetch("/query", ...)`.
