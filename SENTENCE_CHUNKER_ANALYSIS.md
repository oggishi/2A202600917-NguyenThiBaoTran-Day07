# SentenceChunker Implementation Analysis

## Strategy Overview

**Loại:** SentenceChunker
**Người implement:** Nguyễn Thị Bảo Trân

## Cách Hoạt Động

SentenceChunker chia văn bản dựa trên ranh giới câu bằng cách:

1. **Detect Sentence Boundaries:** Sử dụng regex pattern `(?<=[.!?])\s+` để tìm ranh giới câu
   - Tìm dấu kết thúc câu (`.`, `!`, `?`) theo sau là whitespace
   
2. **Split into Sentences:** Tách text thành danh sách các câu
   - Loại bỏ các câu rỗng bằng `if s.strip()`
   
3. **Group into Chunks:** Nhóm các câu thành chunks
   - Mỗi chunk chứa tối đa `max_sentences_per_chunk` câu
   - Các câu được join lại bằng dấu cách

## Ưu Điểm

✅ **Bảo toàn ngữ pháp:** Không cắt ngang giữa câu  
✅ **Ngữ cảnh tốt:** Mỗi chunk là một hoặc nhiều câu hoàn chỉnh  
✅ **Phù hợp cho legal:** Văn bản pháp luật có câu ngữ pháp rõ ràng  

## Nhược Điểm

❌ **Độ dài không ổn định:** Chunks có thể từ 36 đến 2,613 ký tự  
❌ **Vượt token limit:** Một số chunks có thể vượt quá context window của LLM  
❌ **Mất ngữ cảnh rộng:** Cắt theo câu có thể mất ý nghĩa chung của một điều khoản  

## So Sánh Các Strategies (luatbhxh.md)

| Strategy | Chunks | Avg Length | Min | Max | Ưu Điểm | Nhược Điểm |
|----------|--------|-----------|-----|-----|---------|-----------|
| **FixedSizeChunker** | 100 | 498.8 | 376 | 500 | Độ dài ổn định | Cắt ngang câu |
| **SentenceChunker** | 121 | 370.1 | 36 | 2,613 | Giữ nguyên câu | Độ dài không ổn định |
| **RecursiveChunker** | 123 | 374.9 | 3 | 501 | Giữ paragraph | Có thể quá nhỏ |

## Khuyến Nghị

Cho domain pháp lý Việt Nam, **SentenceChunker** là lựa chọn tốt, nhưng nên thêm bước xử lý:

```python
def chunking_with_token_limit(text, max_tokens=1000):
    chunker = SentenceChunker(max_sentences_per_chunk=3)
    chunks = chunker.chunk(text)
    
    # Re-split chunks that are too long
    result = []
    for chunk in chunks:
        if len(chunk) > max_tokens:
            # Further split using RecursiveChunker
            recursive = RecursiveChunker(chunk_size=max_tokens)
            result.extend(recursive.chunk(chunk))
        else:
            result.append(chunk)
    return result
```

## Test Results

✅ Tất cả 42 tests pass  
✅ SentenceChunker implementation hoạt động chính xác  
✅ Phù hợp với dataset pháp luật Việt Nam  

## Statistics Across All Documents

| Document | Chars | Chunks | Avg Length | Max Length |
|----------|-------|--------|------------|-----------|
| Luật BHXH | 44,926 | 121 | 370.1 | 2,613 |
| Luật Lao Động | 51,713 | 146 | 353.0 | 1,506 |
| Luật Việc Làm | 25,297 | 74 | 340.9 | 1,364 |
| Chương 4 BHXH | 34,302 | 75 | 456.2 | 1,658 |
| Mục 2 BHXH | 17,184 | 38 | 451.0 | 1,612 |

## Kết Luận

SentenceChunker là một lựa chọn **tốt cho pháp luật** vì:
- Giữ trọn vẹn các câu pháp lý
- Không cắt ngang quy định quan trọng
- Dễ implement và hiểu

Tuy nhiên, để production-ready, nên kết hợp với RecursiveChunker để xử lý các chunks quá dài.
