# Báo Cáo Thử Nghiệm Chiến Lược Chunking

## Mục Đích

Báo cáo này trình bày kết quả của một thử nghiệm nhằm đánh giá tác động của các chiến lược chunking khác nhau đến hiệu quả truy xuất thông tin trong hệ thống Retrieval-Augmented Generation (RAG).

Ba phương pháp được đánh giá bao gồm:

1. Fixed-Size Chunking
2. Sentence-Based Chunking
3. Recursive Chunking

Mục tiêu của thử nghiệm là xác định ảnh hưởng của ranh giới chunk đến:

* Chất lượng retrieval
* Khả năng bảo toàn ngữ cảnh
* Tính hữu ích của nội dung được truy xuất
* Trải nghiệm hỏi đáp của người dùng cuối

---

# Thiết Lập Thử Nghiệm

## Bộ Dữ Liệu

Thử nghiệm được thực hiện trên bộ tài liệu tri thức nội bộ bao gồm:

* Tài liệu onboarding
* Runbook vận hành
* Hướng dẫn deployment
* Tài liệu xử lý sự cố
* FAQ nội bộ

Tổng kích thước dữ liệu khoảng vài nghìn từ với nhiều loại cấu trúc tài liệu khác nhau.

---

## Quy Trình Đánh Giá

Đối với mỗi chiến lược chunking:

1. Chia nhỏ toàn bộ tài liệu.
2. Sinh embedding cho từng chunk.
3. Lưu trữ vào vector store.
4. Thực hiện truy vấn bằng cùng một tập câu hỏi.
5. So sánh kết quả retrieval.

Các câu hỏi đánh giá bao gồm:

* Làm thế nào để triển khai Billing API?
* Ai là người sở hữu dịch vụ Checkout?
* Quy trình rollback sau khi deployment thất bại là gì?
* Nhân viên mới cần hoàn thành các bước onboarding nào?

---

# Fixed-Size Chunking

## Mô Tả

Phương pháp này chia tài liệu thành các đoạn có độ dài cố định dựa trên số ký tự hoặc số token.

Ví dụ:

```text
Chunk 1: 500 ký tự đầu tiên
Chunk 2: 500 ký tự tiếp theo
Chunk 3: 500 ký tự tiếp theo
```

---

## Ưu Điểm

### Triển Khai Đơn Giản

Không yêu cầu phân tích cấu trúc tài liệu.

### Kích Thước Đồng Nhất

Các chunk có kích thước gần như tương đương nhau.

### Dễ Điều Chỉnh

Có thể thay đổi chunk size để phù hợp với mô hình embedding hoặc giới hạn context.

---

## Nhược Điểm

### Cắt Ngữ Cảnh Không Hợp Lý

Chunk có thể kết thúc giữa:

* Một câu
* Một danh sách
* Một quy trình nhiều bước

Ví dụ:

```text
Chunk A:
Bước 1. Khởi tạo deployment
Bước 2. Chạy migration

Chunk B:
Bước 3. Khởi động service
Bước 4. Kiểm tra health check
```

Khi retrieval chỉ trả về Chunk B, người dùng sẽ mất phần ngữ cảnh từ các bước trước.

---

### Giảm Chất Lượng Retrieval

Một số kết quả chứa từ khóa phù hợp nhưng thiếu thông tin cần thiết để trả lời đầy đủ câu hỏi.

---

## Quan Sát

Trong bộ dữ liệu thử nghiệm:

* Retrieval thường tìm đúng chủ đề.
* Tuy nhiên nhiều chunk bị thiếu ngữ cảnh.
* Một số câu trả lời yêu cầu nhiều chunk liên tiếp mới đầy đủ.

---

# Sentence-Based Chunking

## Mô Tả

Phương pháp này chia tài liệu theo ranh giới câu tự nhiên.

Ví dụ:

```text
Câu 1.
Câu 2.
Câu 3.
```

Các câu được nhóm lại thành từng chunk có kích thước phù hợp.

---

## Ưu Điểm

### Giữ Ngữ Nghĩa Tốt Hơn

Chunk không bị cắt giữa câu.

### Dễ Kiểm Tra

Người đánh giá có thể đọc và hiểu từng chunk dễ dàng hơn.

### Kết Quả Tự Nhiên

Các đoạn truy xuất thường mạch lạc và dễ sử dụng trong prompt.

---

## Nhược Điểm

### Kích Thước Không Đồng Đều

Một số chunk rất ngắn trong khi một số chunk lại quá dài.

---

### Vấn Đề Với Câu Dài

Các tài liệu kỹ thuật thường có:

* Câu dài
* Danh sách lồng nhau
* Điều kiện phức tạp

Khi nhiều câu dài được ghép lại, chunk có thể vượt quá kích thước tối ưu cho embedding.

---

## Quan Sát

