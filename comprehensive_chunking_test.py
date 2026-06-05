#!/usr/bin/env python3
"""Comprehensive comparison of all chunking strategies"""

import os
from src.chunking import SentenceChunker, FixedSizeChunker, RecursiveChunker

def load_document(filename):
    """Load a document from data directory"""
    path = os.path.join('data', filename)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def compare_strategies(text, chunk_size=500):
    """Compare all three strategies"""
    fixed = FixedSizeChunker(chunk_size=chunk_size, overlap=50)
    sentence = SentenceChunker(max_sentences_per_chunk=3)
    recursive = RecursiveChunker(chunk_size=chunk_size)
    
    fixed_chunks = fixed.chunk(text)
    sentence_chunks = sentence.chunk(text)
    recursive_chunks = recursive.chunk(text)
    
    def stats(chunks):
        if not chunks:
            return {'count': 0, 'avg': 0, 'min': 0, 'max': 0}
        lengths = [len(c) for c in chunks]
        return {
            'count': len(chunks),
            'avg': sum(lengths) / len(chunks),
            'min': min(lengths),
            'max': max(lengths)
        }
    
    return {
        'fixed_size': stats(fixed_chunks),
        'sentence': stats(sentence_chunks),
        'recursive': stats(recursive_chunks)
    }

def main():
    docs = {
        'luatbhxh.md': 'Luật Bảo hiểm Xã hội',
        'luatld.md': 'Luật Lao động',
        'luatvieclam.md': 'Luật Việc làm',
        'c4_bhxh.md': 'Chương 4 BHXH',
        'muc2_bhxh.md': 'Mục 2 BHXH'
    }
    
    print("\n" + "="*100)
    print("COMPREHENSIVE CHUNKING STRATEGY COMPARISON")
    print("="*100)
    
    for filename, display_name in docs.items():
        try:
            text = load_document(filename)
            results = compare_strategies(text)
            
            print(f"\n{display_name} ({len(text):,} chars)")
            print("-" * 100)
            print(f"{'Strategy':<20} | {'Chunks':<10} | {'Avg Len':<12} | {'Min Len':<10} | {'Max Len':<10}")
            print("-" * 100)
            
            for strategy, stats in results.items():
                print(f"{strategy:<20} | {stats['count']:<10} | {stats['avg']:<12.1f} | {stats['min']:<10} | {stats['max']:<10}")
        
        except FileNotFoundError as e:
            print(f"\nERROR loading {filename}: {e}")
    
    print("\n" + "="*100)
    print("KEY INSIGHT FOR LEGAL DOCUMENTS:")
    print("="*100)
    print("""
SentenceChunker preserves complete sentences (critical for legal documents where
context is essential). However, it has variable chunk sizes (36-2613 chars).

For Vietnamese legal texts:
- Sentences are often very long (describing articles and clauses)
- Context preservation is crucial for accurate RAG retrieval
- Token limits of LLMs must be considered

RECOMMENDATION: Use a hybrid approach where SentenceChunker is the primary strategy,
but add a secondary split if a chunk exceeds a reasonable token limit (e.g., 1000 chars).
""")

if __name__ == '__main__':
    main()
