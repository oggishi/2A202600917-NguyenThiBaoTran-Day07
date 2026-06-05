# Thiết Kế Hệ Thống RAG 
## Trợ Lý Truy Vấn Tài Liệu Pháp Luật Việt Nam

## Bối Cảnh

Một nhóm phát triển sản phẩm muốn xây dựng một trợ lý AI có khả năng trả lời các câu hỏi liên quan đến:

* **Bảo Hiểm Xã Hội (BHXH)** - Quy định bắt buộc, mức đóng góp, chế độ
* **Luật Lao Động (LD)** - Quyền lao động, lương, hợp đồng, kỉ luật
* **Luật Việc Làm (VL)** - Đặc thù việc làm, kỹ năng, hỗ trợ việc làm

Hiện nay, các tài liệu pháp luật được lưu trữ dưới dạng:

* Tệp Markdown (luatbhxh.md, luatld.md, luatvieclam.md)
* Tài liệu PDF từ website Bộ LĐ-TB&XH
* Hướng dẫn chi tiết từ các sở, ngành

Do dữ liệu nằm rải rác ở nhiều nguồn, người lao động và nhà tuyển dụng thường mất nhiều thời gian để tìm câu trả lời cho các câu hỏi pháp luật.

**Ví dụ câu hỏi thực tế:**
- "Người nước ngoài làm việc tại VN có bắt buộc tham gia BHXH?"
- "Mức tham chiếu trong BHXH là bao nhiêu?"
- "Cơ quan BHXH có trách nhiệm gì đối với thông tin cá nhân?"
- "Các chế độ BHXH bắt buộc gồm những gì?"

---

# Mục Tiêu Hệ Thống

Hệ thống cần áp dụng phương pháp **Retrieval-Augmented Generation (RAG)** để:

1. **Tìm kiếm tài liệu pháp luật liên quan** trước khi tạo câu trả lời
2. **Giảm thiểu hallucination** - Không sáng tạo thông tin không có trong tài liệu
3. **Cung cấp khả năng truy vết nguồn** - Trả lời câu hỏi kèm theo "Điều nào, Khoản nào"
4. **Đảm bảo câu trả lời được xây dựng dựa trên bằng chứng** từ tài liệu pháp luật chính thức

Trợ lý phải phân biệt rõ:

* **Nội dung từ tài liệu** - "Theo Điều 2 Khoản 2..."
* **Nội dung được tổng hợp** - "Tóm lại, quy định này có nghĩa là..."

Nếu không có đủ bằng chứng hoặc có mâu thuẫn giữa các nguồn (ví dụ: luatbhxh vs luatld), hệ thống cần thông báo điều đó thay vì đưa ra câu trả lời thiếu căn cứ.

---

# Kiến Trúc Tổng Quan

Hệ thống được chia thành ba tầng chính:

## 1. Ingestion Layer (Tầng Nạp Dữ Liệu)
## 2. Retrieval Layer (Tầng Tìm Kiếm)
## 3. Application Layer (Tầng Ứng Dụng)

```
┌─────────────────────┐
│   Câu Hỏi Người Dùng │
│  (Vietnamese)        │
└──────────┬──────────┘
           │
    ┌──────v──────┐
    │ Retrieval    │
    │ Layer        │
    │ - Embedding  │
    │ - Search K=5 │
    │ - Filter     │
    └──────┬───────┘
           │
    ┌──────v────────────┐
    │ 5 Relevant Chunks  │
    │ from 341 total     │
    │ (luatbhxh/ld/vl)   │
    └──────┬─────────────┘
           │
    ┌──────v──────────────┐
    │ Application Layer    │
    │ - Build Context     │
    │ - LLM Prompt        │
    │ - Format Answer     │
    └──────┬───────────────┘
           │
    ┌──────v──────────────┐
    │ Câu Trả Lời + Bằng  │
    │ Chứng (Điều/Khoản)  │
    └─────────────────────┘
```

---

# Ingestion Layer (Tầng Nạp Dữ Liệu)

## Mục Đích

Tầng nạp dữ liệu chịu trách nhiệm:

* Đọc tài liệu pháp luật Markdown
* Chia nhỏ tài liệu thành chunks có ý nghĩa
* Tạo embedding vector cho mỗi chunk
* Lưu dữ liệu vào vector store với metadata

---

## Nguồn Dữ Liệu

