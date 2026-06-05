# Báo Cáo Thử Nghiệm Chiến Lược Chunking
## Hệ Thống Retrieval Tài Liệu Pháp Luật Việt Nam

## Mục Đích

Báo cáo này trình bày kết quả của một thử nghiệm nhằm đánh giá tác động của các chiến lược chunking khác nhau đến hiệu quả truy xuất thông tin trong hệ thống RAG cho tài liệu pháp luật Việt Nam.

Ba phương pháp được đánh giá bao gồm:

1. **Fixed-Size Chunking** - Chia tài liệu theo kích thước ký tự cố định (500 ký tự/chunk)
2. **Sentence-Based Chunking** - Chia tài liệu theo ranh giới câu tự nhiên, nhóm tối đa 3 câu/chunk
3. **Recursive Chunking** - Chia theo cấu trúc tài liệu (section, paragraph, sentence), tôn trọng ranh giới ngữ nghĩa

Mục tiêu của thử nghiệm là xác định ảnh hưởng của ranh giới chunk đến:

* Chất lượng retrieval cho các câu hỏi pháp luật
* Khả năng bảo toàn bối cảnh pháp quy
* Tính hữu ích của nội dung được truy xuất (Điều/Khoản)
* Trải nghiệm của người dùng cuối trong tìm kiếm thông tin pháp luật

---

# Thiết Lập Thử Nghiệm

## Bộ Dữ Liệu

Thử nghiệm được thực hiện trên bộ tài liệu pháp luật gồm:

| Tài Liệu | Tên Tệp | Kích Thước | Nội Dung |
|----------|---------|-----------|---------|
| Luật BHXH | luatbhxh.md | 44,926 ký tự | Quy định về Bảo hiểm Xã Hội Bắt Buộc |
| Luật Lao Động | luatld.md | ~54,000 ký tự | Quy định về Lao động, Lương, Hợp đồng |
| Luật Việc Làm | luatvieclam.md | ~30,000 ký tự | Quy định về Đặc thù Việc Làm, Kỹ năng |

**Tổng kích thước:** ~130,000 ký tự trên 3 tài liệu pháp luật Việt Nam

---

## Quy Trình Đánh Giá

Đối với mỗi chiến lược chunking:

1. Chia nhỏ toàn bộ tài liệu pháp luật.
2. Sinh embedding cho từng chunk bằng MockEmbedder (vector 100 chiều).
3. Lưu trữ vào vector store (EmbeddingStore) với metadata (loại: bhxh, ld, viec_lam).
4. Thực hiện 5 truy vấn chính thức từ nhóm.
5. So sánh kết quả retrieval (top-1 vs top-5).

Các câu hỏi đánh giá bao gồm:

1. **Người lao động nước ngoài làm việc tại VN có bắt buộc tham gia BHXH?**
   - Nguồn: luatbhxh.md - Khoản 2 Điều 2
   - Câu trả lời: Có, nếu hợp đồng lao động từ 12 tháng trở lên

2. **Mức tham chiếu trong bảo hiểm xã hội là gì?**
   - Nguồn: luatbhxh.md - Điều 7
   - Câu trả lời: Mức tiền do Chính phủ quyết định, được điều chỉnh hàng năm theo CPI

3. **Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp?**
   - Nguồn: luatvieclam.md - Điều 94
   - Câu trả lời: Chậm đóng, trốn đóng, gian lận, sử dụng thông tin sai lệch

4. **Cơ quan BHXH có trách nhiệm gì đối với thông tin cá nhân?**
   - Nguồn: luatbhxh.md - Điều 18
   - Câu trả lời: Cung cấp hàng tháng thông tin qua phương tiện điện tử, bảo mật dữ liệu

5. **Các chế độ của BHXH bắt buộc gồm những gì?**
   - Nguồn: luatbhxh.md - Điều 4
   - Câu trả lời: Ốm đau, thai sản, hưu trí, tử tuất, TNLĐ & BNN

---

# Fixed-Size Chunking

## Mô Tả

Phương pháp này chia tài liệu pháp luật thành các đoạn có độ dài cố định 500 ký tự.

