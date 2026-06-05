# Ghi Chú Về Vector Store

Vector Store là một cơ sở dữ liệu hoặc tầng lưu trữ được thiết kế để lưu các vector embedding và truy xuất những mục có mức độ tương đồng cao nhất với một vector truy vấn.

Trong các hệ thống AI hiện đại, Vector Store thường được sử dụng để hỗ trợ:

* Tìm kiếm ngữ nghĩa (Semantic Search)
* Hệ thống gợi ý (Recommendation Systems)
* Phân cụm dữ liệu (Clustering)
* Retrieval-Augmented Generation (RAG)

---

# Quy Trình Hoạt Động Điển Hình

Một quy trình tìm kiếm bằng vector thường bao gồm bốn bước chính:

## 1. Chia nhỏ tài liệu (Chunking)

Các tài liệu lớn được chia thành những đoạn nhỏ hơn nhưng vẫn giữ được ý nghĩa và ngữ cảnh.

Ví dụ:

Một tài liệu dài 50 trang có thể được chia thành hàng trăm đoạn văn nhỏ để thuận tiện cho việc tìm kiếm.

---

## 2. Tạo Embedding

Mỗi đoạn văn được chuyển đổi thành một vector số có nhiều chiều bằng mô hình embedding.

Các vector này đại diện cho ý nghĩa ngữ nghĩa của nội dung thay vì chỉ dựa trên từ khóa.

Ví dụ:

* "Artificial Intelligence"
* "Machine Learning"

có thể có vector gần nhau vì mang ý nghĩa liên quan.

---

## 3. Lưu Trữ Vector Và Metadata

Sau khi tạo embedding, hệ thống lưu:

* Vector embedding
* Nội dung gốc
* Metadata liên quan

Ví dụ metadata:

```json
{
  "source": "rag_guide.md",
  "author": "OpenAI",
  "language": "en",
  "category": "AI"
}
```

Metadata giúp hệ thống lọc dữ liệu hiệu quả hơn trong quá trình truy xuất.

---

## 4. Truy Vấn Và Xếp Hạng

Khi người dùng đặt câu hỏi:

1. Câu hỏi được chuyển thành embedding.
2. Hệ thống tính độ tương đồng với các vector đã lưu.
3. Các kết quả phù hợp nhất được xếp hạng và trả về.

Thông thường các độ đo được sử dụng gồm:

* Cosine Similarity
* Dot Product
* Euclidean Distance

---

# Tầm Quan Trọng Của Chunking

Chất lượng truy xuất phụ thuộc rất lớn vào cách chia nhỏ tài liệu.

## Chunk Quá Nhỏ

Nếu chunk quá ngắn:

* Mất ngữ cảnh
* Thiếu thông tin
* Dễ tạo ra câu trả lời không đầy đủ

Ví dụ:

Một chunk chỉ chứa:

> "85% mức lương chính thức"

sẽ không cho biết đây là quy định về lương thử việc.

---

## Chunk Quá Lớn

Nếu chunk quá dài:

* Chứa nhiều chủ đề khác nhau
* Làm giảm độ chính xác ngữ nghĩa
* Tăng nhiễu trong kết quả tìm kiếm

Ví dụ:

Một chunk chứa cả:

* Thử việc
* Tiền lương
* Nghỉ phép
* Bảo hiểm

sẽ khó xác định nội dung nào thực sự liên quan đến truy vấn.

---

# Vai Trò Của Metadata

Trong nhiều trường hợp, metadata quan trọng không kém embedding.

Các hệ thống thực tế thường lưu:

* Nguồn tài liệu
* Tác giả
* Ngôn ngữ
* Danh mục
* Ngày xuất bản
* Cấp độ truy cập
* Phòng ban phụ trách

---

## Ví Dụ Về Metadata Filtering

Giả sử một công ty có các tài liệu:

* Hướng dẫn kỹ thuật
* Chính sách nhân sự
* Báo cáo sự cố
* Tài liệu hỗ trợ khách hàng

Nếu người dùng hỏi:

> Làm thế nào để reset mật khẩu tài khoản?

Hệ thống có thể giới hạn tìm kiếm chỉ trong nhóm:

```text
category = support
```

thay vì tìm trong toàn bộ kho dữ liệu.

Điều này giúp:

* Giảm nhiễu
* Tăng độ chính xác
* Tăng tốc độ truy xuất

---

# Các Trường Metadata Thường Gặp

| Trường       | Ý nghĩa        |
| ------------ | -------------- |
| source       | Nguồn tài liệu |
| author       | Tác giả        |
| language     | Ngôn ngữ       |
| category     | Danh mục       |
| created_at   | Ngày tạo       |
| updated_at   | Ngày cập nhật  |
| access_level | Quyền truy cập |

---

# Những Rủi Ro Phổ Biến

Vector Store là công cụ mạnh mẽ nhưng không đảm bảo kết quả luôn chính xác.

Nhiều yếu tố có thể làm giảm chất lượng retrieval.

---

## Chunking Kém

Việc chia tài liệu không hợp lý có thể khiến:

* Mất ngữ cảnh
* Tăng nhiễu
* Trả về thông tin không liên quan

---

## Embedding Chất Lượng Thấp

Nếu mô hình embedding không tốt:

* Không hiểu đúng ngữ nghĩa
* Độ tương đồng không phản ánh chính xác nội dung

---

## Thiếu Metadata

Không có metadata phù hợp sẽ khiến:

* Không thể lọc dữ liệu
* Truy xuất nhầm tài liệu
* Kết quả chứa thông tin lỗi thời

---

## Đánh Giá Không Đầy Đủ

Nhiều nhóm chỉ kiểm tra một vài truy vấn đơn giản.

Điều này có thể che giấu các lỗi retrieval nghiêm trọng.

Một hệ thống hoạt động tốt trên 5 câu hỏi không có nghĩa là sẽ hoạt động tốt trong thực tế.

---

# Đánh Giá Chất Lượng Retrieval

Các nhóm phát triển nên:

* Xây dựng bộ câu hỏi thực tế
* Kiểm tra nhiều trường hợp khác nhau
* So sánh retrieval có và không có metadata filter
* Quan sát trực tiếp các chunk được trả về

Ví dụ:

| Query                       | Chunk Trả Về            | Đúng/Sai |
| --------------------------- | ----------------------- | -------- |
| What is a vector store?     | Định nghĩa Vector Store | Đúng     |
| Why use metadata?           | Metadata chapter        | Đúng     |
| What causes poor retrieval? | Chunking chapter        | Đúng     |

---

# Kết Luận

Một hệ thống Retrieval-Augmented Generation hiệu quả không chỉ phụ thuộc vào Vector Store.

Chất lượng retrieval là kết quả của nhiều yếu tố:

* Dữ liệu đầu vào tốt
* Chunking hợp lý
* Embedding chất lượng cao
* Metadata đầy đủ
* Quy trình đánh giá nghiêm ngặt

Nói cách khác, retrieval tốt là thành quả của quá trình chuẩn bị dữ liệu cẩn thận, chứ không đơn thuần là lựa chọn một cơ sở dữ liệu vector phù hợp.