Ba tài liệu pháp luật Việt Nam:

```
src/data/
├── luatbhxh.md          (44,926 ký tự - Bảo Hiểm Xã Hội Bắt Buộc)
├── luatld.md            (~54,000 ký tự - Luật Lao Động)
└── luatvieclam.md       (~30,000 ký tự - Luật Việc Làm)
```

**Tổng:** ~130,000 ký tự, 341 chunks, 3 loại tài liệu

---

## Chunking Strategy (Chiến Lược Chia Nhỏ)

Sau khi thử nghiệm, **Recursive Chunking** được chọn vì:

1. **Tôn trọng cấu trúc pháp luật** - Không cắt giữa Điều/Khoản
2. **Ổn định nhất** - Kích thước cân bằng (200-1,000 ký tự)
3. **Bảo toàn ngữ cảnh** - Danh sách điều kiện ở cùng chunk

### Ví Dụ:

```markdown
# Chương I. QUY ĐỊNH CHUNG

## Điều 2. Phạm vi áp dụng
Khoản 1. Áp dụng cho người lao động Việt Nam
Khoản 2. Áp dụng cho người lao động nước ngoài có thời hạn 
         hợp đồng từ 12 tháng trở lên
Khoản 3. Không áp dụng cho ngoại giao viên, tư pháp viên
```

→ **Chunk 1:** Toàn bộ Điều 2 (3 Khoản)
→ **Chunk 2:** Tiếp tục với Điều 3, ...

**Kết quả trên luatbhxh.md:**
- 121 chunks
- Trung bình: 370 ký tự/chunk
- Min-Max: 36-2,613 ký tự

---

## Metadata (Dữ Liệu Mô Tả)

Mỗi chunk được lưu cùng metadata để lọc dữ liệu:

```json
{
  "source_file": "luatbhxh.md",
  "document_type": "bhxh",
  "article_number": "Điều 2",
  "clause_numbers": [1, 2, 3],
  "document_id": "bhxh_dinh_2",
  "char_count": 450,
  "chunk_index": 5
}
```

**Metadata Schema:**

| Trường | Giá Trị | Ý Nghĩa |
|--------|---------|--------|
| source_file | luatbhxh.md, luatld.md, luatvieclam.md | Nguồn tài liệu |
| document_type | bhxh, ld, viec_lam | Loại pháp luật |
| article_number | Điều 2, Điều 7, ... | Số Điều |
| clause_numbers | [1, 2, 3] | Số Khoản trong Điều |

---

## Lợi Ích Của Metadata

Metadata giúp:

* **Lọc dữ liệu theo loại** - Query "BHXH" chỉ tìm trong luatbhxh.md
* **Giảm nhiễu** - Loại bỏ kết quả không liên quan (ví dụ: query về BHXH không cần kết quả từ luatvieclam.md)
* **Hỗ trợ truy vết nguồn** - Trả lời kèm "Theo luatbhxh.md, Điều 2, Khoản 2"
* **Hỗ trợ phân tích lỗi** - Biết chunk nào truy xuất sai → cải thiện

### Ví Dụ Metadata Filtering:

**Query:** "Người nước ngoài có bắt buộc BHXH?"

**Filter áp dụng:**
```json
{
  "document_type": "bhxh"  // Chỉ tìm trong BHXH, bỏ LD, VL
}
```

**Kết quả:** Chỉ tìm trong 121 chunks (thay vì 341 chunks)

---

# Retrieval Layer (Tầng Tìm Kiếm)

## Mục Đích

Tầng retrieval chịu trách nhiệm:

1. Chuyển đổi câu hỏi thành embedding vector
2. Tìm kiếm các vector tương đồng trong vector store
3. Áp dụng metadata filtering
4. Trả về top-k chunks liên quan nhất

---

## Quy Trình Retrieval Chi Tiết

### Bước 1: Nhập Câu Hỏi

Người dùng hỏi:
```
"Người lao động nước ngoài làm việc tại VN có bắt buộc 
tham gia BHXH không?"
```

---

### Bước 2: Embedding Câu Hỏi

Câu hỏi được chuyển thành vector 100 chiều (MockEmbedder):

```
Question String
    ↓
MD5 Hash(Question)
    ↓
Seed PRNG with Hash
    ↓
Generate 100 dimensions
    ↓
Normalize → Vector
```

---

