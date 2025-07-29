from transformers import pipeline

# Fast, custom model for real-time claim detection
claim_detector = pipeline("text-classification", model="your-org/claim-detection-bert", device=-1)

def detect_claims(text):
    """
    Returns detected claims with confidence score.
    """
    results = claim_detector(text)
    return [
        {
            "text": text,
            "score": r["score"],
            "is_claim": r["label"] == "CLAIM"
        }
        for r in results if r["score"] > 0.80
    ]