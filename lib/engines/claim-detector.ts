// Simple claim detector for MVP
// In production, replace with advanced NLP/ML model

import { classifyText } from '@/lib/services/ai-nlp-service'; // Keep existing import
import axios from 'axios'; // Keep existing import

// Import necessary libraries (install them if you haven't already)
// pnpm install @google/generative-ai openai cohere @huggingface/inference
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import cohere from 'cohere-ai';
import { HfInference } from '@huggingface/inference';

import type { TranscriptSegment } from '../realtime-types'; // Adjust import path if necessary
import type { FactCheckClaim } from '../types/multi-modal'; // Adjust import path if necessary
import { executeQuery } from '../database/connection'; // Adjust import path if necessary


const CLAIM_KEYWORDS = [
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'can', 'could', 'should', 'must', 'did', 'does', 'do', 'claims', 'reports', 'according to', 'study', 'research', 'data', 'statistic', 'survey', 'found', 'shows', 'estimates', 'suggests', 'reveals', 'confirms', 'denies', 'proves', 'disproves', 'states', 'announces', 'declares', 'predicts', 'projects', 'indicates', 'demonstrates', 'concludes', 'asserts', 'alleges', 'affirms', 'contradicts', 'implies', 'implied', 'implies that', 'implied that', 'suggested that', 'suggests that', 'found that', 'shows that', 'estimates that', 'reveals that', 'confirms that', 'denies that', 'proves that', 'disproves that', 'states that', 'announces that', 'declares that', 'predicts that', 'projects that', 'indicates that', 'demonstrates that', 'concludes that', 'asserts that', 'alleges that', 'affirms that', 'contradicts that'
];

// API Keys from environment (Keep existing variables)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN; // Note: Using API_TOKEN as in your existing file

// --- Initialize API Clients (Using the existing variables) ---

// Google Gemini
const genAI = GOOGLE_GEMINI_API_KEY ? new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY) : null;
const geminiModel = genAI?.getGenerativeModel({ model: "gemini-pro" }); // Or other suitable model

// OpenAI
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Cohere
if (COHERE_API_KEY) {
  cohere.init(COHERE_API_KEY);
} else {
    console.warn("COHERE_API_KEY environment variable not set. Cohere integration disabled.");
}

// Hugging Face Inference
const hf = HUGGINGFACE_API_TOKEN ? new HfInference(HUGGINGFACE_API_TOKEN) : null; // Using API_TOKEN


// --- Claim Detection Logic ---

