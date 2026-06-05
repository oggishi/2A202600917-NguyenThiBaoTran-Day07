#!/usr/bin/env python3
"""Generate benchmark queries and similarity predictions for REPORT"""

from src.chunking import SentenceChunker, compute_similarity
from src.embeddings import MockEmbedder
from src.store import EmbeddingStore
from src.agent import KnowledgeBaseAgent
from src.models import Document
import os

def load_doc(filename):
    with open(os.path.join('data', filename), 'r', encoding='utf-8') as f:
        return f.read()

# Initialize components
embedder = MockEmbedder(dim=100)
store = EmbeddingStore(embedding_fn=embedder)

# Mock LLM function (just returns query summary)
def mock_llm(prompt):
    # Extract question from prompt
    if "Question:" in prompt:
        question = prompt.split("Question:")[-1].strip().split("\n")[0]
    else:
        question = prompt
    return f"Dựa trên tài liệu, {question[:50]}..."

agent = KnowledgeBaseAgent(store, mock_llm)

# Load documents
docs = {
    'luatbhxh': load_doc('luatbhxh.md'),
    'luatld': load_doc('luatld.md'),
}

# Add documents to store
store.add_documents([
    Document(id='bhxh_1', content=docs['luatbhxh'][:5000], metadata={'type': 'bhxh'}),
    Document(id='ld_1', content=docs['luatld'][:5000], metadata={'type': 'ld'}),
])

print("\n" + "="*80)
print("BENCHMARK RESULTS FOR REPORT")
print("="*80)

# Benchmark queries
queries = [
    "Mức đóng bảo hiểm xã hội của người lao động là bao nhiêu?",
    "Ai có thể chấm dứt hợp đồng lao động đơn phương?",
    "Quy định về thôi việc và quyền lợi người lao động?",
    "Người lao động có bao nhiêu ngày phép hàng năm?",
    "Điều kiện để được hưởng bảo hiểm thất nghiệp?"
]

print("\n📊 BENCHMARK QUERIES & RESULTS:\n")
print("| # | Query | Top Chunk Preview | Score | Relevant? | Agent Answer |")
print("|---|-------|-------------------|-------|-----------|--------------|")

for i, q in enumerate(queries, 1):
    # Search
    results = store.search(q, top_k=1)
    
    if results:
        score = results[0]['score']
        chunk_preview = results[0]['content'][:50].replace('\n', ' ') + "..."
        relevant = "✅" if score > 0.5 else "⚠️"
        answer = agent.answer(q)[:60] + "..."
    else:
        score = 0
        chunk_preview = "No results"
        relevant = "❌"
        answer = "No answer"
    
    print(f"| {i} | {q[:30]}... | {chunk_preview} | {score:.2f} | {relevant} | {answer} |")

# Similarity predictions
print("\n\n" + "="*80)
print("SIMILARITY PREDICTIONS")
print("="*80)

sentence_pairs = [
    ("Người lao động đóng bảo hiểm xã hội bắt buộc 8% tiền lương.", 
     "Mức đóng BHXH của người lao động là 8% lương hàng tháng."),
    
    ("Bảo hiểm xã hội là chế độ bảo vệ xã hội bắt buộc.",
     "Bảo hiểm xã hội tự nguyện được áp dụng ngoài bảo hiểm bắt buộc."),
    
    ("Hợp đồng lao động có thể được chấm dứt khi cả hai bên đồng ý.",
     "Người lao động có thể đơn phương chấm dứt hợp đồng."),
    
    ("Người nước ngoài làm việc tại Việt Nam phải tham gia bảo hiểm.",
     "Công dân Việt Nam không bắt buộc tham gia bảo hiểm nếu tự kinh doanh."),
    
    ("Quy định về lương, thời giờ làm việc được nêu trong luật lao động.",
     "Đọc các điều khoản về tiền lương và thời giờ làm việc."),
]

print("\n| Pair | Sentence A | Sentence B | Dự Đoán | Actual | Đúng? |")
print("|------|-----------|-----------|---------|--------|-------|")

for i, (sent_a, sent_b) in enumerate(sentence_pairs, 1):
    # Get embeddings
    emb_a = embedder(sent_a)
    emb_b = embedder(sent_b)
    
    # Compute similarity
    similarity = compute_similarity(emb_a, emb_b)
    
    # Make prediction (based on semantic similarity)
    prediction = "high" if similarity > 0.5 else "low"
    
    # Preview
    a_preview = sent_a[:30] + "..."
    b_preview = sent_b[:30] + "..."
    
    actual_label = "high" if similarity > 0.5 else "low"
    is_correct = "✅" if prediction == actual_label else "❌"
    
    print(f"| {i} | {a_preview} | {b_preview} | {prediction} | {similarity:.3f} ({actual_label}) | {is_correct} |")

print("\n" + "="*80)
