/**
 * =====================================================
 * DARKWAVE VOICE SERVICE
 * =====================================================
 * 
 * Handles voice cloning and text-to-speech for the
 * Chronicles Personality AI "parallel self" experience.
 * 
 * Supports:
 * - ElevenLabs (instant voice cloning)
 * - Resemble.ai (10-second cloning)
 * - Browser Web Speech API (fallback)
 * 
 * Voice samples are stored and used to create a cloned
 * voice that speaks as the player's parallel self.
 */

import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { 
  voiceSamples, 
  voiceUsage,
  type VoiceSample,
  type VoiceUsage 
} from "@shared/schema";
import { creditsService, CREDIT_COSTS } from "./credits-service";

// Voice provider configuration
export const VOICE_PROVIDERS = {
  ELEVENLABS: "elevenlabs",
  RESEMBLE: "resemble",
  BROWSER: "browser",
} as const;

export type VoiceProvider = typeof VOICE_PROVIDERS[keyof typeof VOICE_PROVIDERS];

// Sample text prompts for voice recording
export const VOICE_SAMPLE_PROMPTS = [
  "In the realm of shadows, I walk unafraid. My name is written in the stars, and my legacy echoes through time.",
  "The path before me splits in two. One leads to glory, the other to wisdom. I choose the road that reveals my true self.",
  "When darkness falls, I become the light. When hope fades, I become the beacon. I am more than flesh and bone.",
  "Through fire and storm, I have journeyed far. Each scar tells a story, each triumph shapes my soul.",
  "They call me by many names in this world. Hero. Wanderer. Seeker. But I know who I truly am.",
];

