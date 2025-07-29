from openai import OpenAI

openai = OpenAI(api_key="YOUR_OPENAI_KEY")

def summarize_fact(claim, sources):
    """
    Summarize the fact-check result in 30-60 words, include contradictions and confidence.
    """
    prompt = (
        f"Claim: {claim}
"
        f"Sources: {', '.join(s['url'] for s in sources)}
"
        "Summarize the truth, contradictions, and confidence in 30-60 words, for podcast listeners."
    )
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )
    return response.choices[0].message.content.strip()