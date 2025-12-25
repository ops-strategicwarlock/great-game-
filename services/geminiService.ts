
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FACTION_ENCOUNTERS } from "../constants";
import { Faction } from "../types";

/**
 * Performs a wasteland search using Google Search grounding.
 */
export const performWastelandSearch = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
 * Generates a faction-specific tactical briefing utilizing the encounter pool.
 */
export const generateTacticalBriefing = async (territory: string, faction: Faction) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const factionData = FACTION_ENCOUNTERS[faction];
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze ${territory} currently held by ${faction}. 
    Faction Thematic Focus: ${factionData.focus}
    Permitted Encounter Types: ${factionData.encounters.join(', ')}
    Possible Reward Focuses: ${factionData.rewards.join(', ')}
    
    TASK: Pick ONE specific encounter from the list and expand it into a full tactical SITREP.
    - Title: A high-clearance mission name.
    - Description: A detailed narrative of the tactical situation.
    - EnemyType: The specific threat (e.g., 'NCR Heavy Trooper', 'Enclave Sigma Squad').
    - Difficulty: Scale 1-10 based on faction hostility.
    - RewardEstimate: A descriptive summary of what will be looted.
    - StabilityImpact: How much damage this assault does to faction control (5-25).
    - UniqueRewardType: Must be one of [INTEL, PARTS, CAPS, REPUTATION].
    
    Return strictly as valid JSON.`,
    config: {
      thinkingConfig: { thinkingBudget: 1000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          enemyType: { type: Type.STRING },
          difficulty: { type: Type.NUMBER },
          rewardEstimate: { type: Type.STRING },
          stabilityImpact: { type: Type.NUMBER },
          uniqueRewardType: { type: Type.STRING, enum: ['INTEL', 'PARTS', 'CAPS', 'REPUTATION'] }
        },
        required: ["title", "description", "enemyType", "difficulty", "rewardEstimate", "stabilityImpact", "uniqueRewardType"]
      }
    }
  });
  
  return JSON.parse(response.text);
};

/**
 * Generates a lore fragment based on real-world coordinates using Maps Grounding.
 */
export const generateLocalizedLore = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `SYSTEM SCAN: Coordinates [${lat}, ${lng}]. 
    Use Google Maps to identify the surrounding terrain and landmarks. 
    Imagine this location in the Fallout 'Day 0' universe. 
    Generate a 'Echo Memory' fragment: a short narrative artifact found at these specific coordinates.
    Include a mention of a 'Strand' connection or pre-war echo.
    Return ONLY a JSON object with keys: title, fragment, environment, rarity (one of 'COMMON', 'RARE', 'LEGENDARY').`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      },
    }
  });

  const text = response.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse JSON from localized lore response", e);
    }
  }
  throw new Error("Could not extract valid SITREP JSON from Maps Grounding response.");
};

/**
 * Generates narrative for a specific combat wave with faction-specific combat behaviors.
 */
export const generateCombatWave = async (briefing: any, wave: number, faction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `PHASE: Combat Wave ${wave}/3. 
    OP: ${briefing.title}. 
    FACTION: ${faction}. 
    THREAT: ${briefing.enemyType}.
    
    Describe the escalating combat situation. 
    Wave 1: Initial contact and scouting.
    Wave 2: Heavy engagement, specialized weapons (lasers for BOS/Enclave, numbers for NCR).
    Wave 3: Boss/Commander encounter or defensive fallback.
    
    Keep the tone gritty, technical, and focused on the difficulty level of ${briefing.difficulty}/10.`,
  });
  return response.text;
};

/**
 * Converts text to speech using Gemini TTS.
 */
export const speakBroadcast = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say with a gritty, distorted radioactive radio host voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return base64Audio;
  }
  return null;
};
