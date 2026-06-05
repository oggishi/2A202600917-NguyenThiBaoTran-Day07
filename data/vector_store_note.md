# Ghi Chú Về Vector Store
## Ứng Dụng Trong Hệ Thống Retrieval Tài Liệu Pháp Luật Việt Nam

Vector Store là một cơ sở dữ liệu hoặc tầng lưu trữ được thiết kế để lưu trữ các vector embedding và truy xuất những mục có mức độ tương đồng cao nhất với một vector truy vấn.

Trong hệ thống retrieval tài liệu pháp luật Việt Nam, Vector Store cơ bản cho các tác vụ:

* **Tìm kiếm ngữ nghĩa** - Hiểu câu hỏi "Người nước ngoài bắt buộc BHXH?" → tìm Điều 2 Khoản 2
* **Retrieval-Augmented Generation (RAG)** - Truy xuất chunks liên quan → truyền vào LLM
* **Phân tích tài liệu pháp luật** - Nhóm các quy định có ý tưởng tương tự
* **Lọc dữ liệu theo loại** - Tìm trong "luatbhxh" mà không tìm "luatld"

---

# Quy Trình Hoạt Động Điển Hình

Một quy trình tìm kiếm pháp luật bằng vector thường bao gồm 4 bước:

## 1. Chia Nhỏ Tài Liệu (Chunking)

Các tài liệu pháp luật lớn được chia thành những chunks nhỏ hơn nhưng vẫn giữ được ý nghĩa pháp quy.

**Dữ liệu của bạn:**
```
luatbhxh.md (44,926 ký tự)
    ↓
Chunking Strategy: SentenceChunker + Recursive
    ↓
121 chunks (370 ký tự trung bình)
```

**Ví dụ một chunk:**

```markdown
Điều 2. Phạm vi áp dụng
Khoản 1. Áp dụng đối với người lao động Việt Nam 
        đang làm việc tại doanh nghiệp, cơ quan 
        có tổ chức trong nước
Khoản 2. Áp dụng đối với người lao động nước ngoài 
        có thời hạn hợp đồng từ 12 tháng trở lên
Khoản 3. Không áp dụng đối với ngoại giao viên, 
        tư pháp viên
```

**Lợi ích:** Mỗi chunk tự đủ để trả lời một câu hỏi cụ thể.

---

## 2. Tạo Embedding

Mỗi chunk được chuyển đổi thành một vector số 100 chiều.

Các vector này đại diện cho ý nghĩa (semantic) của nội dung thay vì chỉ từ khóa.

**Dữ liệu của bạn:**

```
Chunk: "Điều 2. Khoản 2. Người lao động nước ngoài 
        có thời hạn từ 12 tháng..."
    ↓
MockEmbedder (MD5 Hash → PRNG)
    ↓
Vector 100 chiều:
[0.0234, -0.1523, 0.4521, -0.0312, ..., 0.1234]
```

**Ví dụ embedding tương tự:**

- "Người nước ngoài bắt buộc BHXH?"
- "Nước ngoài phải tham gia bảo hiểm?"

→ Có thể được embedding tương tự vì cùng ý tưởng.

**Lưu ý:** MockEmbedder hash-based không hiểu thực sự semantic → Production cần SentenceTransformers.

---

## 3. Lưu Trữ Vector Và Metadata

Sau khi tạo embedding, hệ thống lưu:

* **Vector embedding** - Vector 100 chiều
* **Nội dung gốc** - Chunk text gốc
* **Metadata** - Điều, Khoản, loại tài liệu, ...

### Ví Dụ

```json
{
  "id": "bhxh_dinh_2_khoang_2",
  "embedding": [0.0234, -0.1523, 0.4521, ...],
  "content": "Khoản 2. Người lao động nước ngoài 
              có thời hạn hợp đồng từ 12 tháng 
              trở lên phải tham gia BHXH bắt buộc",
  "metadata": {
    "source_file": "luatbhxh.md",
    "document_type": "bhxh",
    "article_number": "Điều 2",
    "clause_numbers": [2],
    "char_count": 156
  }
}
```

