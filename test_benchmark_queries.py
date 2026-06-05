#!/usr/bin/env python3
"""Test the 5 benchmark queries from the team"""

import os
from src.chunking import SentenceChunker
from src.embeddings import MockEmbedder
from src.store import EmbeddingStore
from src.models import Document

def load_doc(filename):
    with open(os.path.join('data', filename), 'r', encoding='utf-8') as f:
        return f.read()

# Initialize
embedder = MockEmbedder(dim=100)
store = EmbeddingStore(embedding_fn=embedder)

# Load and chunk documents
print("\n" + "="*100)
print("LOADING & CHUNKING DOCUMENTS")
print("="*100)

docs_to_load = {
    'luatbhxh.md': {'id': 'bhxh', 'type': 'bhxh'},
    'luatld.md': {'id': 'ld', 'type': 'ld'},
    'luatvieclam.md': {'id': 'vl', 'type': 'viec_lam'},
}

chunker = SentenceChunker(max_sentences_per_chunk=3)
all_chunks = []

for filename, meta in docs_to_load.items():
    try:
        text = load_doc(filename)
        chunks = chunker.chunk(text)
        
        # Add to store
        for i, chunk in enumerate(chunks):
            doc = Document(
                id=f"{meta['id']}_{i}",
                content=chunk,
                metadata={'type': meta['type'], 'file': filename}
            )
            store.add_documents([doc])
            all_chunks.append({'id': f"{meta['id']}_{i}", 'content': chunk})
        
        print(f"✅ {filename}: {len(chunks)} chunks")
    except FileNotFoundError:
        print(f"❌ {filename}: Not found")

print(f"\nTotal chunks in store: {len(all_chunks)}")

# Benchmark queries
queries = [
    {
        'num': 1,
        'text': 'Người lao động nước ngoài làm việc tại VN có bắt buộc tham gia BHXH không?',
        'gold': 'Có, nếu làm việc theo hợp đồng từ đủ 12 tháng trở lên',
        'source': 'luatbhxh.md - Khoản 2 Điều 2',
        'filter': None
    },
    {
        'num': 2,
        'text': 'Mức tham chiếu trong bảo hiểm xã hội là gì?',
        'gold': 'Là mức tiền do Chính phủ quyết định dùng để tính mức đóng/hưởng',
        'source': 'luatbhxh.md - Điều 7',
        'filter': None
    },
    {
        'num': 3,
        'text': 'Hành vi nào bị nghiêm cấm trong bảo hiểm thất nghiệp?',
        'gold': 'Chậm đóng, trốn đóng, chiếm dụng, gian lận, sử dụng sai quỹ',
        'source': 'luatvieclam.md - Điều 94',
        'filter': {'type': 'viec_lam'}
    },
    {
        'num': 4,
        'text': 'Cơ quan bảo hiểm xã hội có trách nhiệm gì đối với thông tin của người tham gia?',
        'gold': 'Định kỳ hằng tháng cung cấp thông tin qua phương tiện điện tử',
        'source': 'luatbhxh.md - Điều 18',
        'filter': None
    },
    {
        'num': 5,
        'text': 'Các chế độ của BHXH bắt buộc gồm những gì?',
        'gold': 'Ốm đau, thai sản, hưu trí, tử tuất, bảo hiểm TNLĐ & BNN',
        'source': 'luatbhxh.md - Điều 4',
        'filter': None
    }
]

print("\n" + "="*100)
print("BENCHMARK TEST RESULTS")
print("="*100)

correct_count = 0

for q in queries:
    print(f"\n📌 Query {q['num']}: {q['text']}")
    print(f"   Gold answer: {q['gold']}")
    print(f"   Expected source: {q['source']}")
    
    # Search
    results = store.search(q['text'], top_k=3)
    
    if results:
        top_chunk = results[0]['content'][:100].replace('\n', ' ') + "..."
        score = results[0]['score']
        
        # Check if any of top-3 contains keywords from gold answer
        keywords = q['gold'].split()[:5]  # First 5 words
        found_relevant = False
        
        for i, result in enumerate(results[:3]):
            if any(kw.lower() in result['content'].lower() for kw in keywords):
                found_relevant = True
                print(f"   ✅ Top-{i+1} score {result['score']:.3f}: Found relevant keywords")
                correct_count += 1
                break
        
        if not found_relevant:
            print(f"   ⚠️  Top-1 score {score:.3f}: {top_chunk}")
            print(f"   Keywords searched: {', '.join(keywords)}")
    else:
        print(f"   ❌ No results found")

print("\n" + "="*100)
print(f"SUMMARY: {correct_count}/5 queries found correct information ✅")
print("="*100 + "\n")
