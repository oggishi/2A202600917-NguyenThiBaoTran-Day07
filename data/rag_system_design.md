# Thiết Kế Hệ Thống RAG Cho Trợ Lý Tri Thức Nội Bộ

## Bối Cảnh

Một nhóm phát triển sản phẩm muốn xây dựng một trợ lý AI có khả năng trả lời các câu hỏi liên quan đến:

* Quy trình onboarding nhân viên mới
* Quy trình triển khai hệ thống (deployment)
* Quyền sở hữu dịch vụ (service ownership)
* Quy trình xử lý sự cố (incident response)

Hiện nay, các tài liệu của công ty được lưu trữ dưới nhiều định dạng khác nhau như:

* Sổ tay nội bộ (Markdown Handbook)
* Runbook kỹ thuật
* Wiki dự án
* Tài liệu vận hành
* Ghi chú hỗ trợ khách hàng

Do dữ liệu nằm rải rác ở nhiều thư mục và nền tảng khác nhau, nhân viên thường mất nhiều thời gian để tìm kiếm thông tin cần thiết.

---

# Mục Tiêu Hệ Thống

Hệ thống cần áp dụng phương pháp Retrieval-Augmented Generation (RAG) để:

1. Tìm kiếm các tài liệu liên quan trước khi tạo câu trả lời.
2. Giảm thiểu hiện tượng hallucination.
3. Cung cấp khả năng truy vết nguồn thông tin.
4. Đảm bảo câu trả lời được xây dựng dựa trên bằng chứng từ tài liệu nội bộ.

Trợ lý phải phân biệt rõ:

* Nội dung được truy xuất từ tài liệu.
* Nội dung được tổng hợp bởi mô hình ngôn ngữ.

Nếu không có đủ bằng chứng hoặc có sự mâu thuẫn giữa các nguồn dữ liệu, hệ thống cần thông báo điều đó thay vì đưa ra câu trả lời thiếu căn cứ.

---

# Kiến Trúc Tổng Quan

Hệ thống được chia thành ba tầng chính:

1. Ingestion Layer
2. Retrieval Layer
3. Application Layer

```text
User Question
      |
      v
Retrieval Layer
      |
      v
Relevant Chunks
      |
      v
Application Layer
      |
      v
Answer + Evidence
```

---

# Ingestion Layer

## Mục Đích

Tầng nạp dữ liệu chịu trách nhiệm:

* Đọc tài liệu nguồn
* Chia nhỏ tài liệu
* Tạo embedding
* Lưu dữ liệu vào vector store

---

## Nguồn Dữ Liệu

Các nguồn dữ liệu đáng tin cậy bao gồm:

* Markdown handbook
* Technical runbook
* Incident playbook
* Deployment guide
* Service ownership registry

Ví dụ:

```text
docs/
├── onboarding/
├── deployment/
├── runbooks/
├── ownership/
└── incidents/
```

---

## Chunking Strategy

Tài liệu sẽ được chia thành các chunk có ý nghĩa ngữ nghĩa.

Ví dụ:

```markdown
# Billing API Deployment

## Prerequisites

...

## Deployment Steps

...

## Rollback Procedure

...
```

Mỗi section có thể được tách thành một hoặc nhiều chunk riêng biệt.

---

## Metadata

Mỗi chunk cần được lưu cùng metadata.

Ví dụ:

```json
{
  "source_path": "runbooks/billing_api.md",
  "document_id": "billing-api-runbook",
  "document_type": "runbook",
  "department": "platform"
}
```

---

## Lợi Ích Của Metadata

Metadata giúp:

* Lọc dữ liệu theo phòng ban
* Giảm nhiễu khi truy xuất
* Hỗ trợ truy vết nguồn
* Hỗ trợ phân tích lỗi retrieval

---

# Retrieval Layer

## Mục Đích

Tầng retrieval chịu trách nhiệm:

1. Chuyển đổi câu hỏi thành embedding.
2. Tìm kiếm các vector tương đồng.
3. Áp dụng metadata filtering.
4. Trả về các chunk liên quan nhất.

---

## Quy Trình Retrieval

### Bước 1

Người dùng đặt câu hỏi:

> Làm thế nào để triển khai Billing API?

---

### Bước 2

Câu hỏi được embedding:

```text
Question
    ↓
Embedding Vector
```

---

### Bước 3

Vector store thực hiện similarity search.

Ví dụ:

| Chunk              | Similarity Score |
| ------------------ | ---------------- |
| Billing Deployment | 0.92             |
| Rollback Guide     | 0.87             |
| Checkout API       | 0.61             |

---

### Bước 4

Top-k chunks được trả về.

Ví dụ:

```text
1. Billing Deployment Guide
2. Billing Rollback Procedure
3. Platform Deployment Checklist
```

---

## Metadata Filtering

Nếu câu hỏi liên quan đến một phòng ban cụ thể:

> Ai sở hữu dịch vụ Checkout?

Hệ thống có thể áp dụng:

```json
{
  "department": "payments"
}
```

Điều này giúp giảm số lượng tài liệu không liên quan.

---

# Application Layer

## Vai Trò

Tầng ứng dụng kết hợp:

* Câu hỏi người dùng
* Các chunk được truy xuất
* Prompt hướng dẫn mô hình

để tạo ra câu trả lời cuối cùng.

---

## Prompting Strategy

Ví dụ:

```text
Bạn là trợ lý tri thức nội bộ.

Chỉ sử dụng thông tin được cung cấp trong phần Context.

Nếu thông tin không đủ hoặc có mâu thuẫn giữa các nguồn,
hãy nói rõ điều đó.

Không tự suy đoán.
```

---

## Cấu Trúc Trả Lời

Câu trả lời nên gồm hai phần:

### Evidence

Thông tin được lấy trực tiếp từ tài liệu.

### Summary

Phần tổng hợp ngắn gọn do mô hình ngôn ngữ tạo ra.

Ví dụ:

```text
Evidence:
- Billing API deployment yêu cầu approval từ Platform Team.
- Rollback script nằm trong repository deployment-tools.

Summary:
Để triển khai Billing API, cần hoàn thành bước approval và sử dụng quy trình triển khai được mô tả trong runbook.
```

---

# Kế Hoạch Đánh Giá

## Mục Tiêu

Đánh giá không chỉ chất lượng câu trả lời mà còn chất lượng retrieval.

---

## Bộ Câu Hỏi Kiểm Thử

### Query 1

Làm thế nào để triển khai Billing API?

---

### Query 2

Ai là người sở hữu dịch vụ Checkout?

---

### Query 3

Quy trình rollback sau khi deployment thất bại là gì?

---

### Query 4

Nhân viên mới cần hoàn thành những bước onboarding nào?

---

### Query 5

Làm thế nào để tạo access token cho môi trường staging?

---

# Tiêu Chí Thành Công

## Retrieval Relevance

Các chunk được truy xuất có liên quan đến câu hỏi hay không.

---

## Source Traceability

Người dùng có thể biết thông tin đến từ tài liệu nào hay không.

---

## Freshness

Thông tin có còn cập nhật hay không.

---

## Consistency

Các nguồn dữ liệu có mâu thuẫn với nhau hay không.

---

# So Sánh Chiến Lược Chunking

## Fixed Size Chunking

Ưu điểm:

* Đơn giản
* Dễ triển khai

Nhược điểm:

* Có thể cắt giữa các ý quan trọng

---

## Sentence Chunking

Ưu điểm:

* Giữ nguyên cấu trúc câu

Nhược điểm:

* Có thể tách rời các thông tin liên quan

---

## Recursive Chunking

Ưu điểm:

* Tôn trọng cấu trúc tài liệu
* Giữ ngữ cảnh tốt hơn

Nhược điểm:

* Phức tạp hơn trong triển khai

---

# Đánh Giá Metadata Filtering

Nhóm phát triển nên so sánh:

## Không Có Metadata Filter

Tìm kiếm trên toàn bộ kho dữ liệu.

---

## Có Metadata Filter

Ví dụ:

```json
{
  "department": "platform"
}
```

Hoặc:

```json
{
  "document_type": "runbook"
}
```

Sau đó đo lường sự khác biệt về:

* Precision
* Recall
* Relevance

---

# Các Trường Hợp Thất Bại Thường Gặp

## Tài Liệu Cũ Được Ưu Tiên

Runbook cũ có điểm tương đồng cao hơn tài liệu hiện hành.

Hệ quả:

* Trả lời sai quy trình hiện tại.

---

## Chunk Quá Nhỏ

Các điều kiện hoặc cảnh báo quan trọng bị tách khỏi nội dung chính.

Hệ quả:

* Mô hình tạo câu trả lời thiếu thông tin.

---

## Chunk Quá Lớn

Một chunk chứa nhiều chủ đề khác nhau.

Hệ quả:

* Similarity search trở nên kém chính xác.

---

## Dữ Liệu Đa Ngôn Ngữ

Ví dụ:

* Runbook tiếng Anh
* Tài liệu hỗ trợ tiếng Việt

Embedding có thể không biểu diễn chính xác mối quan hệ giữa các ngôn ngữ.

---

# Các Yếu Tố Vận Hành

## Re-indexing

Khi tài liệu thay đổi:

* Embedding cần được cập nhật.
* Vector store cần được đồng bộ.

---

## Xóa Tài Liệu

Khi tài liệu bị loại bỏ:

* Chunk liên quan phải được xóa.
* Tránh retrieval dữ liệu lỗi thời.

---

## Source Freshness

Hệ thống nên theo dõi:

* Ngày cập nhật cuối cùng
* Phiên bản tài liệu
* Trạng thái hiệu lực

---

# Logging Và Audit

Đối với mỗi câu trả lời, hệ thống nên ghi lại:

* Query gốc
* Embedding query
* Top-k chunks
* Metadata của các chunk
* Prompt được tạo
* Câu trả lời cuối cùng

Ví dụ:

```json
{
  "query": "Who owns Checkout Service?",
  "retrieved_chunks": [
    "ownership_001",
    "ownership_014",
    "team_registry_003"
  ]
}
```

Điều này giúp đội ngũ phát triển dễ dàng:

* Debug hệ thống
* Đánh giá retrieval
* Phân tích lỗi
* Cải thiện prompt

---

# Kết Luận

Một hệ thống RAG hiệu quả không chỉ phụ thuộc vào mô hình ngôn ngữ mà còn phụ thuộc vào chất lượng dữ liệu, chiến lược chunking, metadata và quy trình đánh giá.

Việc lưu lại bằng chứng truy xuất, đánh giá các trường hợp thất bại và liên tục cập nhật nguồn dữ liệu sẽ giúp trợ lý tri thức nội bộ trở nên chính xác, đáng tin cậy và hữu ích hơn đối với toàn bộ tổ chức.
