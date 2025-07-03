// AI summarizer for MVP
// In production, integrate with OpenAI/Claude for summarization

import { factCheckWithAI } from '@/lib/services/ai-nlp-service';
import axios from 'axios';

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

interface SummarizationRequest {
  text: string;
  maxLength?: number;
  style?: 'concise' | 'detailed' | 'bullet-points';
}

interface SummarizationResponse {
  summary: string;
  provider: string;
  confidence: number;
  wordCount: number;
}

// OpenAI GPT-4 Summarization
async function openAISummarize(request: SummarizationRequest): Promise<SummarizationResponse | null> {
  if (!OPENAI_API_KEY) return null;
  
  try {
    const prompt = `Summarize the following text in a ${request.style || 'concise'} manner (max ${request.maxLength || 150} words):\n\n${request.text}`;
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a professional fact-checking assistant. Provide accurate, concise summaries.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: request.maxLength || 150,
      temperature: 0.3,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const summary = response.data.choices[0]?.message?.content?.trim();
    if (!summary) return null;

    return {
      summary,
      provider: 'OpenAI GPT-4',
      confidence: 0.95,
      wordCount: summary.split(' ').length,
    };
  } catch (error) {
    console.error('OpenAI summarization failed:', error);
    return null;
  }
}

// Cohere Summarization
async function cohereSummarize(request: SummarizationRequest): Promise<SummarizationResponse | null> {
  if (!COHERE_API_KEY) return null;
  
  try {
    const response = await axios.post('https://api.cohere.ai/v1/summarize', {
      text: request.text,
      length: request.style === 'detailed' ? 'long' : 'medium',
      format: request.style === 'bullet-points' ? 'bullets' : 'paragraph',
      model: 'summarize-xlarge',
      additional_command: 'Focus on factual accuracy and key claims.',
    }, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const summary = response.data.results[0]?.summary;
    if (!summary) return null;

    return {
      summary,
      provider: 'Cohere',
      confidence: 0.9,
      wordCount: summary.split(' ').length,
    };
  } catch (error) {
    console.error('Cohere summarization failed:', error);
    return null;
  }
}

// Google Gemini Summarization
async function geminiSummarize(request: SummarizationRequest): Promise<SummarizationResponse | null> {
  if (!GOOGLE_GEMINI_API_KEY) return null;
  
  try {
    const prompt = `Summarize the following text in a ${request.style || 'concise'} manner (max ${request.maxLength || 150} words). Focus on factual accuracy:\n\n${request.text}`;
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: request.maxLength || 150,
        temperature: 0.3,
      },
    });

    const summary = response.data.candidates[0]?.content?.parts[0]?.text?.trim();
    if (!summary) return null;

    return {
      summary,
      provider: 'Google Gemini',
      confidence: 0.92,
      wordCount: summary.split(' ').length,
    };
  } catch (error) {
    console.error('Gemini summarization failed:', error);
    return null;
  }
}

// Hugging Face Summarization (using local model fallback)
async function huggingFaceSummarize(request: SummarizationRequest): Promise<SummarizationResponse | null> {
  if (!HUGGINGFACE_API_TOKEN) return null;
  
  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      inputs: request.text,
      parameters: {
        max_length: request.maxLength || 150,
        min_length: 30,
        do_sample: false,
      },
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const summary = response.data[0]?.summary_text?.trim();
    if (!summary) return null;

    return {
      summary,
      provider: 'Hugging Face',
      confidence: 0.85,
      wordCount: summary.split(' ').length,
    };
  } catch (error) {
    console.error('Hugging Face summarization failed:', error);
    return null;
  }
}

// Simple extractive summarization fallback
function extractiveSummarize(text: string, maxLength: number = 150): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = text.split(/\s+/).length;
  
  if (words.length <= maxLength) return text;
  
  // Simple algorithm: take first few sentences that fit within limit
  let summary = '';
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    if (wordCount + sentenceWords <= maxLength) {
      summary += sentence + '. ';
      wordCount += sentenceWords;
    } else {
      break;
    }
  }
  
  return summary.trim() || words.slice(0, maxLength).join(' ');
}

// Main summarization function with fallback chain
export async function summarizeText(request: SummarizationRequest): Promise<SummarizationResponse> {
  const { text, maxLength = 150, style = 'concise' } = request;
  
  // Try AI providers in order of preference
  const providers = [
    () => openAISummarize(request),
    () => cohereSummarize(request),
    () => geminiSummarize(request),
    () => huggingFaceSummarize(request),
  ];
  
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('Summarization provider failed, trying next:', error);
      continue;
    }
  }
  
  // Fallback to extractive summarization
  const fallbackSummary = extractiveSummarize(text, maxLength);
  
  return {
    summary: fallbackSummary,
    provider: 'Extractive Fallback',
    confidence: 0.6,
    wordCount: fallbackSummary.split(' ').length,
  };
}

// Batch summarization for multiple texts
export async function summarizeMultipleTexts(texts: string[], maxLength: number = 150): Promise<SummarizationResponse[]> {
  const promises = texts.map(text => 
    summarizeText({ text, maxLength, style: 'concise' })
  );
  
  return Promise.all(promises);
}

// Specialized summarization for fact-checking
export async function summarizeForFactChecking(text: string): Promise<SummarizationResponse> {
  return summarizeText({
    text,
    maxLength: 200,
    style: 'detailed',
  });
}

export async function summarizeClaimResult(
  claim: string,
  sources: { type: string; url: string; title: string; credibility: number }[]
): Promise<{ summary: string; confidence: number }> {
  try {
    // Extract source content for summarization
    const sourceTexts = sources.map(s => `${s.title}: ${s.type} source with ${Math.round(s.credibility * 100)}% credibility`).join('\n');
    
    // Use AI for summarization
    const summary = await summarizeText(`Claim: ${claim}\n\nSources:\n${sourceTexts}`, 100);
    
    // Use AI for fact-checking
    const factCheck = await factCheckWithAI(claim, sourceTexts.split('\n'));
    
    return {
      summary: summary,
      confidence: factCheck.confidence * 100
    };
  } catch (error) {
    // Fallback to mock summary
    return {
      summary: `Summary for claim: "${claim}" based on ${sources.length} sources.`,
      confidence: Math.round((sources.reduce((acc, s) => acc + s.credibility, 0) / sources.length) * 100),
    };
  }
}

// TODO: Integrate OpenAI/Claude for production summarization 