class VoiceService {
  private elevenLabsApiKey?: string;
  private resembleApiKey?: string;

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.resembleApiKey = process.env.RESEMBLE_API_KEY;
  }

  /**
   * Check if a voice provider is configured
   */
  isProviderConfigured(provider: VoiceProvider): boolean {
    switch (provider) {
      case VOICE_PROVIDERS.ELEVENLABS:
        return !!this.elevenLabsApiKey;
      case VOICE_PROVIDERS.RESEMBLE:
        return !!this.resembleApiKey;
      case VOICE_PROVIDERS.BROWSER:
        return true; // Always available
      default:
        return false;
    }
  }

  /**
   * Get the best available provider
   */
  getBestProvider(): VoiceProvider {
    if (this.isProviderConfigured(VOICE_PROVIDERS.ELEVENLABS)) {
      return VOICE_PROVIDERS.ELEVENLABS;
    }
    if (this.isProviderConfigured(VOICE_PROVIDERS.RESEMBLE)) {
      return VOICE_PROVIDERS.RESEMBLE;
    }
    return VOICE_PROVIDERS.BROWSER;
  }

  /**
   * Get a random sample prompt for voice recording
   */
  getRandomPrompt(): string {
    return VOICE_SAMPLE_PROMPTS[Math.floor(Math.random() * VOICE_SAMPLE_PROMPTS.length)];
  }

  /**
   * Save a voice sample for a user
   */
  async saveVoiceSample(
    userId: string,
    personalityId: string | null,
    sampleData: {
      sampleUrl?: string;
      sampleDurationSec?: number;
      transcriptText?: string;
    }
  ): Promise<VoiceSample> {
    const [sample] = await db
      .insert(voiceSamples)
      .values({
        userId,
        personalityId,
        sampleUrl: sampleData.sampleUrl,
        sampleDurationSec: sampleData.sampleDurationSec,
        transcriptText: sampleData.transcriptText,
        voiceCloneProvider: this.getBestProvider(),
      })
      .returning();
    
    return sample;
  }

  /**
   * Get user's voice sample
   */
  async getUserVoiceSample(userId: string): Promise<VoiceSample | null> {
    const [sample] = await db
      .select()
      .from(voiceSamples)
      .where(eq(voiceSamples.userId, userId))
      .orderBy(sql`${voiceSamples.createdAt} DESC`)
      .limit(1);
    
    return sample || null;
  }

  /**
   * Create a voice clone from a sample (placeholder for API integration)
   */
  async createVoiceClone(
    userId: string,
    sampleId: string
  ): Promise<{ success: boolean; cloneId?: string; error?: string }> {
    // Check credits
    const hasCredits = await creditsService.hasCredits(userId, CREDIT_COSTS.VOICE_CLONE_CREATION);
    if (!hasCredits) {
      return { success: false, error: "Insufficient credits for voice clone creation" };
    }

    const provider = this.getBestProvider();
    
    if (provider === VOICE_PROVIDERS.BROWSER) {
      // Browser doesn't support cloning, but we mark it as "ready" for TTS
      await db
        .update(voiceSamples)
        .set({ 
          cloneStatus: "ready",
          voiceCloneProvider: VOICE_PROVIDERS.BROWSER,
          updatedAt: new Date(),
        })
        .where(eq(voiceSamples.id, sampleId));
      
      return { success: true, cloneId: "browser-native" };
    }

    if (provider === VOICE_PROVIDERS.ELEVENLABS && this.elevenLabsApiKey) {
      try {
        // Get the voice sample
        const [sample] = await db
          .select()
          .from(voiceSamples)
          .where(eq(voiceSamples.id, sampleId));
        
        if (!sample?.sampleUrl) {
          return { success: false, error: "No voice sample URL found" };
        }

        // Mark as processing
        await db
          .update(voiceSamples)
          .set({ 
            cloneStatus: "processing",
            voiceCloneProvider: VOICE_PROVIDERS.ELEVENLABS,
            updatedAt: new Date(),
          })
          .where(eq(voiceSamples.id, sampleId));

        // Create instant voice clone via ElevenLabs API
        const formData = new FormData();
        formData.append("name", `chronicles-${userId.slice(0, 8)}`);
        formData.append("description", "Chronicles parallel self voice clone");
        
        // Fetch the audio file and add to form
        const audioResponse = await fetch(sample.sampleUrl);
        const audioBlob = await audioResponse.blob();
        formData.append("files", audioBlob, "voice_sample.wav");

        const cloneResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: {
            "xi-api-key": this.elevenLabsApiKey,
          },
          body: formData,
        });

        if (!cloneResponse.ok) {
          const errorText = await cloneResponse.text();
          console.error("[ElevenLabs] Clone error:", errorText);
          await db
            .update(voiceSamples)
            .set({ cloneStatus: "failed", updatedAt: new Date() })
            .where(eq(voiceSamples.id, sampleId));
          return { success: false, error: `ElevenLabs clone failed: ${cloneResponse.status}` };
        }

        const cloneData = await cloneResponse.json();
        const voiceId = cloneData.voice_id;

        // Update sample with clone ID and mark as ready
        await db
          .update(voiceSamples)
          .set({ 
            cloneStatus: "ready",
            voiceCloneId: voiceId,
            updatedAt: new Date(),
          })
          .where(eq(voiceSamples.id, sampleId));
        
        // Deduct credits
        await creditsService.deductCredits(
          userId,
          CREDIT_COSTS.VOICE_CLONE_CREATION,
          "Voice clone creation",
          "voice_clone"
        );
        
        return { 
          success: true, 
          cloneId: voiceId,
        };
      } catch (error) {
        console.error("[ElevenLabs] Clone error:", error);
        await db
          .update(voiceSamples)
          .set({ cloneStatus: "failed", updatedAt: new Date() })
          .where(eq(voiceSamples.id, sampleId));
        return { success: false, error: "Voice clone creation failed" };
      }
    }

    if (provider === VOICE_PROVIDERS.RESEMBLE && this.resembleApiKey) {
      // TODO: Implement Resemble.ai API integration
      await db
        .update(voiceSamples)
        .set({ 
          cloneStatus: "processing",
          voiceCloneProvider: VOICE_PROVIDERS.RESEMBLE,
          updatedAt: new Date(),
        })
        .where(eq(voiceSamples.id, sampleId));
      
      // Deduct credits
      await creditsService.deductCredits(
        userId,
        CREDIT_COSTS.VOICE_CLONE_CREATION,
        "Voice clone creation",
        "voice_clone"
      );
      
      return { 
        success: true, 
        cloneId: `resemble-pending-${sampleId}`,
      };
    }

    return { success: false, error: "No voice provider configured" };
  }

  /**
   * Generate speech from text (placeholder for API integration)
   */
  async generateSpeech(
    userId: string,
    text: string,
    voiceCloneId?: string
  ): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    const charCount = text.length;
    const creditsNeeded = Math.ceil(charCount / 100) * CREDIT_COSTS.VOICE_TTS_PER_100_CHARS;
    
    // Check credits
    const hasCredits = await creditsService.hasCredits(userId, creditsNeeded);
    if (!hasCredits) {
      return { success: false, error: "Insufficient credits for speech generation" };
    }

    const provider = this.getBestProvider();
    
    // Record usage
    await db.insert(voiceUsage).values({
      userId,
      usageType: "tts",
      creditsUsed: creditsNeeded,
      charactersProcessed: charCount,
      provider,
    });
    
    // Deduct credits
    await creditsService.deductCredits(
      userId,
      creditsNeeded,
      `Text-to-speech (${charCount} characters)`,
      "voice_tts"
    );
    
    if (provider === VOICE_PROVIDERS.BROWSER) {
      // Browser handles TTS client-side, just return success
      return { success: true };
    }

    // ElevenLabs TTS with cloned voice
    if (provider === VOICE_PROVIDERS.ELEVENLABS && this.elevenLabsApiKey) {
      try {
        // Get user's cloned voice ID if available
        const sample = await this.getUserVoiceSample(userId);
        const voiceId = voiceCloneId || sample?.voiceCloneId || "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel voice
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": this.elevenLabsApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!response.ok) {
          console.error("[ElevenLabs] TTS error:", response.status);
          return { success: false, error: `TTS failed: ${response.status}` };
        }

        // Convert to base64 data URL for frontend playback
        const audioBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString('base64');
        const audioUrl = `data:audio/mpeg;base64,${base64}`;
        
        return { success: true, audioUrl };
      } catch (error) {
        console.error("[ElevenLabs] TTS error:", error);
        return { success: false, error: "Speech generation failed" };
      }
    }

    return { 
      success: true, 
      audioUrl: undefined, // Frontend falls back to browser TTS
    };
  }

  /**
   * Get voice clone status for a user
   */
  async getVoiceStatus(userId: string): Promise<{
    hasVoiceSample: boolean;
    cloneStatus: string | null;
    provider: VoiceProvider;
    isReady: boolean;
  }> {
    const sample = await this.getUserVoiceSample(userId);
    const provider = this.getBestProvider();
    
    return {
      hasVoiceSample: !!sample,
      cloneStatus: sample?.cloneStatus || null,
      provider,
      isReady: sample?.cloneStatus === "ready" || provider === VOICE_PROVIDERS.BROWSER,
    };
  }

  /**
   * Get voice usage stats for a user
   */
  async getUsageStats(userId: string): Promise<{
    totalCreditsUsed: number;
    totalCharactersProcessed: number;
    totalDurationMs: number;
  }> {
    const usage = await db
      .select()
      .from(voiceUsage)
      .where(eq(voiceUsage.userId, userId));
    
    return usage.reduce((acc, u) => ({
      totalCreditsUsed: acc.totalCreditsUsed + (u.creditsUsed || 0),
      totalCharactersProcessed: acc.totalCharactersProcessed + (u.charactersProcessed || 0),
      totalDurationMs: acc.totalDurationMs + (u.durationMs || 0),
    }), { totalCreditsUsed: 0, totalCharactersProcessed: 0, totalDurationMs: 0 });
  }
}

export const voiceService = new VoiceService();
