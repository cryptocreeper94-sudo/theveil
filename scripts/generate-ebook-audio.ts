/**
 * Generate pre-recorded audio files for all ebook chapters using ElevenLabs
 * 
 * Usage: npx tsx scripts/generate-ebook-audio.ts
 * 
 * This creates MP3 files for each chapter that can be used for offline playback.
 */

import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - calm female narrator
const MODEL_ID = "eleven_monolingual_v1";

interface Chapter {
  id: string;
  title: string;
  content: string;
  partTitle: string;
}

// Parse markdown to extract chapters
function parseMarkdownToChapters(markdown: string): Chapter[] {
  const lines = markdown.split('\n');
  const chapters: Chapter[] = [];
  
  let currentChapter: Chapter | null = null;
  let currentContent: string[] = [];
  let currentPart = "";
  let inTableOfContents = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip table of contents section
    if (line.match(/^## TABLE OF CONTENTS/i)) {
      inTableOfContents = true;
      continue;
    }
    if (inTableOfContents && line.match(/^# PART/i)) {
      inTableOfContents = false;
    }
    if (inTableOfContents) continue;
    
    // Detect PART headers
    if (line.match(/^# PART [IVXLC]+:/i) || line.match(/^# PART (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE):/i)) {
      currentPart = line.replace(/^# /, '').trim();
      continue;
    }
    
    // Detect chapter headers (including appendices)
    const chapterMatch = line.match(/^# (CHAPTER \d+[A-Z]?:.+)$/i);
    const appendixMatch = line.match(/^# (APPENDIX[^:]*:.*)$/i) || line.match(/^# (APPENDIX.*)$/i);
    
    if (chapterMatch || appendixMatch) {
      // Save previous chapter
      if (currentChapter) {
        currentChapter.content = currentContent.join('\n').trim();
        if (currentChapter.content.length > 0) {
          chapters.push(currentChapter);
        }
      }
      
      const title = (chapterMatch ? chapterMatch[1] : appendixMatch![1]).trim();
      const id = 'ch-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').substring(0, 50);
      
      // Set appendices to their own part
      if (appendixMatch && !currentPart.includes('APPENDIX')) {
        currentPart = 'APPENDIX: Reference Materials';
      }
      
      currentChapter = {
        id,
        title,
        content: '',
        partTitle: currentPart
      };
      currentContent = [];
      continue;
    }
    
    // Collect chapter content
    if (currentChapter) {
      currentContent.push(line);
    }
  }
  
  // Save last chapter
  if (currentChapter) {
    currentChapter.content = currentContent.join('\n').trim();
    if (currentChapter.content.length > 0) {
      chapters.push(currentChapter);
    }
  }
  
  return chapters;
}

// Clean text for TTS - remove markdown formatting
function cleanTextForTTS(text: string): string {
  return text
    .replace(/^#+\s*/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/_([^_]+)_/g, '$1') // Remove underline
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^[-*]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/^>\s*/gm, '') // Remove blockquotes
    .replace(/---+/g, '') // Remove horizontal rules
    .replace(/\|[^|]+\|/g, '') // Remove tables
    .replace(/[!]{2,}/g, '!') // Reduce multiple exclamation marks
    .replace(/[:;]/g, ',') // Replace colons/semicolons for better pacing
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Generate audio for a single chapter
async function generateChapterAudio(chapter: Chapter, outputDir: string): Promise<string | null> {
  const cleanText = cleanTextForTTS(chapter.content);
  
  // ElevenLabs has a character limit per request (around 5000 for standard API)
  // For longer chapters, we might need to split and concatenate
  const maxChars = 4500;
  
  if (cleanText.length === 0) {
    console.log(`  Skipping ${chapter.title} - no content`);
    return null;
  }
  
  // For now, truncate to max chars (we can implement chunking later if needed)
  const textToSpeak = cleanText.length > maxChars 
    ? cleanText.substring(0, maxChars) + "... Chapter continues in the written text."
    : cleanText;
  
  console.log(`  Generating audio for: ${chapter.title} (${textToSpeak.length} chars)`);
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  Error generating audio: ${response.status} - ${errorText}`);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const outputPath = path.join(outputDir, `${chapter.id}.mp3`);
    
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    console.log(`  Saved: ${outputPath} (${Math.round(audioBuffer.byteLength / 1024)}KB)`);
    
    return outputPath;
  } catch (error) {
    console.error(`  Error generating audio for ${chapter.title}:`, error);
    return null;
  }
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('EBOOK AUDIO GENERATOR');
  console.log('='.repeat(60));
  
  if (!ELEVENLABS_API_KEY) {
    console.error('ERROR: ELEVENLABS_API_KEY environment variable not set');
    process.exit(1);
  }
  
  // Read markdown file
  const markdownPath = path.join(process.cwd(), 'client/public/through-the-veil.md');
  if (!fs.existsSync(markdownPath)) {
    console.error(`ERROR: Markdown file not found: ${markdownPath}`);
    process.exit(1);
  }
  
  const markdown = fs.readFileSync(markdownPath, 'utf-8');
  console.log(`Loaded markdown: ${Math.round(markdown.length / 1024)}KB`);
  
  // Parse chapters
  const chapters = parseMarkdownToChapters(markdown);
  console.log(`Found ${chapters.length} chapters to process\n`);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'public/audio/veil');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Output directory: ${outputDir}\n`);
  
  // Generate audio for each chapter
  const results: { chapter: string; path: string | null }[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    console.log(`[${i + 1}/${chapters.length}] Processing: ${chapter.title}`);
    
    const audioPath = await generateChapterAudio(chapter, outputDir);
    results.push({ chapter: chapter.title, path: audioPath });
    
    if (audioPath) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Add a small delay to avoid rate limiting
    if (i < chapters.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Success: ${successCount}/${chapters.length}`);
  console.log(`Failed: ${failCount}/${chapters.length}`);
  
  // Generate manifest file for the e-reader
  const manifest = {
    generatedAt: new Date().toISOString(),
    voice: "Rachel (ElevenLabs)",
    chapters: results.filter(r => r.path).map(r => ({
      title: r.chapter,
      file: path.basename(r.path!)
    }))
  };
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${manifestPath}`);
}

main().catch(console.error);
