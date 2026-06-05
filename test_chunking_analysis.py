#!/usr/bin/env python3
"""Test SentenceChunker on real documents"""

import os
from src.chunking import SentenceChunker, FixedSizeChunker, RecursiveChunker, ChunkingStrategyComparator

def load_document(filename):
    """Load a document from data directory"""
    path = os.path.join('data', filename)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def analyze_chunking(text, doc_name):
    """Analyze chunking strategies on a document"""
    print(f"\n{'='*80}")
    print(f"Analyzing: {doc_name}")
    print(f"Document length: {len(text):,} characters")
    print(f"{'='*80}")
    
    # Use the comparator
    comparator = ChunkingStrategyComparator()
    results = comparator.compare(text, chunk_size=500)
    
    # Display results
    for strategy_name, stats in results.items():
        print(f"\n{strategy_name.upper()}")
        print(f"  Chunk count: {stats['count']}")
        print(f"  Avg length: {stats['avg_length']:.1f} chars")
        if stats['chunks']:
            print(f"  Min chunk: {len(min(stats['chunks'], key=len))} chars")
            print(f"  Max chunk: {len(max(stats['chunks'], key=len))} chars")
            # Show first chunk
            first_chunk = stats['chunks'][0]
            preview = first_chunk[:100] + "..." if len(first_chunk) > 100 else first_chunk
            print(f"  First chunk preview: {preview}")

def test_sentence_chunker_detail():
    """Detailed test of SentenceChunker"""
    print("\n" + "="*80)
    print("DETAILED SENTENCEchunker TEST")
    print("="*80)
    
    # Load documents
    docs = {
        'luatbhxh.md': 'Luật Bảo hiểm Xã hội',
        'luatld.md': 'Luật Lao động',
        'luatvieclam.md': 'Luật Việc làm',
        'c4_bhxh.md': 'Chương 4 BHXH',
        'muc2_bhxh.md': 'Mục 2 BHXH'
    }
    
    results_summary = []
    
    for filename, display_name in docs.items():
        try:
            text = load_document(filename)
            
            # Test SentenceChunker specifically
            chunker = SentenceChunker(max_sentences_per_chunk=3)
            chunks = chunker.chunk(text)
            
            result = {
                'name': display_name,
                'filename': filename,
                'doc_length': len(text),
                'chunk_count': len(chunks),
                'avg_length': sum(len(c) for c in chunks) / len(chunks) if chunks else 0,
                'min_length': min(len(c) for c in chunks) if chunks else 0,
                'max_length': max(len(c) for c in chunks) if chunks else 0,
            }
            results_summary.append(result)
            
            print(f"\n{display_name} ({filename})")
            print(f"  Document length: {result['doc_length']:,} chars")
            print(f"  Chunks generated: {result['chunk_count']}")
            print(f"  Avg chunk length: {result['avg_length']:.1f} chars")
            print(f"  Min/Max: {result['min_length']}/{result['max_length']} chars")
            
            # Show first 2 chunks
            for i in range(min(2, len(chunks))):
                chunk_preview = chunks[i][:80] + "..." if len(chunks[i]) > 80 else chunks[i]
                print(f"  Chunk {i+1}: {chunk_preview}")
                
        except FileNotFoundError as e:
            print(f"  ERROR: {e}")
    
    # Summary table
    print("\n" + "="*80)
    print("SUMMARY TABLE")
    print("="*80)
    print(f"{'Document':<20} | {'Chars':<8} | {'Chunks':<8} | {'Avg Len':<10} | {'Min/Max':<10}")
    print("-"*70)
    for r in results_summary:
        print(f"{r['name']:<20} | {r['doc_length']:<8} | {r['chunk_count']:<8} | {r['avg_length']:<10.1f} | {r['min_length']}/{r['max_length']:<8}")

if __name__ == '__main__':
    # Analyze main document
    text = load_document('luatbhxh.md')
    analyze_chunking(text, 'luatbhxh.md')
    
    # Detailed test
    test_sentence_chunker_detail()
