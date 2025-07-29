import pytest
from backend.factcheck.sources import checkFact

def test_fact_check_returns_3_sources():
    claim = "Coffee consumption increased by 400% since 2010"
    sources = checkFact(claim)
    assert len(sources) == 3
    for src in sources:
        assert "url" in src and src["credibility"] > 0