**Tổng dữ liệu của bạn:**

```
- Documents: 341 chunks
- Storage: In-memory (Python dict) + metadata fields
- Embedding: 100 dimensions × 341 chunks = 34,100 float values
```

---

## 4. Truy Vấn Và Xếp Hạng

Khi người dùng đặt câu hỏi:

1. **Embedding câu hỏi** - Chuyển thành vector 100 chiều
2. **Tính độ tương đồng** - Dot product với 341 vectors
3. **Xếp hạng** - Sắp xếp giảm dần theo score
4. **Trả về top-k** - Thường k=3-5

### Ví Dụ Cụ Thể

**User Query:**
```
"Người nước ngoài có bắt buộc tham gia BHXH không?"
```

**Embedding:**
```
Query Vector: [0.0156, -0.1234, 0.3891, -0.0421, ..., 0.1092]
```

**Similarity Score (Dot Product):**

| Chunk | Score | Status |
|-------|-------|--------|
| bhxh_dinh_2_k2 | **0.240** | ✅ TOP-1 |
| bhxh_dinh_2_k1 | 0.198 | Top-2 |
| bhxh_dinh_2_k3 | 0.145 | Top-3 |
| luatld_dinh_5 | 0.089 | Top-4 |
| ... | < 0.08 | ... |

**Trả về:**
```
Top-3 chunks:
1. bhxh_dinh_2_k2 (Score: 0.240)
2. bhxh_dinh_2_k1 (Score: 0.198)
3. bhxh_dinh_2_k3 (Score: 0.145)
```

---

## Độ Đo Tương Đồng

Hệ thống sử dụng **Dot Product** để tính similarity:

```
similarity(query, chunk) = dot_product(query_vector, chunk_vector)
                         = Σ(q_i × c_i)
                         = q_1×c_1 + q_2×c_2 + ... + q_100×c_100
```

**Lợi ích của Dot Product:**
- Nhanh (tính toán đơn giản)
- Hiệu quả (thích hợp cho in-memory store)
- Chuẩn hóa vector → kết quả trong khoảng [-1, 1]

**Ví dụ:**
```python
# Giả sử vectors đã chuẩn hóa (magnitude = 1)
query = [0.5, 0.3, 0.2, 0.0, ...]
chunk = [0.4, 0.2, 0.3, 0.1, ...]

similarity = 0.5×0.4 + 0.3×0.2 + 0.2×0.3 + ...
           = 0.20 + 0.06 + 0.06 + ...
           = 0.32 → Tương đồng tốt
```

---

# Tầm Quan Trọng Của Chunking

Chất lượng truy xuất **phụ thuộc rất lớn** vào cách chia nhỏ tài liệu.

## Chunk Quá Nhỏ

Nếu chunk quá ngắn:

* **Mất ngữ cảnh** - Thiếu bối cảnh pháp luật
* **Thiếu thông tin** - Không đủ để trả lời
* **Tạo câu trả lời không đầy đủ** - Cần ghép nhiều chunks

### Ví Dụ Thất Bại

```
Chunk quá nhỏ: "Khoản 2"

Người dùng đọc chunk: "Khoản 2" ← Không hiểu Khoản 2 là gì!
```

Cần thêm chunk trước đó:
```
"Điều 2. Phạm vi áp dụng
Khoản 2. Người lao động nước ngoài..."
```

---

## Chunk Quá Lớn

Nếu chunk quá dài:

* **Chứa nhiều chủ đề khác nhau** - Nhập lẫn thông tin
* **Làm giảm độ chính xác ngữ nghĩa** - Embedding "phân tán"
* **Tăng nhiễu trong retrieval** - Trả về chunk không cần thiết

### Ví Dụ Thất Bại

```
Chunk quá lớn (2,600 ký tự):
"Điều 4. Chế độ BHXH gồm:
1. Ốm đau
2. Thai sản
3. Hưu trí
4. Tử tuất
5. TNLĐ & BNN
... [tiếp tục 20 khoản khác]"

Query: "Làm thế nào để hưu trí?" 
Chunk trả về cả 5 chế độ thay vì chỉ thông tin hưu trí
→ LLM khó lọc thông tin cần thiết
```

