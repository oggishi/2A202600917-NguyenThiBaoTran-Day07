from __future__ import annotations

from typing import Any, Callable

from .chunking import _dot
from .embeddings import _mock_embed
from .models import Document


class EmbeddingStore:
    """
    A vector store for text chunks.

    Tries to use ChromaDB if available; falls back to an in-memory store.
    The embedding_fn parameter allows injection of mock embeddings for tests.
    """

    def __init__(
        self,
        collection_name: str = "documents",
        embedding_fn: Callable[[str], list[float]] | None = None,
    ) -> None:
        self._embedding_fn = embedding_fn or _mock_embed
        self._collection_name = collection_name
        self._use_chroma = False
        self._store: list[dict[str, Any]] = []
        self._collection = None
        self._next_index = 0

        try:
            import chromadb  # noqa: F401
            self._chroma_client = chromadb.Client()
            self._collection = self._chroma_client.get_or_create_collection(name=collection_name)
            self._use_chroma = True
        except Exception:
            self._use_chroma = False
            self._collection = None

    def _make_record(self, doc: Document) -> dict[str, Any]:
        # Build a stored record with embedding
        embedding = self._embedding_fn(doc.content)
        return {
            'id': f"{doc.id}_{self._next_index}",
            'content': doc.content,
            'embedding': embedding,
            'doc_id': doc.id,
            'metadata': doc.metadata or {}
        }

    def _search_records(self, query: str, records: list[dict[str, Any]], top_k: int) -> list[dict[str, Any]]:
        # Embed the query
        query_embedding = self._embedding_fn(query)
        
        # Compute similarity scores
        scored = []
        for record in records:
            score = _dot(query_embedding, record['embedding'])
            scored.append((score, record))
        
        # Sort by score descending, take top_k
        scored.sort(key=lambda x: x[0], reverse=True)
        return [{'score': score, **record} for score, record in scored[:top_k]]

    def add_documents(self, docs: list[Document]) -> None:
        """
        Embed each document's content and store it.

        For ChromaDB: use collection.add(ids=[...], documents=[...], embeddings=[...])
        For in-memory: append dicts to self._store
        """
        if self._use_chroma and self._collection:
            ids = []
            contents = []
            embeddings = []
            metadatas = []
            
            for doc in docs:
                embedding = self._embedding_fn(doc.content)
                record_id = f"{doc.id}_{self._next_index}"
                self._next_index += 1
                
                ids.append(record_id)
                contents.append(doc.content)
                embeddings.append(embedding)
                metadatas.append({**doc.metadata, 'doc_id': doc.id})
            
            self._collection.add(ids=ids, documents=contents, embeddings=embeddings, metadatas=metadatas)
        else:
            # In-memory storage
            for doc in docs:
                record = self._make_record(doc)
                self._store.append(record)
                self._next_index += 1

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """
        Find the top_k most similar documents to query.

        For in-memory: compute dot product of query embedding vs all stored embeddings.
        """
        if self._use_chroma and self._collection:
            # Use ChromaDB search
            results = self._collection.query(query_texts=[query], n_results=top_k)
            output = []
            for i in range(len(results['ids'][0])):
                output.append({
                    'id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'score': results['distances'][0][i],
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                })
            return output
        else:
            # In-memory search
            return self._search_records(query, self._store, top_k)

    def get_collection_size(self) -> int:
        """Return the total number of stored chunks."""
        if self._use_chroma and self._collection:
            return self._collection.count()
        else:
            return len(self._store)

    def search_with_filter(self, query: str, top_k: int = 3, metadata_filter: dict = None) -> list[dict]:
        """
        Search with optional metadata pre-filtering.

        First filter stored chunks by metadata_filter, then run similarity search.
        """
        if metadata_filter is None:
            return self.search(query, top_k)
        
        if self._use_chroma and self._collection:
            # ChromaDB where clause filtering
            results = self._collection.query(query_texts=[query], n_results=top_k, where=metadata_filter)
            output = []
            for i in range(len(results['ids'][0])):
                output.append({
                    'id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'score': results['distances'][0][i],
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                })
            return output
        else:
            # In-memory: filter first, then search
            filtered_records = []
            for record in self._store:
                match = True
                for key, value in metadata_filter.items():
                    if record.get('metadata', {}).get(key) != value:
                        match = False
                        break
                if match:
                    filtered_records.append(record)
            
            return self._search_records(query, filtered_records, top_k)

    def delete_document(self, doc_id: str) -> bool:
        """
        Remove all chunks belonging to a document.

        Returns True if any chunks were removed, False otherwise.
        """
        if self._use_chroma and self._collection:
            # ChromaDB delete
            self._collection.delete(where={'doc_id': doc_id})
            return True  # Assume it worked
        else:
            # In-memory: filter out records with matching doc_id
            initial_size = len(self._store)
            self._store = [r for r in self._store if r.get('doc_id') != doc_id]
            return len(self._store) < initial_size