Trong thử nghiệm:

* FAQ và tài liệu chính sách hoạt động rất tốt.
* Các runbook kỹ thuật dài vẫn xuất hiện một số vấn đề về kích thước chunk.

---

# Recursive Chunking

## Mô Tả

Recursive Chunking cố gắng chia tài liệu theo các ranh giới lớn trước:

1. Section
2. Paragraph
3. Sentence
4. Character

Chỉ khi chunk vượt quá giới hạn thì mới tiếp tục chia nhỏ.

Ví dụ:

```markdown
# Deployment Guide

## Prerequisites

...

## Deployment Steps

...

## Rollback Procedure

...
```

Hệ thống sẽ ưu tiên giữ nguyên từng section thay vì cắt ngẫu nhiên.

---

## Ưu Điểm

### Bảo Toàn Ngữ Cảnh

Các ý liên quan thường nằm trong cùng một chunk.

### Tôn Trọng Cấu Trúc Tài Liệu

Tiêu đề, đoạn văn và danh sách được giữ nguyên tốt hơn.

### Kích Thước Hợp Lý

Chunk hiếm khi quá ngắn hoặc quá dài.

---

## Nhược Điểm

### Triển Khai Phức Tạp Hơn

Cần nhiều bước xử lý và nhiều bộ phân tách.

### Phụ Thuộc Cấu Trúc Tài Liệu

Hoạt động hiệu quả nhất khi tài liệu có định dạng rõ ràng.

---

## Quan Sát

Trong bộ dữ liệu thử nghiệm:

* Các chunk giữ được nhiều ngữ cảnh nhất.
* Retrieval ổn định hơn.
* Câu trả lời cuối cùng thường cần ít chunk bổ sung hơn.

---

# So Sánh Kết Quả

## Khả Năng Bảo Toàn Ngữ Cảnh

| Chiến lược | Đánh giá   |
| ---------- | ---------- |
| Fixed Size | Trung bình |
| Sentence   | Tốt        |
| Recursive  | Rất tốt    |

---

## Tính Mạch Lạc Của Chunk

| Chiến lược | Đánh giá   |
| ---------- | ---------- |
| Fixed Size | Trung bình |
| Sentence   | Tốt        |
| Recursive  | Rất tốt    |

---

## Độ Đồng Đều Kích Thước

| Chiến lược | Đánh giá |
| ---------- | -------- |
| Fixed Size | Rất tốt  |
| Sentence   | Thấp     |
| Recursive  | Tốt      |

---

## Chất Lượng Retrieval

| Chiến lược | Đánh giá |
| ---------- | -------- |
| Fixed Size | Khá      |
| Sentence   | Tốt      |
| Recursive  | Rất tốt  |

---

# Các Trường Hợp Thất Bại Quan Sát Được

## Fixed Size Chunking

### Mất Điều Kiện Quan Trọng

Một chunk chứa bước thực hiện nhưng không chứa điều kiện tiên quyết.

Kết quả:

* Retrieval đúng chủ đề.
* Nhưng câu trả lời không đầy đủ.

---

## Sentence Chunking

### Chunk Quá Dài

Một số đoạn hướng dẫn kỹ thuật chứa nhiều câu dài liên tiếp.

Kết quả:

* Embedding kém hiệu quả hơn.
* Similarity score giảm.

---

## Recursive Chunking

### Section Quá Lớn

Trong một số tài liệu không có tiêu đề phụ rõ ràng, chunk vẫn trở nên khá lớn trước khi bị chia tiếp.

Tuy nhiên ảnh hưởng này nhỏ hơn hai chiến lược còn lại.

---

# Bài Học Rút Ra

Một chiến lược chunking tốt cần cân bằng giữa:

* Kích thước chunk
* Khả năng giữ ngữ cảnh
* Tính nhất quán
* Hiệu quả retrieval

Không nên chỉ tối ưu cho một tiêu chí duy nhất.

---

# Kết Luận

Kết quả thử nghiệm cho thấy không tồn tại một chiến lược chunking phù hợp cho mọi loại tài liệu.

Tuy nhiên, đối với bộ tài liệu tri thức nội bộ được sử dụng trong thử nghiệm, Recursive Chunking cho kết quả tốt nhất nhờ khả năng duy trì ngữ cảnh và tận dụng cấu trúc tự nhiên của tài liệu.

Fixed-Size Chunking vẫn là lựa chọn đơn giản và dễ triển khai, trong khi Sentence-Based Chunking là một giải pháp trung gian phù hợp với các tài liệu ngắn hoặc FAQ.

Nhóm phát triển nên tiếp tục đánh giá trên các tập truy vấn thực tế và thường xuyên theo dõi các trường hợp retrieval thất bại để tối ưu chiến lược chunking theo nhu cầu sử dụng thực tế.