---

# Vai Trò Của Metadata

Trong nhiều trường hợp, **metadata quan trọng không kém embedding**.

Metadata của bạn:

```json
{
  "source_file": "luatbhxh.md | luatld.md | luatvieclam.md",
  "document_type": "bhxh | ld | viec_lam",
  "article_number": "Điều 2",
  "clause_numbers": [1, 2, 3],
  "char_count": 450
}
```

---

## Ví Dụ: Metadata Filtering

### Trường Hợp 1: Query Rõ Ràng

**User:** "Mức tham chiếu BHXH là gì?"

**Filter áp dụng:**
```json
{
  "document_type": "bhxh"
}
```

**Kết quả:**
- Chỉ tìm 121 chunks (thay vì 341)
- Bỏ 146 chunks từ luatld.md
- Bỏ 74 chunks từ luatvieclam.md

**Lợi ích:**
- ✅ Tăng precision (ít noise)
- ✅ Tăng tốc độ
- ✅ Tìm được Điều 7 (mức tham chiếu BHXH)

---

### Trường Hợp 2: Query Không Rõ

**User:** "Người lao động phải làm gì?"

**Không áp dụng filter:**
```python
store.search(query, top_k=5)
# Tìm trong 341 chunks
```

**Kết quả:**
- Tìm được chunks từ cả 3 loại tài liệu
- Top-1: Luật LD (Điều 3 - Quyền lao động)
- Top-2: BHXH (Điều 2 - Bắt buộc tham gia)

**Lợi ích:**
- ✅ Tìm được toàn bộ thông tin
- ⚠️ Có thể nhiễu nếu embedding yếu

---

## Các Trường Metadata Thường Gặp

| Trường | Loại | Ví Dụ | Ý Nghĩa |
|--------|------|-------|--------|
| source_file | String | luatbhxh.md | Nguồn tài liệu |
| document_type | String | bhxh, ld, vl | Loại pháp luật |
| article_number | String | Điều 2 | Số Điều |
| clause_numbers | List[Int] | [1, 2, 3] | Số Khoản |
| effective_date | Date | 2024-01-01 | Ngày có hiệu lực |
| version | String | v2.0 | Phiên bản |
| language | String | vi | Ngôn ngữ |

---

# Những Rủi Ro Phổ Biến

Vector Store là công cụ mạnh mẽ nhưng không đảm bảo kết quả luôn chính xác.

---

## 1. Chunking Kém

### Vấn đề

Việc chia tài liệu không hợp lý → retrieval sai hoặc không đầy đủ.

### Ví Dụ Trên Dữ Liệu Của Bạn

**FixedSize Chunking (500 ký tự):**

```
Chunk A: "Điều 2. Phạm vi áp dụng
Khoản 1. Người lao động Việt Nam...
Khoản 2. Người lao động nước ngoài có..."

Chunk B: "...thời hạn từ 12 tháng trở lên 
phải tham gia BHXH bắt buộc
Khoản 3. Không áp dụng cho..."
```

Query: "Điều kiện nước ngoài phải BHXH?"
- Top-1: Chunk B (chỉ có "thời hạn từ 12 tháng")
- Mất Chunk A (mất "Khoản 2")
- Câu trả lời thiếu bối cảnh

**Giải pháp:**
- ✅ Dùng RecursiveChunking → giữ nguyên Khoản

---

## 2. Embedding Model Chất Lượng Thấp

### Vấn đề

MockEmbedder hash-based không hiểu semantic → không capture tương đồng thực.

### Ví Dụ

Hai câu có ý tương tự nhưng embedding khác hoàn toàn:

```
Câu 1: "Chế độ BHXH bắt buộc"
Câu 2: "Bảo hiểm xã hội bắt buộc"

MockEmbedder:
- Câu 1 hash: 0x3a4f21d...
- Câu 2 hash: 0xc92e15a...
→ Vectors hoàn toàn khác nhau ❌

Query: "Chế độ BHXH"
- Tìm được Câu 1 (score 0.95)
- KHÔNG tìm được Câu 2 (score 0.01) ❌
```

### Impact Trên Dữ Liệu Của Bạn

- Query 5 ("Chế độ BHXH") Score chỉ 0.383 → cần top-5
- Lý do: "Chế độ" ≠ "Bảo hiểm" trong MockEmbedder

**Giải pháp:**
- ✅ Thay SentenceTransformers (semantic)

---

## 3. Thiếu Metadata

### Vấn đề

Không có metadata phù hợp → không thể lọc dữ liệu.

### Ví Dụ

```
Retrieved chunk: "Người nước ngoài phải tham gia BHXH"

Lỗi: Không biết Điều bao nhiêu, Khoản bao nhiêu!

Câu trả lời: "Theo tài liệu..." ← Không truy vết được
```

**Giải pháp:**
- ✅ Thêm metadata: `article_number`, `clause_numbers`

---

## 4. Đánh Giá Không Đầy Đủ

### Vấn đề

Chỉ test 2-3 câu hỏi → Che giấu lỗi retrieval nghiêm trọng.

### Ví Dụ

```
Test 1: "Người nước ngoài BHXH?" → ✅ Đúng
Test 2: "Mức tham chiếu?" → ✅ Đúng
Test 3: "Hành vi cấm?" → ❌ THẤT BẠI (nhưng chưa test)

Kết luận: "Hệ thống hoạt động tốt!" ← SAI!
```

**Giải pháp:**
- ✅ Test 5+ benchmark queries (bạn đã làm ✓)

---

# Đánh Giá Chất Lượng Retrieval

Các nhóm phát triển nên:

1. **Xây dựng bộ câu hỏi thực tế** - Các queries người dùng thực sự hỏi
2. **Kiểm tra nhiều trường hợp** - Tối thiểu 5-10 queries
3. **So sánh có/không metadata filter** - Đo precision, recall
4. **Quan sát trực tiếp chunks** - Xem chunk trả về có đúng không
5. **Ghi log chi tiết** - Biết query nào sai để cải thiện

### Bảng Đánh Giá Của Bạn

| Query | Chunk Trả Về | Top-1 | Top-5 | Điều/Khoản | Status |
|-------|---|---|---|---|---|
| Q1: Nước ngoài BHXH | Điều 2 K2 | ✅ | ✅ | Đúng | PASS |
| Q2: Mức tham chiếu | Điều 7 | ✅ | ✅ | Đúng | PASS |
| Q3: Hành vi cấm | Điều 94 (VL) | ❌ | ✅ | Đúng | NEED TOP-5 |
| Q4: Trách nhiệm BHXH | Điều 18 | ✅ | ✅ | Đúng | PASS |
| Q5: Chế độ BHXH | Điều 4 | ❌ | ✅ | Đúng | NEED TOP-5 |

**Kết quả:** 3/5 top-1 ✅, 5/5 top-5 ✅

---

# Kiến Trúc In-Memory Vector Store

## Cấu Trúc Dữ Liệu (Python)

```python
class EmbeddingStore:
    def __init__(self):
        # Lưu trữ chính
        self.documents: Dict[str, Document] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Dict] = {}
    
    def add_documents(self, documents: List[Document]):
        for doc in documents:
            embedding = self.embedder(doc.content)
            self.documents[doc.id] = doc
            self.embeddings[doc.id] = embedding
            self.metadata[doc.id] = doc.metadata
    
    def search(self, query: str, top_k: int = 5, 
               metadata_filter: Dict = None) -> List[Document]:
        # 1. Embedding query
        query_embedding = self.embedder(query)
        
        # 2. Tính độ tương đồng
        scores = {}
        for doc_id, embedding in self.embeddings.items():
            score = np.dot(query_embedding, embedding)
            scores[doc_id] = score
        
        # 3. Áp dụng filter
        if metadata_filter:
            scores = {
                doc_id: score 
                for doc_id, score in scores.items()
                if self.metadata[doc_id].matches(metadata_filter)
            }
        
        # 4. Trả về top-k
        top_k_ids = sorted(scores, 
                          key=lambda x: scores[x], 
                          reverse=True)[:top_k]
        return [self.documents[id] for id in top_k_ids]
```