### Bước 3: Similarity Search

Vector store tính **dot product** giữa câu hỏi và tất cả 341 chunks:

| Chunk | Similarity Score | Status |
|-------|-----------------|--------|
| luatbhxh - Điều 2 Khoản 2 | **0.240** | ✅ TOP-1 |
| luatbhxh - Điều 2 Khoản 1 | 0.198 | Top-2 |
| luatbhxh - Điều 3 | 0.145 | Top-3 |
| luatld - Điều 5 | 0.089 | ... |

---

### Bước 4: Metadata Filtering

Nếu cần, áp dụng filter:

```json
{
  "document_type": "bhxh"
}
```

Chỉ giữ chunks từ luatbhxh.md (121 chunks).

---

### Bước 5: Trả Về Top-K

Trả về 3-5 chunks có similarity score cao nhất:

```
1. luatbhxh - Điều 2 Khoản 2 (Score: 0.240)
2. luatbhxh - Điều 2 Khoản 1 (Score: 0.198)
3. luatbhxh - Điều 3 (Score: 0.145)
```

---

## Metadata Filtering - Ví Dụ Thực Tế

### Query 1: BHXH

**User:** "Người nước ngoài bắt buộc BHXH?"

**Filter:**
```python
store.search(
    query="Người nước ngoài bắt buộc BHXH?",
    top_k=5,
    metadata_filter={"document_type": "bhxh"}
)
```

**Kết quả:** Tìm trong 121 chunks (luatbhxh.md)

**Top-1:** Điều 2 Khoản 2 ✅

---

### Query 2: Luật Lao Động

**User:** "Hợp đồng lao động không xác định thời hạn bị chấm dứt như thế nào?"

**Filter:**
```python
store.search(
    query="Hợp đồng lao động vô thời hạn chấm dứt",
    top_k=5,
    metadata_filter={"document_type": "ld"}
)
```

**Kết quả:** Tìm trong 146 chunks (luatld.md)

---

## Đánh Giá Retrieval - 5 Benchmark Queries

Hệ thống được đánh giá trên 5 câu hỏi chính thức từ nhóm:

### Query 1: Người Nước Ngoài & BHXH

```
Q: Người lao động nước ngoài làm việc tại VN có bắt buộc 
   tham gia BHXH?
   
Gold Answer: Có, nếu hợp đồng lao động từ 12 tháng trở lên

Source: luatbhxh.md - Khoản 2 Điều 2

Retrieval Score: 0.240 ✅ TOP-1 FOUND
```

---

### Query 2: Mức Tham Chiếu BHXH

```
Q: Mức tham chiếu trong bảo hiểm xã hội là gì?

Gold Answer: Mức tiền do Chính phủ quyết định, 
             được điều chỉnh hàng năm theo CPI

Source: luatbhxh.md - Điều 7

Retrieval Score: 0.304 ✅ TOP-1 FOUND
```

---

### Query 3: Hành Vi Cấm Trong BHTN

```
Q: Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp?

Gold Answer: Chậm đóng, trốn đóng, gian lận, 
             sử dụng thông tin sai lệch

Source: luatvieclam.md - Điều 94

Retrieval Score: 0.268 ⚠️ NEED TOP-5
```

---

### Query 4: Trách Nhiệm BHXH vs Thông Tin

```
Q: Cơ quan BHXH có trách nhiệm gì đối với thông tin 
   cá nhân của lao động?

Gold Answer: Cung cấp hàng tháng thông tin qua 
             phương tiện điện tử, bảo mật dữ liệu

Source: luatbhxh.md - Điều 18

Retrieval Score: 0.276 ✅ TOP-1 FOUND
```

---

### Query 5: Chế Độ BHXH Bắt Buộc

```
Q: Các chế độ của BHXH bắt buộc gồm những gì?

Gold Answer: Ốm đau, Thai sản, Hưu trí, Tử tuất, 
             TNLĐ & BNN (Tai nạn, Bệnh nghề nghiệp)

Source: luatbhxh.md - Điều 4

Retrieval Score: 0.383 ⚠️ NEED TOP-5
```

---

## Kết Quả Retrieval Tổng Hợp

