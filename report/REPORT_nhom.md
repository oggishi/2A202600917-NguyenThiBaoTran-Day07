# Báo Cáo Lab 7: Embedding & Vector Store

**Họ tên:** Nguyễn Thành Đạt-2A202600771
**Nhóm:** Trần Bá Đạt - 2A202600778, Nguyễn Thị Bảo Trân - 2A202600917, Nguyễn Thành Đạt - 2A202600771
**Ngày:** 05/06/2026

---

## 1. Warm-up (5 điểm)

### Cosine Similarity (Ex 1.1)

**High cosine similarity nghĩa là gì?**
> *Viết 1-2 câu:* Là hai đoạn văn bản có ý nghĩa hoặc cấu trúc từ ngữ rất giống nhau, vector của chúng nằm cùng hướng (góc rất nhỏ) trong không gian vector đa chiều.

**Ví dụ HIGH similarity:**
- Sentence A: Mức lương tối thiểu vùng do Chính phủ quy định dựa trên điều kiện kinh tế.
- Sentence B: Chính phủ là cơ quan quy định mức lương tối thiểu vùng theo tình hình kinh tế.
- Tại sao tương đồng: Dùng từ vựng và mang ý nghĩa hoàn toàn giống nhau, chỉ khác cấu trúc chủ - vị.

**Ví dụ LOW similarity:**
- Sentence A: Mức lương tối thiểu vùng do Chính phủ quy định dựa trên điều kiện kinh tế.
- Sentence B: Con mèo đang ngủ ngon lành trên chiếc ghế sofa ngoài phòng khách.
- Tại sao khác: Hai câu hoàn toàn không liên quan về chủ đề, ngữ nghĩa và từ vựng.

**Tại sao cosine similarity được ưu tiên hơn Euclidean distance cho text embeddings?**
> *Viết 1-2 câu:* Vì Cosine Similarity chỉ quan tâm đến hướng của vector (độ tương đồng ngữ nghĩa) mà không bị ảnh hưởng bởi độ dài của văn bản (magnitude), giúp so sánh câu ngắn và đoạn văn dài một cách công bằng hơn.

### Chunking Math (Ex 1.2)

**Document 10,000 ký tự, chunk_size=500, overlap=50. Bao nhiêu chunks?**
> *Trình bày phép tính:* num_chunks = ceil((10000 - 50) / (500 - 50)) = ceil(9950 / 450) = 22.11 -> 23 chunks.
> *Đáp án:* 23 chunks.

**Nếu overlap tăng lên 100, chunk count thay đổi thế nào? Tại sao muốn overlap nhiều hơn?**
> *Viết 1-2 câu:* Nếu overlap = 100, số chunk = ceil(9900 / 400) = 25 chunks (tăng lên). Việc tăng overlap giúp đảm bảo rằng thông tin ở ranh giới giữa các chunk không bị cắt đứt, duy trì ngữ cảnh cho câu trả lời tốt hơn.

---

## 2. Document Selection — Nhóm (10 điểm)

### Domain & Lý Do Chọn

**Domain:** Văn bản pháp luật Việt Nam (Luật Bảo hiểm xã hội, Luật Lao động, Luật Việc làm).

**Tại sao nhóm chọn domain này?**
> *Viết 2-3 câu:* Văn bản luật có cấu trúc rất rõ ràng, logic và phân chia theo "Điều, Khoản". Khi làm retrieval, yêu cầu độ chính xác rất cao để trả lời các câu hỏi pháp lý thực tế, giúp nhóm dễ dàng đánh giá tính hiệu quả của các chunking strategies.

### Data Inventory

| # | Tên tài liệu | Nguồn | Số ký tự | Metadata đã gán |
|---|--------------|-------|----------|-----------------|
| 1 | luatbhxh.md | Cổng TTĐT Quốc hội | ~61.000 | `domain: bhxh`, `type: luat_toan_van` |
| 2 | luatld.md | Cổng TTĐT Quốc hội | ~70.000 | `domain: lao_dong`, `type: luat_toan_van` |
| 3 | luatvieclam.md | Cổng TTĐT Quốc hội | ~33.000 | `domain: viec_lam`, `type: luat_toan_van` |
| 4 | c4_bhxh.md | Trích lục từ Luật | ~46.000 | `domain: bhxh`, `type: trich_luc_chuong` |
| 5 | muc2_bhxh.md | Trích lục từ Luật | ~23.000 | `domain: bhxh`, `type: trich_luc_muc` |

### Metadata Schema

| Trường metadata | Kiểu | Ví dụ giá trị | Tại sao hữu ích cho retrieval? |
|----------------|------|---------------|-------------------------------|
| `domain` | string | `bhxh`, `lao_dong` | Giúp lọc nhanh khi người dùng hỏi đích danh "Trong luật lao động quy định..." |
| `type` | string | `luat_toan_van` | Giúp agent phân biệt giữa văn bản gốc và các phần trích lục chi tiết. |

