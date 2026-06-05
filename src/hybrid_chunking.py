"""
Hybrid Chunking Strategy
Combines SentenceChunker + RecursiveChunker for optimal results on legal documents.

Strategy:
1. Apply SentenceChunker first (preserves sentence boundaries)
2. If a chunk exceeds max_chunk_size (e.g., 1000 chars), apply RecursiveChunker
3. Result: Better semantic preservation + controlled chunk sizes
"""

from __future__ import annotations

from src.chunking import SentenceChunker, RecursiveChunker


class HybridChunker:
    """
    Hybrid chunking: Sentence-based with recursive fallback for large chunks.
    
    Algorithm:
    1. Split by sentences (SentenceChunker)
    2. For chunks > max_chunk_size, recursively split by paragraph/sentence/character
    3. Result: Sentence-aligned chunks that respect size limits
    
    Perfect for Vietnamese legal documents where:
    - Sentence boundaries are semantic units
    - But individual sentences can be long (1000+ characters)
    """

    def __init__(
        self,
        max_sentences_per_chunk: int = 3,
        max_chunk_size: int = 1000,
        recursive_chunk_size: int = 500
    ) -> None:
        self.max_sentences_per_chunk = max_sentences_per_chunk
        self.max_chunk_size = max_chunk_size
        self.recursive_chunk_size = recursive_chunk_size
        
        self.sentence_chunker = SentenceChunker(
            max_sentences_per_chunk=max_sentences_per_chunk
        )
        self.recursive_chunker = RecursiveChunker(
            chunk_size=recursive_chunk_size
        )

    def chunk(self, text: str) -> list[str]:
        """
        Apply hybrid chunking to text.
        
        Returns:
            List of chunks (sentence-aligned when possible, recursively split otherwise)
        """
        if not text:
            return []
        
        # Step 1: Apply sentence chunking
        sentence_chunks = self.sentence_chunker.chunk(text)
        
        # Step 2: For oversized chunks, apply recursive chunking
        result = []
        for chunk in sentence_chunks:
            if len(chunk) > self.max_chunk_size:
                # Recursively split oversized chunks
                sub_chunks = self.recursive_chunker.chunk(chunk)
                result.extend(sub_chunks)
            else:
                # Keep smaller chunks as-is
                result.append(chunk)
        
        return result


# Statistics: Comparing strategies on legal documents
def compare_chunking_strategies_hybrid(text: str) -> dict:
    """
    Compare all chunking strategies including hybrid.
    
    Shows effectiveness of hybrid approach for legal documents.
    """
    from src.chunking import FixedSizeChunker, ChunkingStrategyComparator
    
    # Run baseline comparison
    comparator = ChunkingStrategyComparator()
    baselines = comparator.compare(text)
    
    # Run hybrid chunker
    hybrid_chunker = HybridChunker(
        max_sentences_per_chunk=3,
        max_chunk_size=1000,
        recursive_chunk_size=500
    )
    hybrid_chunks = hybrid_chunker.chunk(text)
    
    def compute_stats(chunks: list[str]) -> dict:
        if not chunks:
            return {
                'count': 0,
                'avg_length': 0.0,
                'min_length': 0,
                'max_length': 0,
                'chunks': []
            }
        
        lengths = [len(c) for c in chunks]
        return {
            'count': len(chunks),
            'avg_length': sum(lengths) / len(chunks),
            'min_length': min(lengths),
            'max_length': max(lengths),
            'chunks': chunks
        }
    
    # Add hybrid to baselines
    results = {
        **baselines,
        'hybrid': compute_stats(hybrid_chunks)
    }
    
    return results