---

## Phức Tạp Tính Toán

**Add Documents:**
- Time: O(n × m) - n documents, m-dim embedding
- Space: O(n × m) - lưu n vectors m chiều

**Search:**
- Time: O(n × m) - tính n dot products, mỗi m operations
- Space: O(n) - lưu scores tạm

**Ví dụ trên dữ liệu của bạn:**
```
n = 341 chunks
m = 100 dimensions

Add: 341 × 100 = 34,100 operations
Search: 341 × 100 = 34,100 operations (rất nhanh, < 10ms)
Storage: 341 × 100 × 4 bytes = 136 KB (rất nhỏ)
```

---

# So Sánh: In-Memory vs ChromaDB vs Pinecone

| Yếu Tố | In-Memory | ChromaDB | Pinecone |
|--------|-----------|----------|----------|
| **Setup** | Đơn giản | Trung bình | Phức tạp |
| **Tốc độ** | Rất nhanh | Nhanh | Nhanh |
| **Dữ liệu** | Nhỏ (341 chunks) | Vừa | Lớn |
| **Persistence** | Không | Có (SQLite) | Có (Cloud) |
| **Giá** | Miễn phí | Miễn phí | Có phí |
| **Phù hợp** | **Testing ✅** | Production nhỏ | Production lớn |

**Khuyến nghị cho bạn:**
- ✅ In-Memory (hiện tại) - Phù hợp testing, 341 chunks nhỏ
- Future: ChromaDB - Khi tăng số chunks, cần persistence

---

# Ưu Điểm Của Vector Store So Với Full-Text Search

## Vector Store (Semantic)

```
Query: "Người nước ngoài bắt buộc BHXH?"

Vector → Embedding (semantic)
↓
Tìm chunks có vector tương tự
↓
Kết quả: Điều 2 Khoản 2 ✅ (không chứa từ "bắt buộc" nhưng semantic match)
```

## Full-Text Search (Keyword)

```
Query: "Người nước ngoài bắt buộc BHXH?"

Full-text index
↓
Tìm chunks chứa từ khóa "người", "nước ngoài", "bắt buộc", "BHXH"
↓
Kết quả: 
- Điều 2 Khoản 2 (chứa đủ từ khóa) ✅
- Điều 5 (chứa "BHXH" nhưng không liên quan) ❌
```

**Kết luận:**
- Vector Store → Hiểu **ý tưởng**
- Full-Text → Chỉ match **từ khóa**
- Vector Store tốt hơn cho RAG ✅

---

# Kết Luận

Một hệ thống Vector Store hiệu quả cho retrieval pháp luật không chỉ phụ thuộc vào Vector Store.

Chất lượng retrieval là kết quả của:

| Yếu Tố | Impact | Status Của Bạn |
|--------|--------|---|
| **Dữ liệu chất lượng** | 25% | ✅ 3 tài liệu pháp luật chính thức |
| **Chunking hợp lý** | 25% | ✅ Recursive chunking, 341 chunks |
| **Embedding mạnh** | 25% | ⚠️ MockEmbedder (cần SentenceTransformers) |
| **Metadata đầy đủ** | 15% | ✅ document_type, article_number, ... |
| **Quy trình đánh giá** | 10% | ✅ 5 benchmark queries, logging |

**Điểm hiện tại:** 3/5 top-1, 5/5 top-5

**Cải tiến để đạt 5/5 top-1:**
1. Thay SentenceTransformers (semantic embedding)
2. Cải thiện query format (thêm "Điều số")
3. Hybrid chunking cho chunks quá lớn

Với các bước này, hệ thống retrieval pháp luật của bạn sẽ hoạt động ổn định và chính xác! 🎯