---

## 3. Chunking Strategy — Cá nhân chọn, nhóm so sánh (15 điểm)

### Baseline Analysis

Chạy `ChunkingStrategyComparator().compare()` trên 2-3 tài liệu:

| Tài liệu | Strategy | Chunk Count | Avg Length | Preserves Context? |
|-----------|----------|-------------|------------|-------------------|
| luatbhxh | FixedSizeChunker (`fixed_size`) | 320 | 200.0 | Thường cắt đứt giữa câu, ngữ cảnh rời rạc |
| luatbhxh | SentenceChunker (`by_sentences`) | 215 | 280.5 | Câu nguyên vẹn nhưng đôi lúc mất ý nghĩa bao quát |
| luatbhxh | RecursiveChunker (`recursive`) | 240 | 250.2 | Tốt, giữ được các đoạn văn hoàn chỉnh nhất |

### Strategy Của Tôi (Nguyễn Thành Đạt)

**Loại:** FixedSizeChunker

**Mô tả cách hoạt động:**
> *Viết 3-4 câu:* Chiến lược này cắt văn bản thành các phần bằng nhau dựa trên số lượng ký tự tối đa (`chunk_size`). Để hạn chế việc ngữ nghĩa bị cắt đứt đột ngột giữa chừng, thuật toán sử dụng một khoảng gối đầu (`overlap`) lặp lại một số lượng ký tự ở chunk trước đó. Quá trình chia diễn ra theo kiểu cửa sổ trượt cho đến khi duyệt hết văn bản.

**Tại sao tôi chọn strategy này cho domain nhóm?**
> *Viết 2-3 câu:* Văn bản luật có dung lượng rất lớn. `FixedSizeChunker` giúp dễ dàng kiểm soát cứng kích thước dữ liệu đầu vào cho mỗi vector, đảm bảo không bao giờ vượt quá giới hạn token (context window) của LLM khi làm RAG, rất phù hợp để làm baseline đối sánh với các phương pháp chia phức tạp khác.

### So Sánh: Strategy của tôi vs Baseline

| Tài liệu | Strategy | Chunk Count | Avg Length | Retrieval Quality? |
|-----------|----------|-------------|------------|--------------------|
| luatbhxh | best baseline (`SentenceChunker`) | 215 | 280.5 | Khá, nhưng đôi khi mất sự liên kết liền mạch giữa các khoản mục với nhau do chia theo dấu câu. |
| luatbhxh | **của tôi** (`FixedSizeChunker`) | 320 | 200.0 | Thấp hơn do thường xuyên cắt ngang giữa câu hoặc giữa điều khoản. |

### So Sánh Với Thành Viên Khác

| Thành viên | Strategy | Retrieval Score (/10) | Điểm mạnh | Điểm yếu |
|-----------|----------|----------------------|-----------|----------|
| **Tôi (Thành Đạt)** | FixedSizeChunker | 8.5/10 | Độ dài chunk rất ổn định, không lo vượt quá token LLM. | Thường xuyên cắt đứt giữa câu, RAG bị sai lệch ý nghĩa. |
| Bá Đạt | RecursiveChunker | 9/10 | Giữ được cấu trúc đoạn văn, không cắt giữa Điều khoản. | Đôi khi chunk vẫn bị quá nhỏ do nhiều dấu xuống dòng. |
| Bảo Trân | SentenceChunker | 8.5/10 | Luôn giữ trọn vẹn ngữ pháp câu. | Các câu luật liên kết chặt chẽ với nhau, cắt theo câu gây mất ngữ cảnh lớn. |

**Strategy nào tốt nhất cho domain này? Tại sao?**
> *Viết 2-3 câu:* RecursiveChunker là tốt nhất, vì nó ưu tiên cắt theo paragraph (`\n\n`), vô tình rất phù hợp với cách trình bày Điều, Khoản của văn bản pháp luật, qua đó bảo toàn trọn vẹn ý nghĩa pháp lý.

---

## 4. My Approach — Cá nhân (10 điểm)

Giải thích cách tiếp cận của bạn khi implement các phần chính trong package `src`.

### Chunking Functions

**`SentenceChunker.chunk`** — approach:
> Dùng regex `re.split(r'(\. |\! |\? |\.\n)', text)` để tách câu trong khi vẫn giữ lại dấu câu. Sau đó nhóm các câu lại theo `max_sentences_per_chunk`. Xử lý edge case cuối chuỗi để không bị mất câu nào.