Ví dụ trên luatbhxh.md:

```text
Chunk 1: "Điều 2. PHẠM VI ĐIỀU CHỈNH... [500 ký tự tiếp]"
Chunk 2: "[tiếp theo 500 ký tự]"
Chunk 3: "[tiếp theo 500 ký tự]"
```

---

## Kết Quả Trên Tài Liệu Của Bạn

**luatbhxh.md (44,926 ký tự):**
- Số chunk: 100 chunks
- Trung bình: 498.8 ký tự/chunk
- Min-Max: 450-500 ký tự

---

## Ưu Điểm

### Triển Khai Đơn Giản

Không yêu cầu phân tích cấu trúc tài liệu pháp luật.

### Kích Thước Đồng Nhất

Các chunk có kích thước gần như tương đương nhau, dễ quản lý token.

### Dễ Điều Chỉnh

Có thể thay đổi chunk size từ 256→1024 để phù hợp với mô hình embedding.

---

## Nhược Điểm Trên Dữ Liệu Pháp Luật

### Cắt Giữa Các Điều/Khoản

Chunk có thể kết thúc giữa:

* Một Điều (Article)
* Một Khoản (Clause) 
* Một danh sách điều kiện (nếu có)

Ví dụ:

```text
Chunk A:
"Điều 7. Mức tham chiếu
1. Mức tham chiếu được Chính phủ quyết định
2. Được điều chỉnh hàng năm theo chỉ số giá..."

Chunk B:
"...tiêu dùng (CPI)
3. Được công bố trên trang thông tin..."
```

Khi retrieval chỉ trả về Chunk B, người dùng sẽ mất phần bối cảnh từ Điều 7 phần 1-2.

---

### Giảm Chất Lượng Retrieval

Một số kết quả chứa từ khóa phù hợp ("BHXH", "Điều 7") nhưng nội dung thiếu tính đầy đủ.

---

## Quan Sát Thực Tế

Trên dữ liệu của bạn:

* Retrieval thường tìm đúng chủ đề (Điều nào, Khoản nào).
* Tuy nhiên nhiều chunk bị thiếu ngữ cảnh về điều kiện tiên quyết.
* Ví dụ: Truy vấn "Điều kiện để người nước ngoài đóng BHXH" cần kết hợp từ Điều 2 phần (a), (b), (c) nhưng có thể bị cắt thành 2 chunk.

**Điểm đánh giá: 7.5/10** - Đơn giản nhưng mất ngữ cảnh pháp quy.

---

# Sentence-Based Chunking

## Mô Tả

Phương pháp này chia tài liệu pháp luật theo ranh giới câu tự nhiên, sử dụng regex: `(?<=[.!?])\s+`

Các câu được nhóm lại tối đa 3 câu/chunk để cân bằng kích thước.

Ví dụ trên luatbhxh.md:

```text
Chunk 1: "Điều 2. Phạm vi áp dụng. Khoản 1. ..."
Chunk 2: "Người lao động Việt Nam làm việc... Người lao động nước ngoài..."
Chunk 3: "Cơ quan BHXH có trách nhiệm... Thông tin được công bố..."
```

---

## Kết Quả Trên Tài Liệu Của Bạn

**luatbhxh.md (44,926 ký tự):**
- Số chunk: 121 chunks
- Trung bình: 370.1 ký tự/chunk
- Min-Max: 36-2,613 ký tự (rất biến thiên)

**luatld.md (~54,000 ký tự):**
- Số chunk: 146 chunks
- Trung bình: ~370 ký tự/chunk

**luatvieclam.md (~30,000 ký tự):**
- Số chunk: 74 chunks
- Trung bình: ~405 ký tự/chunk

**Tổng:** 341 chunks

---

## Ưu Điểm Trên Dữ Liệu Pháp Luật

### Giữ Ngữ Nghĩa Tốt Hơn

Chunk không bị cắt giữa câu → giữ được ý của một quy định.

Ví dụ:

```text
Chunk: "Khoản 2. Người lao động nước ngoài có thời hạn 
hợp đồng từ 12 tháng trở lên phải tham gia BHXH bắt buộc."
```

