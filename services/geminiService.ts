
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs a wasteland search using Google Search grounding.
 */
export const performWastelandSearch = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Wasteland OSINT Terminal: Searching data for "${query}". 
    Provide a detailed report. Treat real-world history as 'pre-war archive data'. 
    Focus on how this information impacts the power balance between the NCR, Enclave, and Brotherhood.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Generates a faction-specific tactical briefing (The "Event" stage).
 */
export const generateTacticalBriefing = async (territory: string, faction: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze ${territory} currently held by ${faction}. 
    Generate a tactical encounter based on these tables:
    - If NCR: Introduce 'NCR Patrol Unit' or 'Settler Dispute'. Focus on bureaucracy or under-supplied rangers.
    - If Enclave: Introduce 'Robotic Security Checkpoint' or 'Radiation Anomaly'. Focus on high-tech terror.
    - If BOS: Introduce 'Scribe Field Research' or 'Paladin Sentry'. Focus on tech-hoarding.
    - If House: Introduce 'Securitron Mk II Patrol'. Focus on automated efficiency.
    - If Independent: Introduce 'Raider Ambush' or 'Feral Swarm'.
    Return a structured JSON SITREP.`,
    config: {
      thinkingConfig: { thinkingBudget: 1000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          enemyType: { type: Type.STRING },
          difficulty: { type: Type.NUMBER, description: "1 to 10" },
          rewardEstimate: { type: Type.STRING }
        },
        required: ["title", "description", "enemyType", "difficulty", "rewardEstimate"]
      }
    }
  });
  
  return JSON.parse(response.text);
};

/**
 * Generates a lore fragment based on real-world coordinates.
 */
export const generateLocalizedLore = async (lat: number, lng: number) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `SYSTEM SCAN: Coordinates [${lat}, ${lng}]. 
    Imagine this real-world location in the Fallout 'Day 0' universe. 
    Analyze the terrain (Urban, Industrial, or Rural). 
    Generate a 'Echo Memory' fragment: a short narrative artifact found at these coordinates.
    Include a mention of a 'Strand' connection.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          fragment: { type: Type.STRING },
          environment: { type: Type.STRING, enum: ['URBAN', 'INDUSTRIAL', 'RURAL'] },
          rarity: { type: Type.STRING, enum: ['COMMON', 'RARE', 'LEGENDARY'] }
        },
        required: ["title", "fragment", "environment", "rarity"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * Generates narrative for a specific combat wave (The "MIE" stage).
 */
export const generateCombatWave = async (briefing: any, wave: number, faction: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Describe Wave ${wave}/3 of an assault against a ${faction} ${briefing.enemyType}. 
    The current situation is: ${briefing.description}. 
    Make it immersive, dark, and suggest a tactical challenge (e.g. 'The plasma turrets are cycling', 'The NCR soldiers are calling for backup').`,
  });
  return response.text;
};

export const generateLoreArtifact = async (location: string, faction: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a short Fallout-style terminal entry or holotape transcript found at ${location}. 
    The area is controlled by ${faction}. Mention pre-war Bakersfield (Necropolis).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          rarity: { type: Type.STRING, enum: ['COMMON', 'RARE', 'LEGENDARY'] }
        },
        required: ["title", "content", "rarity"]
      }
    }
  });
  return JSON.parse(response.text);
};