**`RecursiveChunker.chunk` / `_split`** — approach:
> Sử dụng thuật toán đệ quy. Trong hàm `_split`, duyệt qua mảng separators. Với separator đầu tiên, thử `split` văn bản, sau đó gom các phần lại cho đến khi đạt `chunk_size`. Nếu có phần nào vẫn vượt `chunk_size`, đệ quy gọi `_split` với mảng `separators[1:]`. Base case là khi chuỗi đã ngắn hơn `chunk_size` hoặc hết separator.

### EmbeddingStore

**`add_documents` + `search`** — approach:
> `add_documents` tự động tạo `doc_id` vào `metadata` để dễ quản lý, sau đó tính embedding rồi lưu vào dict trong bộ nhớ hoặc ChromaDB. `search` tính toán embedding của query, loop qua toàn bộ store, chấm điểm bằng `compute_similarity`, sort giảm dần và lấy top_k.

**`search_with_filter` + `delete_document`** — approach:
> `search_with_filter` chạy thao tác filter qua metadata trước (bằng list comprehension) để giảm không gian tìm kiếm, sau đó mới gọi hàm search vector. `delete_document` filter bỏ những record có `metadata["doc_id"] == doc_id`.

### KnowledgeBaseAgent

**`answer`** — approach:
> Agent lấy câu hỏi, gọi `store.search` để lấy ra top 3 chunks liên quan nhất. Dùng list comprehension để extract trường `"content"`, nối lại bằng `\n\n` làm `Context:`. Cuối cùng nối thêm câu hỏi và prompt LLM trả lời.

### Test Results

```
============================= 42 passed in 0.11s ==============================
```

**Số tests pass:** 42 / 42

---

## 5. Similarity Predictions — Cá nhân (5 điểm)

| Pair | Sentence A | Sentence B | Dự đoán | Actual Score | Đúng? |
|------|-----------|-----------|---------|--------------|-------|
| 1 | Người lao động được nghỉ phép năm | Nhân viên có quyền hưởng phép năm | high | 0.8241 | Có |
| 2 | Mức lương tối thiểu vùng | Lương hưu hàng tháng | low | 0.2834 | Có |
| 3 | Người sử dụng lao động phải đóng BHXH | Giám đốc công ty đóng bảo hiểm xã hội | high | 0.7612 | Có |
| 4 | Hợp đồng lao động không xác định thời hạn | Hợp đồng mua bán hàng hoá | low | 0.3105 | Có |
| 5 | Chế độ thai sản cho lao động nữ | Phụ nữ mang thai được hưởng bảo hiểm | high | 0.7958 | Có |

**Kết quả nào bất ngờ nhất? Điều này nói gì về cách embeddings biểu diễn nghĩa?**
> *Viết 2-3 câu:* Bất ngờ nhất là Pair 3, model hiểu được "Người sử dụng lao động" và "Giám đốc công ty" có mối quan hệ tương đồng cao trong ngữ cảnh đóng bảo hiểm. Điều này cho thấy embedding không chỉ match từ vựng mà còn hiểu được các khái niệm ngữ nghĩa và thực thể tương đương nhau.

---

## 6. Results — Cá nhân (10 điểm)

### Benchmark Queries & Gold Answers (nhóm thống nhất)

| # | Query | Gold Answer | Chunk nào chứa thông tin? |
|---|-------|-------------|--------------------------|
| 1 | Người lao động nước ngoài làm việc tại VN có bắt buộc tham gia BHXH không? | Có, nếu làm việc theo hợp đồng từ đủ 12 tháng trở lên (trừ di chuyển nội bộ hoặc đã đủ tuổi nghỉ hưu). | `luatbhxh.md` - Khoản 2 Điều 2 |
| 2 | Mức tham chiếu trong bảo hiểm xã hội là gì? | Là mức tiền do Chính phủ quyết định dùng để tính mức đóng/hưởng, điều chỉnh dựa trên CPI. | `luatbhxh.md` - Điều 7 |
| 3 | **[Metadata Filter: `domain=viec_lam`]** Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp? | Chậm đóng, trốn đóng, chiếm dụng, gian lận, sử dụng sai quỹ. | `luatvieclam.md` - Điều 9 |
| 4 | Cơ quan bảo hiểm xã hội có trách nhiệm gì đối với thông tin của người tham gia? | Định kỳ hằng tháng cung cấp thông tin qua phương tiện điện tử và xác nhận thông tin khi có yêu cầu. | `luatbhxh.md` - Điều 18 |
| 5 | Các chế độ của BHXH bắt buộc gồm những gì? | Ốm đau, thai sản, hưu trí, tử tuất, bảo hiểm TNLĐ & BNN. | `luatbhxh.md` - Điều 4 |

### Kết Quả Của Tôi (FixedSizeChunker)

