"""
Improved Embedding Configuration
Use SentenceTransformers by default for better semantic similarity
"""

from __future__ import annotations

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class SemanticEmbedder:
    """
    SentenceTransformers-based embedder for semantic similarity.
    
    Better than MockEmbedder because it understands:
    - Semantic meaning, not just string hashes
    - Vietnamese language nuances
    - Domain-specific vocabulary (pháp luật, BHXH, etc.)
    
    Model: all-MiniLM-L6-v2
    - Fast (small model)
    - Good quality for semantic search
    - Vietnamese language support
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers not installed. "
                "Install with: pip install sentence-transformers"
            )
        
        self.model_name = model_name
        self._backend_name = f"SentenceTransformers ({model_name})"
        self.model = SentenceTransformer(model_name)

    def __call__(self, text: str) -> list[float]:
        """Embed text using semantic embedding."""
        embedding = self.model.encode(text, normalize_embeddings=True)
        
        # Convert to list if numpy array
        if hasattr(embedding, "tolist"):
            return embedding.tolist()
        return [float(value) for value in embedding]


# Try to create default semantic embedder, fallback to MockEmbedder
try:
    _default_semantic_embedder = SemanticEmbedder()
except ImportError:
    from src.embeddings import MockEmbedder
    _default_semantic_embedder = MockEmbedder()
    print("⚠️ Warning: Using MockEmbedder (hash-based). "
          "Install sentence-transformers for semantic embeddings: "
          "pip install sentence-transformers")
