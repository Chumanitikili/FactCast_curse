// Simple claim detector for MVP
// In production, replace with advanced NLP/ML model

import { classifyText } from '@/lib/services/ai-nlp-service';
import axios from 'axios';

const CLAIM_KEYWORDS = [
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'can', 'could', 'should', 'must', 'did', 'does', 'do', 'claims', 'reports', 'according to', 'study', 'research', 'data', 'statistic', 'survey', 'found', 'shows', 'estimates', 'suggests', 'reveals', 'confirms', 'denies', 'proves', 'disproves', 'states', 'announces', 'declares', 'predicts', 'projects', 'indicates', 'demonstrates', 'concludes', 'asserts', 'alleges', 'affirms', 'contradicts', 'implies', 'implied', 'implies that', 'implied that', 'suggested that', 'suggests that', 'found that', 'shows that', 'estimates that', 'reveals that', 'confirms that', 'denies that', 'proves that', 'disproves that', 'states that', 'announces that', 'declares that', 'predicts that', 'projects that', 'indicates that', 'demonstrates that', 'concludes that', 'asserts that', 'alleges that', 'affirms that', 'contradicts that'
];

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

interface ClaimDetectionRequest {
  text: string;
  context?: string;
  confidence?: number;
}

interface ClaimDetectionResponse {
  claims: Array<{
    text: string;
    confidence: number;
    type: 'factual' | 'opinion' | 'prediction' | 'quote';
    entities: string[];
    source?: string;
  }>;
  provider: string;
  totalClaims: number;
}

interface FactCheckRequest {
  claim: string;
  context?: string;
  sources?: string[];
}

interface FactCheckResponse {
  verdict: 'true' | 'false' | 'misleading' | 'unverified' | 'opinion';
  confidence: number;
  explanation: string;
  sources: string[];
  provider: string;
  reasoning: string;
}

// OpenAI GPT-4 Claim Detection
async function openAIClaimDetection(request: ClaimDetectionRequest): Promise<ClaimDetectionResponse | null> {
  if (!OPENAI_API_KEY) return null;
  
  try {
    const prompt = `Analyze the following text and extract factual claims that can be verified. Focus on statements that make specific assertions about facts, statistics, events, or people.

Text: "${request.text}"
${request.context ? `Context: "${request.context}"` : ''}

Return a JSON array of claims with the following structure:
[{
  "text": "the specific claim made",
  "confidence": 0.0-1.0,
  "type": "factual|opinion|prediction|quote",
  "entities": ["person", "place", "organization", "date"],
  "source": "who made the claim (if mentioned)"
}]`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a professional fact-checking assistant. Extract verifiable claims from text.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    try {
      const claims = JSON.parse(content);
      return {
        claims,
        provider: 'OpenAI GPT-4',
        totalClaims: claims.length,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('OpenAI claim detection failed:', error);
    return null;
  }
}

// Cohere Claim Detection
async function cohereClaimDetection(request: ClaimDetectionRequest): Promise<ClaimDetectionResponse | null> {
  if (!COHERE_API_KEY) return null;
  
  try {
    const response = await axios.post('https://api.cohere.ai/v1/classify', {
      inputs: [request.text],
      examples: [
        { text: "The population of New York City is 8.8 million people", label: "factual" },
        { text: "I think this policy is good for the economy", label: "opinion" },
        { text: "The stock market will rise 10% next year", label: "prediction" },
        { text: "According to the report, sales increased by 15%", label: "quote" },
      ],
      model: 'large',
    }, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const classification = response.data.classifications[0];
    if (!classification) return null;

    // Extract claims using NER
    const nerResponse = await axios.post('https://api.cohere.ai/v1/generate', {
      model: 'command',
      prompt: `Extract named entities and factual claims from: "${request.text}"`,
      max_tokens: 200,
      temperature: 0.1,
    }, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const entities = nerResponse.data.generations[0]?.text?.trim();
    
    return {
      claims: [{
        text: request.text,
        confidence: classification.confidence || 0.7,
        type: classification.prediction as any,
        entities: entities ? entities.split(',').map(e => e.trim()) : [],
      }],
      provider: 'Cohere',
      totalClaims: 1,
    };
  } catch (error) {
    console.error('Cohere claim detection failed:', error);
    return null;
  }
}

// Google Gemini Claim Detection
async function geminiClaimDetection(request: ClaimDetectionRequest): Promise<ClaimDetectionResponse | null> {
  if (!GOOGLE_GEMINI_API_KEY) return null;
  
  try {
    const prompt = `Analyze this text and extract factual claims: "${request.text}"

Return a JSON array of claims with structure:
[{
  "text": "the specific claim",
  "confidence": 0.0-1.0,
  "type": "factual|opinion|prediction|quote",
  "entities": ["entities mentioned"],
  "source": "source if mentioned"
}]`;

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
      },
    });

    const content = response.data.candidates[0]?.content?.parts[0]?.text?.trim();
    if (!content) return null;

    try {
      const claims = JSON.parse(content);
      return {
        claims,
        provider: 'Google Gemini',
        totalClaims: claims.length,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Gemini claim detection failed:', error);
    return null;
  }
}

// Hugging Face Claim Detection
async function huggingFaceClaimDetection(request: ClaimDetectionRequest): Promise<ClaimDetectionResponse | null> {
  if (!HUGGINGFACE_API_TOKEN) return null;
  
  try {
    // Use a text classification model for claim detection
    const response = await axios.post('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      inputs: request.text,
      parameters: {
        candidate_labels: ["factual claim", "opinion", "prediction", "quote"],
      },
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;
    if (!result.labels || !result.scores) return null;

    const maxScoreIndex = result.scores.indexOf(Math.max(...result.scores));
    const claimType = result.labels[maxScoreIndex].replace(' ', '_') as any;

    return {
      claims: [{
        text: request.text,
        confidence: result.scores[maxScoreIndex],
        type: claimType,
        entities: [], // Would need NER model for entities
      }],
      provider: 'Hugging Face',
      totalClaims: 1,
    };
  } catch (error) {
    console.error('Hugging Face claim detection failed:', error);
    return null;
  }
}

// Simple rule-based claim detection fallback
function ruleBasedClaimDetection(text: string): ClaimDetectionResponse {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const claims = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(' ');
    let type: 'factual' | 'opinion' | 'prediction' | 'quote' = 'factual';
    let confidence = 0.6;

    // Simple heuristics
    if (words.some(w => ['think', 'believe', 'feel', 'opinion'].includes(w))) {
      type = 'opinion';
      confidence = 0.8;
    } else if (words.some(w => ['will', 'going to', 'predict', 'forecast'].includes(w))) {
      type = 'prediction';
      confidence = 0.7;
    } else if (words.some(w => ['said', 'according to', 'reported', 'stated'].includes(w))) {
      type = 'quote';
      confidence = 0.75;
    }

    return {
      text: sentence.trim(),
      confidence,
      type,
      entities: [],
    };
  });

  return {
    claims,
    provider: 'Rule-based Fallback',
    totalClaims: claims.length,
  };
}

// Main claim detection function with fallback chain
export async function detectClaims(request: ClaimDetectionRequest): Promise<ClaimDetectionResponse> {
  const { text, context, confidence = 0.7 } = request;
  
  // Try AI providers in order of preference
  const providers = [
    () => openAIClaimDetection(request),
    () => cohereClaimDetection(request),
    () => geminiClaimDetection(request),
    () => huggingFaceClaimDetection(request),
  ];
  
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result && result.claims.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('Claim detection provider failed, trying next:', error);
      continue;
    }
  }
  
  // Fallback to rule-based detection
  return ruleBasedClaimDetection(text);
}