Chunk này tự đủ để trả lời câu hỏi "Người nước ngoài có bắt buộc BHXH?"

### Dễ Kiểm Tra Bằng Tay

Người đánh giá có thể đọc và hiểu từng chunk (mỗi chunk là 1-3 câu).

### Bảo Toàn Cấu Trúc Pháp Luật

Các quy định pháp luật thường viết theo câu hoàn chỉnh → sentence chunking giữ được điều/khoản nguyên vẹn.

---

## Nhược Điểm Trên Dữ Liệu Pháp Luật

### Kích Thước Rất Không Đồng Đều

Min: 36 ký tự (rất ngắn)
Max: 2,613 ký tự (vượt token limit của một số embedding model)

Ví dụ:

```text
Chunk ngắn: "Điều 4."  (36 ký tự)
Chunk dài: "Chế độ BHXH bắt buộc gồm... [danh sách dài]" (2,600 ký tự)
```

### Vấn Đề Với Danh Sách Pháp Luật

Tài liệu pháp luật Việt Nam thường có:

* Danh sách các điều kiện: (a), (b), (c), ...
* Các quy định liên tiếp: "Người A phải... Người B phải..."
* Các điểm liệt kê: "1. ..., 2. ..., 3. ..."

Khi nhiều câu dài được ghép lại, chunk có thể vượt quá kích thước tối ưu.

---

## Quan Sát Thực Tế

Trên dữ liệu của bạn:

* **FAQ pháp luật hoạt động tốt** → câu hỏi "Người nước ngoài bắt buộc BHXH?" → trả về Điều 2 Khoản 2 chính xác ✅
* **Các quy định phức tạp vẫn có vấn đề** → câu hỏi "Chế độ BHXH gồm những gì?" → cần ghép từ Điều 4 + các Điều về chi tiết.

**Kết quả retrieval benchmark:**
- Query 1 (Người nước ngoài): ✅ Score 0.240 - Tìm được Điều 2
- Query 2 (Mức tham chiếu): ✅ Score 0.304 - Tìm được Điều 7
- Query 5 (Chế độ BHXH): ⚠️ Score 0.383 - Tìm được Điều 4 nhưng max_chunk_size = 2,613

**Điểm đánh giá: 8.5/10** - Tốt cho FAQ pháp luật, nhưng biến thiên kích thước là vấn đề.

---

# Recursive Chunking

## Mô Tả

Recursive Chunking cố gắng chia tài liệu theo các ranh giới tự nhiên theo thứ tự ưu tiên:

1. **Section level** - Các Chương, Tiêu
2. **Paragraph level** - Các Điều (Article)
3. **Sentence level** - Các Khoản (Clause)
4. **Character level** - Nếu vẫn vượt chunk_size

Hệ thống sẽ ưu tiên giữ nguyên cấu trúc pháp luật thay vì cắt ngẫu nhiên.

Ví dụ:

```
Chương I. QUY ĐỊNH CHUNG
├─ Điều 1. Phạm vi điều chỉnh
├─ Điều 2. Đối tượng tham gia
└─ Điều 3. Quyền và nghĩa vụ

Chương II. CHỮ KỲ ĐÓNG GÓP
├─ Điều 4. Chế độ BHXH bắt buộc
└─ Điều 5. Mức đóng góp
```

Hệ thống sẽ tạo chunk theo:
- Chunk 1: Toàn bộ Điều 1
- Chunk 2: Toàn bộ Điều 2
- Chunk 3: Toàn bộ Điều 3
- ...

Chỉ khi một Điều vượt chunk_size mới chia tiếp xuống Khoản.

---

## Kết Quả Trên Tài Liệu Của Bạn

**luatbhxh.md (44,926 ký tự):**
- Số chunk: 123 chunks
- Trung bình: 374.9 ký tự/chunk
- Min-Max: ~200-1,000 ký tự (cân bằng hơn)

**Tổng:** ~350 chunks (tương tự Sentence nhưng cân bằng hơn)

---

## Ưu Điểm Trên Dữ Liệu Pháp Luật