export async function detectClaims(text: string, segmentId: string, sessionId: string): Promise<FactCheckClaim[]> {
    const detectedClaims: FactCheckClaim[] = [];

    if (!text || text.trim() === "") {
        return detectedClaims; // Return empty array if text is empty
    }

    // **TODO: Implement your advanced claim detection logic using the initialized API clients**
    // This is where you'll decide which model(s) to use and how.

    // --- Example: Using OpenAI for Claim Detection ---
    if (openaiClient) {
        try {
            const prompt = `Analyze the following text and identify factual claims that can be verified.
            Extract each claim as a short, concise sentence.
            Return a JSON object with a single key "claims" which is an array of strings, where each string is a detected claim.
            If no factual claims are found, return {"claims": []}.

            Text: "${text}"

            JSON Claims:`;

            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o", // Or other suitable OpenAI model
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2, // Keep temperature low for factual extraction
                max_tokens: 500,
                 response_format: { type: "json_object" }, // Request JSON output
            });

            const responseContent = completion.choices[0].message.content;
             console.log("OpenAI Claim Detection Response:", responseContent);


            if (responseContent) {
                try {
                    const parsedResponse = JSON.parse(responseContent);
                     const claimsArray = parsedResponse.claims as string[];

                    if (Array.isArray(claimsArray)) {
                        for (const claimText of claimsArray) {
                             if (claimText && claimText.trim() !== "") {
                                const claim: FactCheckClaim = {
                                    id: `claim_${Date.now()}_openai_${Math.random().toString(36).substr(2, 9)}`,
                                    text: claimText,
                                    timestamp: Date.now(), // Or use the segment timestamp
                                    confidence: 0.7, // Assign a default confidence
                                    type: "auto_detected",
                                    sessionId: sessionId,
                                };
                                detectedClaims.push(claim);
                             }
                        }
                    }
                } catch (parseError) {
                    console.error("Failed to parse OpenAI claim detection response:", parseError);
                    // Handle parsing error - maybe log the raw response for debugging
                     console.error("Raw OpenAI response:", responseContent);
                }
            }

        } catch (error) {
            console.error("OpenAI Claim Detection Error:", error);
            // Handle API error
        }
    }

    // --- Example: Using Google Gemini for Claim Detection (as a fallback or alternative) ---
     if (geminiModel && detectedClaims.length === 0) { // Example: Use Gemini if no claims detected yet
         try {
             const prompt = `Identify factual claims in the following text. Provide each claim as a concise statement.
             Format the output as a JSON array of strings. If no claims are found, return an empty array [].

             Text: "${text}"

             JSON Output:`;

             const result = await geminiModel.generateContent(prompt);
             const response = result.response;
             const responseText = response.text();
             console.log("Gemini Claim Detection Response:", responseText);

             if (responseText) {
                 try {
                     const claimsArray = JSON.parse(responseText) as string[]; // Assuming JSON array output
                     if (Array.isArray(claimsArray)) {
                         for (const claimText of claimsArray) {
                              if (claimText && claimText.trim() !== "") {
                                 const claim: FactCheckClaim = {
                                     id: `claim_${Date.now()}_gemini_${Math.random().toString(36).substr(2, 9)}`,
                                     text: claimText,
                                     timestamp: Date.now(), // Or use the segment timestamp
                                     confidence: 0.6, // Assign a default confidence
                                     type: "auto_detected",
                                     sessionId: sessionId,
                                 };
                                 detectedClaims.push(claim);
                              }
                         }
                     }
                 } catch (parseError) {
                     console.error("Failed to parse Gemini claim detection response:", parseError);
                     // Handle parsing error
                      console.error("Raw Gemini response:", responseText);
                 }
             }

         } catch (error) {
             console.error("Gemini Claim Detection Error:", error);
             // Handle API error
         }
     }


     // --- Example: Using Hugging Face for a specific Claim Detection model ---
     // Find a suitable claim detection model on Hugging Face Hub and use it here.
     // This example uses a zero-shot classification model for illustration.
    if (hf && detectedClaims.length === 0) { // Example: Use Hugging Face as a fallback
        try {
            // Using a zero-shot classification model to identify if the text is likely a claim
            // You might need to process the text sentence by sentence for better results
            const zeroShotClassificationResult = await hf.zeroShotClassification({
                model: 'facebook/bart-large-mnli', // Example model - find one suitable for claims
                inputs: text,
                parameters: { candidate_labels: ['factual statement', 'opinion', 'question'], multi_label: false },
            });
            console.log("Hugging Face Zero-Shot Classification:", zeroShotClassificationResult);

            // If the model confidently classifies the text as a "factual statement", consider it a potential claim.
            const potentialClaimLabel = zeroShotClassificationResult.labels[0];
            const potentialClaimScore = zeroShotClassificationResult.scores[0];

            if (potentialClaimLabel === 'factual statement' && potentialClaimScore > 0.8) { // Adjust confidence threshold
                 const claim: FactCheckClaim = {
                     id: `claim_${Date.now()}_hf_${Math.random().toString(36).substr(2, 9)}`,
                     text: text.trim(), // Use the whole text segment as the claim for this model
                     timestamp: Date.now(), // Or use segment timestamp
                     confidence: potentialClaimScore, // Use model's confidence
                     type: "auto_detected",
                     sessionId: sessionId,
                 };
                 detectedClaims.push(claim);
            }


        } catch (error) {
            console.error("Hugging Face Inference Error:", error);
            // Handle API error
        }
    }

    // --- Cohere can be used for supporting NLP tasks like NER or Classification ---
    // Integrate Cohere here if its capabilities (like entity recognition) can
    // help refine your claim detection logic from other models.
    // Example: If you use another model to identify sentences that are *potentially* claims,
    // you could then use Cohere's NER to extract key entities from those sentences.
     /*
     if (cohereApiKey && detectedClaims.length > 0) { // Example: If claims were detected by other models
         try {
              for (const claim of detectedClaims) {
                  const { body } = await cohere.annotate({
                      text: claim.text,
                       model: 'large',
                  });
                  console.log(`Cohere Entities for claim "${claim.text}":`, body.annotations);
                  // Store or use these entities as needed
              }
         } catch (error) {
             console.error("Cohere Annotate Error:", error);
         }
     }
     */


    // **TODO: Refine confidence scoring based on the outputs of the models used**
    // The current confidence scores (0.7, 0.6, potentialClaimScore) are examples.
    // You should devise a way to assign a more accurate confidence based on:
    // - Which model(s) detected the claim.
    // - The confidence scores provided by the models (if any).
    // - Potential agreement or disagreement between multiple models.

    // Save the detected claims to the database
    for (const claim of detectedClaims) {
        await saveClaimToDatabase(claim);
    }


    return detectedClaims;
}

// **TODO: Implement this function to save claims to your database**
// This function should insert a FactCheckClaim object into your 'claims' table.
async function saveClaimToDatabase(claim: FactCheckClaim): Promise<void> {
    console.log("Saving claim to database:", claim); // Placeholder
    try {
         await executeQuery(
            "INSERT INTO claims (id, session_id, text, timestamp, confidence, type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [claim.id, claim.sessionId, claim.text, claim.timestamp, claim.confidence, claim.type, (claim as any).userId || null] // Assuming userId might be on manual claims
         );
         console.log(`Claim ${claim.id} saved to database.`);
    } catch (error) {
         console.error(`Error saving claim ${claim.id} to database:`, error);
         // Depending on your error handling strategy, you might not want to re-throw here
         // if a single failed save shouldn't stop the whole process.
    }
}

// You will also need to ensure your database schema (claims table) supports the FactCheckClaim structure.
// Example (from our earlier schema refinement):
// CREATE TABLE IF NOT EXISTS claims (
//     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
//     text TEXT NOT NULL,
//     timestamp BIGINT NOT NULL, -- Using BIGINT for timestamp_ms
//     confidence DECIMAL(5,4),   -- Using DECIMAL for confidence 0.0 to 1.0
//     type VARCHAR(50) NOT NULL CHECK (type IN ('auto_detected', 'manual', 'voice_command')),
//     user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user for manual/voice claims
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