| Query | Score | Top-1 | Status | Issue |
|-------|-------|-------|--------|-------|
| Q1: Người nước ngoài | 0.240 | ✅ | TOP-1 FOUND | - |
| Q2: Mức tham chiếu | 0.304 | ✅ | TOP-1 FOUND | - |
| Q3: Hành vi cấm | 0.268 | ❌ | TOP-5 | MockEmbedder hash-based |
| Q4: Trách nhiệm BHXH | 0.276 | ✅ | TOP-1 FOUND | - |
| Q5: Chế độ BHXH | 0.383 | ❌ | TOP-5 | Query mờ, embedding yếu |

**Tổng: 3/5 queries found with top-1 (60%)**

---

# Application Layer (Tầng Ứng Dụng)

## Vai Trò

Tầng ứng dụng kết hợp:

* Câu hỏi người dùng
* Các chunks được truy xuất (top-5)
* Prompt hướng dẫn mô hình LLM

để tạo ra câu trả lời cuối cùng kèm bằng chứng.

---

## Prompting Strategy

### Prompt Template

```
Bạn là trợ lý tư vấn pháp luật Việt Nam.

HƯỚNG DẪN:
1. Chỉ sử dụng thông tin được cung cấp trong phần "Context"
2. Nếu thông tin không đủ, hãy nói "Cần thêm thông tin"
3. Không tự suy đoán hoặc sáng tạo thông tin không có trong Context
4. Luôn trích dẫn Điều và Khoản

CONTEXT (Từ tài liệu pháp luật):
{context_chunks}

QUESTION:
{user_question}

ANSWER:
```

---

## Cấu Trúc Trả Lời

Câu trả lời nên gồm ba phần:

### 1. ANSWER (Câu Trả Lời Chính)

Trả lời trực tiếp câu hỏi:

```
Trả lời: Có, người lao động nước ngoài bắt buộc phải tham gia BHXH.
```

---

### 2. EVIDENCE (Bằng Chứng Từ Tài Liệu)

Thông tin được lấy trực tiếp từ pháp luật:

```
Bằng chứng:
- Theo Luật BHXH, Điều 2, Khoản 2:
  "Người lao động nước ngoài có thời hạn hợp đồng từ 12 tháng 
   trở lên phải tham gia BHXH bắt buộc"
```

---

### 3. SUMMARY (Tóm Tắt)

Phần tổng hợp ngắn gọn:

```
Tóm tắt:
Người nước ngoài chỉ bắt buộc BHXH nếu ký hợp đồng từ 12 tháng 
trở lên tại Việt Nam. Hợp đồng ngắn hạn (< 12 tháng) không bắt buộc.
```

---

## Ví Dụ Trả Lời Hoàn Chỉnh

### Input

```
User Query: "Người nước ngoài có bắt buộc tham gia BHXH không?"
Retrieved Chunks: [
  Chunk 1: "Điều 2. Phạm vi áp dụng. Khoản 2. Người lao động nước ngoài 
            có thời hạn hợp đồng từ 12 tháng trở lên phải tham gia BHXH",
  Chunk 2: "Khoản 3. Không áp dụng cho ngoại giao viên, tư pháp viên"
]
```

### Output (Agent Response)

```
TRẢ LỜI:
Có, người lao động nước ngoài BẮT BUỘC phải tham gia BHXH khi ký 
hợp đồng lao động từ 12 tháng trở lên tại Việt Nam.

BẰNG CHỨNG:
📌 Theo Luật BHXH Bắt Buộc, Điều 2, Khoản 2:
"Người lao động nước ngoài có thời hạn hợp đồng từ 12 tháng 
trở lên phải tham gia BHXH bắt buộc"

📌 Ngoài lệ (Khoản 3):
Ngoại giao viên, tư pháp viên KHÔNG áp dụng quy định này.

TÓM TẮT:
- ✅ Hợp đồng ≥ 12 tháng → Bắt buộc BHXH
- ❌ Hợp đồng < 12 tháng → Không bắt buộc
- ❌ Ngoại giao viên, tư pháp viên → Không bắt buộc
```

---

# Kế Hoạch Đánh Giá

## Mục Tiêu

Đánh giá không chỉ chất lượng câu trả lời mà còn chất lquality của retrieval.

---

## Bộ Câu Hỏi Kiểm Thử

### Nhóm 1: Câu Hỏi BHXH (5 queries)

1. Người nước ngoài bắt buộc BHXH?
2. Mức tham chiếu BHXH là bao nhiêu?
3. Hành vi cấm trong BHTN?
4. Trách nhiệm của BHXH vs thông tin cá nhân?
5. Chế độ BHXH bắt buộc gồm gì?

