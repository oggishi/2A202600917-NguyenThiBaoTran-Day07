"""
Metadata Extraction for Vietnamese Legal Documents

Automatically extract:
- article_number: "Điều 2", "Điều 7", etc.
- clause_numbers: [1, 2, 3] for Khoản 1, 2, 3
- effective_date: When this regulation takes effect
"""

from __future__ import annotations

import re
from typing import Optional


def extract_article_number(text: str) -> Optional[str]:
    """
    Extract Điều (Article) number from text.
    
    Examples:
    - "Điều 2. Phạm vi..." → "Điều 2"
    - "Điều 7" → "Điều 7"
    
    Returns:
        "Điều X" or None if not found
    """
    match = re.search(r'Điều\s+(\d+)', text)
    if match:
        return f"Điều {match.group(1)}"
    return None


def extract_clause_numbers(text: str) -> list[int]:
    """
    Extract Khoản (Clause) numbers from text.
    
    Examples:
    - "Khoản 1. Áp dụng...\nKhoản 2. Không áp dụng..." → [1, 2]
    - "Khoản 3" → [3]
    
    Returns:
        List of clause numbers found in order
    """
    matches = re.findall(r'Khoản\s+(\d+)', text)
    # Convert to integers and remove duplicates while preserving order
    seen = set()
    result = []
    for num_str in matches:
        num = int(num_str)
        if num not in seen:
            result.append(num)
            seen.add(num)
    return result


def extract_effective_date(text: str) -> Optional[str]:
    """
    Extract effective date from legal document header.
    
    Examples:
    - "Có hiệu lực từ ngày 01/01/2024" → "2024-01-01"
    - "Có hiệu lực kể từ 01 tháng 1 năm 2024" → "2024-01-01"
    
    Returns:
        Date in YYYY-MM-DD format or None if not found
    """
    # Try DD/MM/YYYY format
    match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    
    # Try Vietnamese text format (ngày X tháng Y năm Z)
    match = re.search(
        r'(?:ngày|từ ngày|từ)\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})',
        text,
        re.IGNORECASE
    )
    if match:
        day, month, year = match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    
    return None


def extract_document_type(filename: str) -> str:
    """
    Extract document type from filename.
    
    Examples:
    - "luatbhxh.md" → "bhxh"
    - "luatld.md" → "ld"
    - "luatvieclam.md" → "viec_lam"
    
    Returns:
        Document type identifier
    """
    if "bhxh" in filename.lower():
        return "bhxh"
    elif "lao_dong" in filename.lower() or "laodon" in filename.lower():
        return "ld"
    elif "viec_lam" in filename.lower() or "vieclam" in filename.lower():
        return "viec_lam"
    
    # Default fallback
    return filename.split('.')[0].lower()


def build_rich_metadata(
    chunk_text: str,
    source_file: str,
    chunk_index: int = 0,
    domain: str = "legal"
) -> dict:
    """
    Build comprehensive metadata for a chunk.
    
    Extracts:
    - source_file: Filename
    - document_type: bhxh, ld, viec_lam
    - article_number: Điều X
    - clause_numbers: [1, 2, 3, ...]
    - effective_date: YYYY-MM-DD
    - chunk_index: Position in document
    - domain: Category (legal, etc.)
    
    Args:
        chunk_text: Content of the chunk
        source_file: Filename (e.g., "luatbhxh.md")
        chunk_index: Index of chunk in document
        domain: Domain category
    
    Returns:
        Dictionary with extracted metadata
    """
    return {
        "source_file": source_file,
        "document_type": extract_document_type(source_file),
        "article_number": extract_article_number(chunk_text),
        "clause_numbers": extract_clause_numbers(chunk_text),
        "effective_date": extract_effective_date(chunk_text),
        "chunk_index": chunk_index,
        "domain": domain,
        "char_count": len(chunk_text)
    }


# Test examples
if __name__ == "__main__":
    # Test article extraction
    test_text = """
    Điều 2. Phạm vi áp dụng
    Khoản 1. Áp dụng đối với người lao động Việt Nam
    Khoản 2. Áp dụng đối với người lao động nước ngoài
    Khoản 3. Không áp dụng đối với ngoại giao viên
    
    Có hiệu lực từ ngày 01/01/2024
    """
    
    print("Article:", extract_article_number(test_text))
    print("Clauses:", extract_clause_numbers(test_text))
    print("Effective Date:", extract_effective_date(test_text))
    print("\nRich Metadata:")
    print(build_rich_metadata(test_text, "luatbhxh.md", chunk_index=5))