// Fact-checking with AI providers
async function openAIFactCheck(request: FactCheckRequest): Promise<FactCheckResponse | null> {
  if (!OPENAI_API_KEY) return null;
  
  try {
    const prompt = `Fact-check the following claim: "${request.claim}"

${request.context ? `Context: "${request.context}"` : ''}
${request.sources ? `Available sources: ${request.sources.join(', ')}` : ''}

Provide a verdict and explanation. Return JSON:
{
  "verdict": "true|false|misleading|unverified|opinion",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation",
  "reasoning": "detailed reasoning"
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a professional fact-checker. Be objective and evidence-based.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.1,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    try {
      const result = JSON.parse(content);
      return {
        ...result,
        sources: request.sources || [],
        provider: 'OpenAI GPT-4',
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI fact-check response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('OpenAI fact-check failed:', error);
    return null;
  }
}

// Main fact-checking function
export async function factCheckClaim(request: FactCheckRequest): Promise<FactCheckResponse> {
  const { claim, context, sources } = request;
  
  // Try OpenAI first
  const openAIResult = await openAIFactCheck(request);
  if (openAIResult) {
    return openAIResult;
  }
  
  // Fallback: simple heuristic-based fact-checking
  const words = claim.toLowerCase().split(' ');
  let verdict: 'true' | 'false' | 'misleading' | 'unverified' | 'opinion' = 'unverified';
  let confidence = 0.3;
  let explanation = 'Unable to verify with available sources.';
  
  // Simple heuristics
  if (words.some(w => ['think', 'believe', 'feel', 'opinion'].includes(w))) {
    verdict = 'opinion';
    confidence = 0.8;
    explanation = 'This appears to be an opinion rather than a factual claim.';
  } else if (words.some(w => ['will', 'going to', 'predict'].includes(w))) {
    verdict = 'unverified';
    confidence = 0.5;
    explanation = 'This is a prediction that cannot be fact-checked at present.';
  }
  
  return {
    verdict,
    confidence,
    explanation,
    reasoning: explanation,
    sources: sources || [],
    provider: 'Heuristic Fallback',
  };
}

// TODO: Integrate advanced NLP/ML model for claim detection 