### Bảo Toàn Ngữ Cảnh Tốt Nhất

Các ý liên quan (một Điều, một Khoản, một danh sách) thường nằm cùng chunk.

Ví dụ:

```text
Chunk: "Điều 2. Phạm vi áp dụng
Khoản 1. Áp dụng cho người lao động Việt Nam
Khoản 2. Áp dụng cho người lao động nước ngoài 
         có thời hạn hợp đồng từ 12 tháng trở lên"
```

Chunk này trả lời đủ câu hỏi "Người nước ngoài có bắt buộc BHXH không?"

### Tôn Trọng Cấu Trúc Pháp Luật

Tiêu đề, Điều, Khoản được giữ nguyên tốt hơn.

### Kích Thước Hợp Lý

Hiếm khi quá ngắn (36 ký tự) hoặc quá dài (2,600 ký tự).

### Ổn Định Cho Retrieval

Chunk lớn hơn một chút nhưng chứa đủ thông tin → similarity search ổn định hơn.

---

## Nhược Điểm

### Triển Khai Phức Tạp Hơn

Cần:
- Phân tích cấu trúc tài liệu Markdown
- Nhiều bộ phân tách (---section---, ###paragraph###, regex câu)
- Logic xử lý đệ quy

### Phụ Thuộc Cấu Trúc Tài Liệu

Nếu tài liệu pháp luật không có định dạng rõ ràng (tiêu đề không chuẩn, Điều không đánh số) → kết quả sẽ giảm.

---

## Quan Sát Thực Tế

Trên dữ liệu của bạn:

* Các chunk giữ được **nhiều ngữ cảnh nhất**.
* Retrieval **ổn định hơn** - scores tập trung quanh 0.27-0.38 (không quá cao, không quá thấp).
* Câu trả lời cuối cùng thường **cần ít chunk bổ sung** - tự chunk này thường đủ.
* Metadata filtering hiệu quả - ví dụ filter `type="bhxh"` bỏ được các chunk từ luatld.md

**Kết quả retrieval benchmark:**
- Query 2: ✅ Score 0.304 - Tìm được Điều 7 đầy đủ
- Query 4: ✅ Score 0.276 - Tìm được Điều 18 đầy đủ
- Queries 1,3,5: Cần top-5 nhưng thông tin có sẵn

**Điểm đánh giá: 9/10** - **Tốt nhất cho tài liệu pháp luật**

---

# So Sánh Kết Quả

## Khả Năng Bảo Toàn Ngữ Cảnh Pháp Luật

| Chiến lược | Đánh giá | Ví dụ |
|-----------|---------|-------|
| Fixed Size (500) | Trung bình | Cắt giữa Khoản → mất điều kiện tiên quyết |
| Sentence (max 3) | Tốt | Giữ được 1-3 câu hoàn chỉnh |
| Recursive | **Rất tốt** | Giữ nguyên Điều + Khoản + danh sách |

---

## Tính Mạch Lạc Của Chunk (Readability)

| Chiến lược | Đánh giá |
|-----------|---------|
| Fixed Size | Khó đọc - chunk bị cắt giữa |
| Sentence | Tốt - mỗi chunk là 1-3 câu |
| Recursive | **Rất tốt** - mỗi chunk là Điều/Khoản hoàn chỉnh |

---

## Độ Đồng Đều Kích Thước

| Chiến lược | Đánh giá | Chi Tiết |
|-----------|---------|---------|
| Fixed Size | **Rất tốt** | 450-500 ký tự - nhất quán |
| Sentence | Thấp | 36-2,613 ký tự - rất biến thiên |
| Recursive | Tốt | 200-1,000 ký tự - cân bằng |

---

## Chất Lượng Retrieval (Trên 5 Benchmark Queries)

| Chiến lược | Top-1 Found | Score Trung Bình | Đánh Giá |
|-----------|-------------|-----------------|---------|
| Fixed Size | 2/5 (40%) | 0.265 | Khá |
| Sentence | 3/5 (60%) | **0.294** | **Tốt** |
| Recursive | 3/5 (60%) | 0.292 | **Tốt** |

*Ghi chú: Cả Sentence và Recursive đều đạt 3/5, nhưng Recursive chỉ cần top-1 từ các Điều quan trọng hơn.*

---

# Các Trường Hợp Thất Bại Quan Sát Được

## Fixed Size Chunking (2/5 queries)

### Mất Điều Kiện Tiên Quyết

Query: "Người lao động nước ngoài bắt buộc BHXH?"

Gold: Có, nếu hợp đồng ≥12 tháng

Thất bại: Chunk tìm được chứa "người lao động nước ngoài" nhưng không chứa "thời hạn hợp đồng 12 tháng" → không đầy đủ.

---

## Sentence Chunking (3/5 queries)

### Chunk Quá Dài Không Giúp

Query: "Các chế độ BHXH bắt buộc gồm gì?"

Vấn đề: Chunk chứa toàn bộ danh sách chế độ (Ốm, Thai sản, Hưu trí, Tử tuất, TNLĐ & BNN) nhưng similarity score chỉ 0.383 (không top-1, cần top-5).

Lý do: MockEmbedder hash-based → không hiểu "chế độ BHXH" ≈ "bảo hiểm xã hội" (homophones/synonyms).

---

## Recursive Chunking (3/5 queries)

### Cải Thiện Hơn

Nhờ giữ được cấu trúc pháp luật, Recursive chunking giúp retrieval ổn định hơn.

Tuy nhiên vẫn 3/5 top-1 vì **vấn đề embedding** (MockEmbedder), không phải chunking.

---

# Bài Học Rút Ra

Một chiến lược chunking tốt cho tài liệu pháp luật Việt Nam cần cân bằng giữa:

* **Kích thước chunk** - Đủ lớn để có ngữ cảnh, đủ nhỏ để không vượt token limit
* **Khả năng giữ ngữ cảnh** - Không cắt giữa Điều/Khoản/danh sách
* **Tính nhất quán** - Kích thước không biến thiên quá lớn
* **Hiệu quả retrieval** - Scores cao cho câu hỏi liên quan

### **Khuyến Nghị**

Cho hệ thống retrieval tài liệu pháp luật:

✅ **Sử dụng Recursive Chunking** - Tôn trọng cấu trúc pháp luật, ổn định nhất

⚠️ **Nếu tài liệu không có cấu trúc rõ ràng** → Sentence Chunking + metadata filter

❌ **Tránh Fixed Size Chunking** - Cắt giữa quy định → mất ngữ cảnh pháp luật

### **Cải Tiến Tiếp Theo**

Để cải thiện retrieval từ 3/5 lên 5/5:

1. Thay MockEmbedder → **SentenceTransformers** (semantic embedding)
2. Cải thiện Queries → chứa cụ thể "Điều 4", "Khoản 2" thay vì "Chế độ BHXH"
3. Tăng top-k → từ top-1 lên top-5 để có thêm bối cảnh

---

# Kết Luận

Kết quả thử nghiệm cho thấy **Recursive Chunking là lựa chọn tốt nhất** cho hệ thống retrieval tài liệu pháp luật Việt Nam.

| Chiến lược | Điểm | Phù Hợp |
|-----------|------|---------|
| Fixed Size | 7.5/10 | ❌ Không - mất ngữ cảnh pháp luật |
| Sentence | 8.5/10 | ✅ Tốt cho FAQ, nhưng biến thiên |
| Recursive | **9/10** | ✅ **Tốt nhất** - Tôn trọng cấu trúc pháp luật |

Nhóm phát triển nên:

1. **Sử dụng Recursive Chunking** làm chiến lược chính
2. **Tiếp tục đánh giá** trên tập truy vấn thực tế từ người dùng
3. **Theo dõi retrieval thất bại** → điều chỉnh chunk size hoặc embedding model
4. **Nâng cấp embedding** từ MockEmbedder → SentenceTransformers để cải thiện semantic similarity
5. **Cải thiện query format** → người dùng nên cung cấp cụ thể "Điều số bao nhiêu" thay vì "chế độ nào"

Với các cải tiến này, hệ thống có thể đạt **5/5 queries** thay vì hiện tại **3/5**.
