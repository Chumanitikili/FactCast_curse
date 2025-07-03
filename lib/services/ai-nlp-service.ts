import axios from 'axios';
import spacy from 'spacy';

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Initialize spaCy for local NLP processing
let nlp: any = null;
try {
  nlp = spacy.load('en_core_web_sm');
} catch {
  // Fallback: spaCy model not installed
  console.warn('spaCy model not found. Install with: python -m spacy download en_core_web_sm');
}

interface NLPRequest {
  text: string;
  task: 'classification' | 'ner' | 'sentiment' | 'fact-check' | 'summarization';
  options?: any;
}

interface NLPResponse {
  result: any;
  provider: string;
  confidence: number;
  processingTime: number;
}

// OpenAI GPT-4 NLP
async function openAINLP(request: NLPRequest): Promise<NLPResponse | null> {
  if (!OPENAI_API_KEY) return null;
  
  const startTime = Date.now();
  
  try {
    let prompt = '';
    let systemPrompt = '';
    
    switch (request.task) {
      case 'classification':
        systemPrompt = 'You are a text classification expert. Classify the given text into appropriate categories.';
        prompt = `Classify this text: "${request.text}"\n\nCategories: ${request.options?.categories?.join(', ') || 'factual, opinion, prediction, quote'}\n\nReturn JSON: {"category": "category", "confidence": 0.0-1.0}`;
        break;
      case 'ner':
        systemPrompt = 'You are an entity recognition expert. Extract named entities from the text.';
        prompt = `Extract named entities from: "${request.text}"\n\nReturn JSON: {"entities": [{"text": "entity", "type": "PERSON|ORG|LOC|DATE|OTHER"}]}`;
        break;
      case 'sentiment':
        systemPrompt = 'You are a sentiment analysis expert. Analyze the sentiment of the text.';
        prompt = `Analyze sentiment: "${request.text}"\n\nReturn JSON: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "score": -1.0 to 1.0}`;
        break;
      case 'fact-check':
        systemPrompt = 'You are a fact-checking expert. Verify the factual accuracy of claims.';
        prompt = `Fact-check this claim: "${request.text}"\n\nReturn JSON: {"verdict": "true|false|misleading|unverified", "confidence": 0.0-1.0, "explanation": "reasoning"}`;
        break;
      case 'summarization':
        systemPrompt = 'You are a summarization expert. Create concise summaries of text.';
        prompt = `Summarize this text (max ${request.options?.maxLength || 150} words): "${request.text}"`;
        break;
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
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

    let result;
    if (request.task === 'summarization') {
      result = { summary: content };
    } else {
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return null;
      }
    }

    return {
      result,
      provider: 'OpenAI GPT-4',
      confidence: result.confidence || 0.9,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('OpenAI NLP failed:', error);
    return null;
  }
}

// Cohere NLP
async function cohereNLP(request: NLPRequest): Promise<NLPResponse | null> {
  if (!COHERE_API_KEY) return null;
  
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (request.task) {
      case 'classification':
        const classifyResponse = await axios.post('https://api.cohere.ai/v1/classify', {
          inputs: [request.text],
          examples: request.options?.examples || [
            { text: "The population is 8.8 million", label: "factual" },
            { text: "I think this is good", label: "opinion" },
            { text: "It will happen next year", label: "prediction" },
          ],
          model: 'large',
        }, {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const classification = classifyResponse.data.classifications[0];
        result = {
          category: classification.prediction,
          confidence: classification.confidence,
        };
        break;
        
      case 'sentiment':
        const sentimentResponse = await axios.post('https://api.cohere.ai/v1/classify', {
          inputs: [request.text],
          examples: [
            { text: "This is amazing!", label: "positive" },
            { text: "This is terrible", label: "negative" },
            { text: "This is neutral", label: "neutral" },
          ],
          model: 'large',
        }, {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const sentiment = sentimentResponse.data.classifications[0];
        result = {
          sentiment: sentiment.prediction,
          confidence: sentiment.confidence,
          score: sentiment.prediction === 'positive' ? 0.8 : sentiment.prediction === 'negative' ? -0.8 : 0,
        };
        break;
        
      default:
        return null;
    }

    return {
      result,
      provider: 'Cohere',
      confidence: result.confidence || 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Cohere NLP failed:', error);
    return null;
  }
}

// Google Gemini NLP
async function geminiNLP(request: NLPRequest): Promise<NLPResponse | null> {
  if (!GOOGLE_GEMINI_API_KEY) return null;
  
  const startTime = Date.now();
  
  try {
    let prompt = '';
    
    switch (request.task) {
      case 'classification':
        prompt = `Classify this text: "${request.text}"\n\nCategories: ${request.options?.categories?.join(', ') || 'factual, opinion, prediction, quote'}\n\nReturn JSON: {"category": "category", "confidence": 0.0-1.0}`;
        break;
      case 'ner':
        prompt = `Extract named entities from: "${request.text}"\n\nReturn JSON: {"entities": [{"text": "entity", "type": "PERSON|ORG|LOC|DATE|OTHER"}]}`;
        break;
      case 'sentiment':
        prompt = `Analyze sentiment: "${request.text}"\n\nReturn JSON: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "score": -1.0 to 1.0}`;
        break;
      case 'fact-check':
        prompt = `Fact-check this claim: "${request.text}"\n\nReturn JSON: {"verdict": "true|false|misleading|unverified", "confidence": 0.0-1.0, "explanation": "reasoning"}`;
        break;
      case 'summarization':
        prompt = `Summarize this text (max ${request.options?.maxLength || 150} words): "${request.text}"`;
        break;
    }

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.1,
      },
    });

    const content = response.data.candidates[0]?.content?.parts[0]?.text?.trim();
    if (!content) return null;

    let result;
    if (request.task === 'summarization') {
      result = { summary: content };
    } else {
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        return null;
      }
    }

    return {
      result,
      provider: 'Google Gemini',
      confidence: result.confidence || 0.85,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Gemini NLP failed:', error);
    return null;
  }
}

// Hugging Face NLP
async function huggingFaceNLP(request: NLPRequest): Promise<NLPResponse | null> {
  if (!HUGGINGFACE_API_TOKEN) return null;
  
  const startTime = Date.now();
  
  try {
    let model = '';
    let result;
    
    switch (request.task) {
      case 'sentiment':
        model = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
        break;
      case 'ner':
        model = 'dbmdz/bert-large-cased-finetuned-conll03-english';
        break;
      case 'summarization':
        model = 'facebook/bart-large-cnn';
        break;
      default:
        return null;
    }

    const response = await axios.post(`https://api-inference.huggingface.co/models/${model}`, {
      inputs: request.text,
      parameters: request.options || {},
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    
    switch (request.task) {
      case 'sentiment':
        result = {
          sentiment: data[0]?.label?.toLowerCase() || 'neutral',
          confidence: data[0]?.score || 0.5,
          score: data[0]?.label === 'LABEL_2' ? 0.8 : data[0]?.label === 'LABEL_0' ? -0.8 : 0,
        };
        break;
      case 'ner':
        result = {
          entities: data.map((entity: any) => ({
            text: entity.word,
            type: entity.entity_group,
          })),
        };
        break;
      case 'summarization':
        result = {
          summary: data[0]?.summary_text || '',
        };
        break;
    }

    return {
      result,
      provider: 'Hugging Face',
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Hugging Face NLP failed:', error);
    return null;
  }
}

// Simple rule-based fallback
function ruleBasedNLP(request: NLPRequest): NLPResponse {
  const startTime = Date.now();
  const { text, task } = request;
  
  let result: any = {};
  
  switch (task) {
    case 'classification':
      const words = text.toLowerCase().split(' ');
      if (words.some(w => ['think', 'believe', 'feel', 'opinion'].includes(w))) {
        result = { category: 'opinion', confidence: 0.7 };
      } else if (words.some(w => ['will', 'going to', 'predict'].includes(w))) {
        result = { category: 'prediction', confidence: 0.6 };
      } else {
        result = { category: 'factual', confidence: 0.5 };
      }
      break;
      
    case 'sentiment':
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting'];
      
      const positiveCount = positiveWords.filter(w => text.toLowerCase().includes(w)).length;
      const negativeCount = negativeWords.filter(w => text.toLowerCase().includes(w)).length;
      
      if (positiveCount > negativeCount) {
        result = { sentiment: 'positive', confidence: 0.6, score: 0.5 };
      } else if (negativeCount > positiveCount) {
        result = { sentiment: 'negative', confidence: 0.6, score: -0.5 };
      } else {
        result = { sentiment: 'neutral', confidence: 0.6, score: 0 };
      }
      break;
      
    case 'summarization':
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      result = { summary: sentences.slice(0, 2).join('. ') + '.' };
      break;
      
    default:
      result = { error: 'Task not supported in fallback' };
  }
  
  return {
    result,
    provider: 'Rule-based Fallback',
    confidence: 0.5,
    processingTime: Date.now() - startTime,
  };
}

// Main NLP function with fallback chain
export async function processNLP(request: NLPRequest): Promise<NLPResponse> {
  const { text, task, options } = request;
  
  // Try AI providers in order of preference
  const providers = [
    () => openAINLP(request),
    () => cohereNLP(request),
    () => geminiNLP(request),
    () => huggingFaceNLP(request),
  ];
  
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('NLP provider failed, trying next:', error);
      continue;
    }
  }
  
  // Fallback to rule-based processing
  return ruleBasedNLP(request);
}

// Convenience functions
export async function classifyText(text: string, categories?: string[]): Promise<any> {
  const response = await processNLP({
    text,
    task: 'classification',
    options: { categories },
  });
  return response.result;
}

export async function extractEntities(text: string): Promise<any> {
  const response = await processNLP({
    text,
    task: 'ner',
  });
  return response.result;
}

export async function analyzeSentiment(text: string): Promise<any> {
  const response = await processNLP({
    text,
    task: 'sentiment',
  });
  return response.result;
}

export async function factCheckWithAI(claim: string): Promise<any> {
  const response = await processNLP({
    text: claim,
    task: 'fact-check',
  });
  return response.result;
}

export async function summarizeText(text: string, maxLength?: number): Promise<any> {
  const response = await processNLP({
    text,
    task: 'summarization',
    options: { maxLength },
  });
  return response.result;
} 