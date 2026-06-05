from __future__ import annotations

import math
import re


class FixedSizeChunker:
    """
    Split text into fixed-size chunks with optional overlap.

    Rules:
        - Each chunk is at most chunk_size characters long.
        - Consecutive chunks share overlap characters.
        - The last chunk contains whatever remains.
        - If text is shorter than chunk_size, return [text].
    """

    def __init__(self, chunk_size: int = 500, overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str) -> list[str]:
        if not text:
            return []
        if len(text) <= self.chunk_size:
            return [text]

        step = self.chunk_size - self.overlap
        chunks: list[str] = []
        for start in range(0, len(text), step):
            chunk = text[start : start + self.chunk_size]
            chunks.append(chunk)
            if start + self.chunk_size >= len(text):
                break
        return chunks


class SentenceChunker:
    """
    Split text into chunks of at most max_sentences_per_chunk sentences.

    Sentence detection: split on ". ", "! ", "? " or ".\n".
    Strip extra whitespace from each chunk.
    """

    def __init__(self, max_sentences_per_chunk: int = 3) -> None:
        self.max_sentences_per_chunk = max(1, max_sentences_per_chunk)

    def chunk(self, text: str) -> list[str]:
        # Split into sentences using regex
        # Match sentence boundaries: ". ", "! ", "? " or ".\n"
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return []
        
        chunks = []
        for i in range(0, len(sentences), self.max_sentences_per_chunk):
            chunk = ' '.join(sentences[i:i + self.max_sentences_per_chunk])
            chunks.append(chunk)
        
        return chunks


class RecursiveChunker:
    """
    Recursively split text using separators in priority order.

    Default separator priority:
        ["\n\n", "\n", ". ", " ", ""]
    """

    DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

    def __init__(self, separators: list[str] | None = None, chunk_size: int = 500) -> None:
        self.separators = self.DEFAULT_SEPARATORS if separators is None else list(separators)
        self.chunk_size = chunk_size

    def chunk(self, text: str) -> list[str]:
        return self._split(text, self.separators)

    def _split(self, current_text: str, remaining_separators: list[str]) -> list[str]:
        """Recursively split text using separators in priority order."""
        if not current_text:
            return []
        
        # If text is within chunk_size, return it as-is
        if len(current_text) <= self.chunk_size:
            return [current_text]
        
        # If no more separators, split character by character
        if not remaining_separators:
            chunks = []
            for i in range(0, len(current_text), self.chunk_size):
                chunks.append(current_text[i:i + self.chunk_size])
            return chunks
        
        # Try the first separator
        separator = remaining_separators[0]
        rest_separators = remaining_separators[1:]
        
        if separator == "":
            # Empty separator means split into characters
            chunks = []
            for i in range(0, len(current_text), self.chunk_size):
                chunks.append(current_text[i:i + self.chunk_size])
            return chunks
        
        # Split by current separator
        pieces = current_text.split(separator)
        
        # Recursively process each piece
        result = []
        current_chunk = ""
        
        for i, piece in enumerate(pieces):
            # Add separator back (except for the first piece)
            if i > 0 and current_chunk:
                current_chunk += separator
            
            # If piece is small, add to current chunk
            if len(current_chunk) + len(piece) <= self.chunk_size:
                current_chunk += piece
            else:
                # If current chunk is not empty, save it
                if current_chunk:
                    result.append(current_chunk)
                
                # If piece itself is too large, recursively split it
                if len(piece) > self.chunk_size:
                    sub_chunks = self._split(piece, rest_separators)
                    result.extend(sub_chunks)
                else:
                    current_chunk = piece
        
        # Don't forget the last chunk
        if current_chunk:
            result.append(current_chunk)
        
        return result if result else [current_text]


def _dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def compute_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Compute cosine similarity between two vectors.

    cosine_similarity = dot(a, b) / (||a|| * ||b||)

    Returns 0.0 if either vector has zero magnitude.
    """
    # Compute dot product
    dot_product = _dot(vec_a, vec_b)
    
    # Compute magnitudes
    magnitude_a = math.sqrt(sum(x * x for x in vec_a)) or 1.0
    magnitude_b = math.sqrt(sum(x * x for x in vec_b)) or 1.0
    
    # Return 0.0 if either magnitude is zero
    if magnitude_a == 0.0 or magnitude_b == 0.0:
        return 0.0
    
    return dot_product / (magnitude_a * magnitude_b)


class ChunkingStrategyComparator:
    """Run all built-in chunking strategies and compare their results."""

    def compare(self, text: str, chunk_size: int = 200) -> dict:
        # Create chunkers
        fixed_chunker = FixedSizeChunker(chunk_size=chunk_size, overlap=50)
        sentence_chunker = SentenceChunker(max_sentences_per_chunk=3)
        recursive_chunker = RecursiveChunker(chunk_size=chunk_size)
        
        # Run each strategy
        fixed_chunks = fixed_chunker.chunk(text)
        sentence_chunks = sentence_chunker.chunk(text)
        recursive_chunks = recursive_chunker.chunk(text)
        
        # Compute stats for each strategy
        def compute_stats(chunks: list[str]) -> dict:
            if not chunks:
                return {'count': 0, 'avg_length': 0, 'chunks': []}
            
            avg_length = sum(len(c) for c in chunks) / len(chunks)
            return {
                'count': len(chunks),
                'avg_length': avg_length,
                'chunks': chunks
            }
        
        return {
            'fixed_size': compute_stats(fixed_chunks),
            'by_sentences': compute_stats(sentence_chunks),
            'recursive': compute_stats(recursive_chunks)
        }