### Nhóm 2: Câu Hỏi Luật Lao Động (Nếu mở rộng)

- Hợp đồng lao động vô thời hạn bị chấm dứt như thế nào?
- Mức lương tối thiểu là bao nhiêu?
- Thời gian làm việc tối đa mỗi tuần?

---

## Tiêu Chí Thành Công

### 1. Retrieval Relevance

- ✅ Chunks được truy xuất có liên quan đến câu hỏi
- ✅ Chunks chứa Điều/Khoản đúng (gold answer)
- ❌ Chunks không liên quan hoặc sai Điều

### 2. Source Traceability

- ✅ Mỗi câu trả lời kèm theo "Điều bao nhiêu, Khoản bao nhiêu"
- ✅ User biết thông tin đến từ tài liệu nào (luatbhxh, luatld, luatvieclam)

### 3. Freshness

- ✅ Thông tin pháp luật được cập nhật mới nhất
- ❌ Tài liệu cũ, không còn hiệu lực

### 4. Consistency

- ✅ Các tài liệu không mâu thuẫn với nhau
- ⚠️ Nếu mâu thuẫn, hệ thống phải thông báo rõ

---

# Kiến Trúc Kỹ Thuật

## Stack Công Nghệ

```
┌─────────────────────────────────────┐
│  Frontend                            │
│  - Web UI (Flask/Streamlit)         │
│  - Chat Interface                   │
└──────────────┬──────────────────────┘
               │
┌──────────────v──────────────────────┐
│  Backend API                         │
│  - KnowledgeBaseAgent (RAG Logic)   │
│  - Query Processing                 │
│  - Response Formatting              │
└──────────────┬──────────────────────┘
               │
┌──────────────v──────────────────────┐
│  Embedding & Retrieval              │
│  - MockEmbedder (Testing)           │
│  - EmbeddingStore (Vector DB)       │
│  - Similarity Search (Dot Product)  │
└──────────────┬──────────────────────┘
               │
┌──────────────v──────────────────────┐
│  Storage Layer                       │
│  - Chunked Documents (341 chunks)   │
│  - Metadata (bhxh, ld, viec_lam)   │
│  - Embedding Vectors (100-dim)      │
└─────────────────────────────────────┘
```

---

## Data Flow

```python
# Python Implementation
from src.agent import KnowledgeBaseAgent
from src.store import EmbeddingStore
from src.embeddings import MockEmbedder
from src.chunking import SentenceChunker

# 1. Initialize
embedder = MockEmbedder()
store = EmbeddingStore(embedding_fn=embedder)

# 2. Add Documents
chunker = SentenceChunker()
chunks = chunker.chunk("Điều 2...")
documents = [
    Document(id="bhxh_2_1", content=chunk, metadata={"type": "bhxh"})
    for chunk in chunks
]
store.add_documents(documents)

# 3. Retrieve & Answer
agent = KnowledgeBaseAgent(store=store, llm_fn=llm)
answer = agent.answer("Người nước ngoài bắt buộc BHXH?")
```

---

# Các Trường Hợp Thất Bại Thường Gặp

## 1. Embedding Model Yếu

**Vấn đề:** MockEmbedder dùng MD5 hash → không hiểu semantic similarity

**Ví dụ:**
- "Chế độ BHXH" vs "Bảo hiểm xã hội" → Hoàn toàn vector khác nhau
- Query 5 (Score: 0.383) → Cần top-5 thay vì top-1

**Giải pháp:** Thay SentenceTransformers (tìm hiểu semantic)

---

## 2. Query Không Cụ Thể

**Vấn đề:** User hỏi "Điều kiện gì?" mà không nói "điều kiện BHXH hay LD"

**Ví dụ:**
```
Q: "Hành vi bị cấm?"  (quá chung chung)
Bị nhầm → Tìm được "Hành vi bị cấm trong luatld" thay vì "luatvieclam"
```

**Giải pháp:** 
- Hỏi lại user "Bạn hỏi về BHXH, LD, hay Việc Làm?"
- Hoặc thử tất cả 3 loại, sau đó merge kết quả

---

## 3. Tài Liệu Cũ vs Mới

**Vấn đề:** Nếu có 2 version của một Điều (cũ, mới) → Tìm được cái cũ