| # | Query | Top-1 Retrieved Chunk (tóm tắt) | Score | Relevant? | Agent Answer (tóm tắt) |
|---|-------|--------------------------------|-------|-----------|------------------------|
| 1 | Người lao động nước ngoài làm việc tại VN có bắt buộc tham gia BHXH không? | [Bị cắt nửa đoạn] Người lao động nước ngoài làm việc... từ đủ 12 th... | 0.81 | Có | Có, tham gia khi làm việc từ đủ 12 tháng. |
| 2 | Mức tham chiếu trong bảo hiểm xã hội là gì? | Điều 7: Mức tham chiếu là mức tiền do Chí... [hết chunk] | 0.84 | Có | Mức tiền Chính phủ quyết định dùng để tính mức đóng. |
| 3 | Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp? | ...cấm: Trốn đóng, chiếm dụng quỹ BHXH, giả mạo... | 0.83 | Có | Trốn đóng, chiếm dụng tiền, gian lận hồ sơ. |
| 4 | Cơ quan bảo hiểm xã hội có trách nhiệm gì đối với thông tin của người tham gia? | ...trách nhiệm... cung cấp thông tin điện tử hàng tháng... | 0.80 | Có | Cung cấp thông tin hàng tháng cho người tham gia. |
| 5 | Các chế độ của BHXH bắt buộc gồm những gì? | ...độ: Ốm đau, thai sản, hưu trí, tử tuất, bảo hiể... | 0.88 | Có | Ốm đau, thai sản, hưu trí, tử tuất, tai nạn lao động. |

**Bao nhiêu queries trả về chunk relevant trong top-3?** 5 / 5

**Đánh giá Metadata Utility (Tiêu chí 3 trong EVALUATION.md):**
Ở Query 3 ("Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp?"), nếu chỉ dùng hàm `search()` thông thường, kết quả bị nhiễu do hệ thống trả về các hành vi bị nghiêm cấm của Luật BHXH nói chung (từ file `luatbhxh.md`). Tuy nhiên, khi áp dụng `search_with_filter` với tham số `{"domain": "viec_lam"}`, kết quả ngay lập tức khoanh vùng chính xác vào file `luatvieclam.md`, loại bỏ hoàn toàn các chunk nhiễu và đẩy Retrieval Precision lên tuyệt đối.

---

## 7. What I Learned (5 điểm — Demo)

### Failure Analysis
**Query thất bại:** Người lao động nước ngoài làm việc tại VN có bắt buộc tham gia BHXH không?
**Tại sao thất bại:** Chunk bị cắt ngang ngay giữa nội dung quy định chi tiết về đối tượng áp dụng (Điều 2). `FixedSizeChunker` đã cắt đứt mất đoạn điều kiện "trừ trường hợp di chuyển nội bộ" vì hết độ dài `chunk_size`.
**Đề xuất cải thiện:** Chuyển sang sử dụng `RecursiveChunker` hoặc `CustomChunker` theo Điều/Khoản để bảo toàn trọn vẹn ngữ cảnh pháp lý trong một chunk duy nhất, không bị giới hạn cứng bởi số lượng ký tự.

**Điều hay nhất tôi học được từ thành viên khác trong nhóm:**
> Qua kết quả của Bá Đạt (dùng RecursiveChunker), mình thấy việc cắt khéo léo theo ký tự đoạn văn (`\n\n`) quan trọng hơn rất nhiều so với cắt cứng theo số ký tự. Dù Fixed Size kiểm soát dung lượng tốt nhưng khiến RAG bị thiếu thông tin ở hai đầu câu trả lời.

**Điều hay nhất tôi học được từ nhóm khác (qua demo):**
> Một nhóm khác sử dụng "Custom Chunker" bằng regex để chia văn bản theo "Điều X, Khoản Y". Cách này đặc biệt hiệu quả với văn bản Luật vì kết quả trả về cho LLM vô cùng sạch sẽ và rõ ràng, không bị lẫn lộn giữa các điều kiện pháp lý.

**Nếu làm lại, tôi sẽ thay đổi gì trong data strategy?**
> Mình sẽ bỏ FixedSizeChunker và chuyển sang Custom Chunker. Đồng thời, mình sẽ gắn thêm siêu dữ liệu (metadata) chi tiết hơn như số thứ tự Điều, Chương để Agent có thể trực tiếp trích dẫn nguồn luật ("Theo khoản 1 Điều 2 Luật BHXH...") giúp câu trả lời uy tín hơn.

---

## Tự Đánh Giá

| Tiêu chí | Loại | Điểm tự đánh giá |
|----------|------|-------------------|
| Warm-up | Cá nhân | 5 / 5 |
| Document selection | Nhóm | 10 / 10 |
| Chunking strategy | Nhóm | 15 / 15 |
| My approach | Cá nhân | 10 / 10 |
| Similarity predictions | Cá nhân | 5 / 5 |
| Results | Cá nhân | 10 / 10 |
| Core implementation (tests) | Cá nhân | 30 / 30 |
| Demo | Nhóm | 5 / 5 |
| **Tổng** | | **100 / 100** |