**Ví dụ:**
```
Chunk A: "Điều 7 (cũ): Mức tham chiếu là ..."
Chunk B: "Điều 7 (2024): Mức tham chiếu là ..."

Similarity tương đương → Có thể trả lại chunk cũ
```

**Giải pháp:** Thêm metadata `version`, `effective_date` → filter bỏ tài liệu cũ

---

## 4. Chunk Quá Lớn Vượt Token Limit

**Vấn đề:** SentenceChunker tạo chunk đến 2,600 ký tự → LLM overload

**Ví dụ:**
```
Chunk = "Điều 4. Chế độ BHXH gồm: 
1. Ốm đau
2. Thai sản
3. Hưu trí
...
(khoảng 2,600 ký tự)"

LLM: "Token limit exceeded"
```

**Giải pháp:** Hybrid chunking (Recursive + Sentence)

---

## 5. Metadata Không Đầy Đủ

**Vấn đề:** Chunk không có metadata `article_number` → không biết Điều bao nhiêu

**Ví dụ:**
```
Retrieved chunk: "Người lao động nước ngoài phải tham gia BHXH"
Trả lời: "Theo tài liệu..." ← Không biết Điều nào!
```

**Giải pháp:** Đảm bảo mỗi chunk có metadata đầy đủ

---

# Các Yếu Tố Vận Hành

## Re-indexing (Cập Nhật Tài Liệu)

Khi tài liệu pháp luật thay đổi:

```python
# 1. Cập nhật tệp luatbhxh.md
# 2. Re-chunk tài liệu
# 3. Re-embed
# 4. Re-index vào vector store

store.delete_document("bhxh")  # Xóa chunks cũ
store.add_documents(new_chunks)  # Thêm chunks mới
```

---

## Xóa Tài Liệu (Deprecation)

Khi tài liệu bị loại bỏ:

```python
# Xóa tất cả chunks từ luatld_old
store.delete_document("luatld_old")

# Tránh retrieval từ tài liệu lỗi thời
```

---

## Source Freshness

Hệ thống nên theo dõi:

| Trường | Ý Nghĩa |
|--------|---------|
| `last_updated` | Ngày cập nhật cuối cùng |
| `version` | Phiên bản (v1.0, v2.0) |
| `effective_date` | Ngày có hiệu lực |
| `deprecation_date` | Ngày hết hiệu lực |

---

# Logging Và Audit

Đối với mỗi query, hệ thống nên ghi lại:

```json
{
  "timestamp": "2026-06-05T10:30:00",
  "query": "Người nước ngoài bắt buộc BHXH?",
  "query_embedding": [0.12, 0.34, ...],
  "retrieved_chunks": [
    {
      "chunk_id": "bhxh_dinh_2_khoang_2",
      "similarity_score": 0.240,
      "source_file": "luatbhxh.md",
      "article": "Điều 2",
      "clause": "Khoản 2"
    },
    ...
  ],
  "prompt": "You are a legal advisor...",
  "answer": "Có, người lao động nước ngoài bắt buộc...",
  "execution_time_ms": 245
}
```

Điều này giúp đội ngũ:

* Debug hệ thống khi retrieval sai
* Đánh giá chất lượng chunk
* Phân tích các trường hợp thất bại
* Cải thiện prompt

---

# Kết Luận

Một hệ thống RAG hiệu quả cho tài liệu pháp luật Việt Nam phụ thuộc vào:

1. **Dữ liệu chất lượng cao** - Tài liệu pháp luật chính thức, cập nhật
2. **Chiến lược chunking phù hợp** - Recursive chunking tôn trọng cấu trúc pháp luật
3. **Metadata đầy đủ** - Biết Điều, Khoản, loại tài liệu, ngày cập nhật
4. **Embedding mạnh mẽ** - SentenceTransformers thay MockEmbedder
5. **Prompt cụ thể** - Hướng dẫn LLM chỉ dùng dữ liệu được truy xuất
6. **Quy trình đánh giá nghiêm ngặt** - 5+ benchmark queries, logging chi tiết

Với các cải tiến này, hệ thống có thể từ **3/5 queries** hiện tại nâng lên **5/5 queries** và hỗ trợ tốt hơn cho người lao động và nhà tuyên dụng tìm hiểu quyền lợi, nghĩa vụ theo pháp luật Việt Nam.
