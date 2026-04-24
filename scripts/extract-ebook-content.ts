import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'attached_assets', 'Pasted-The-chess-thing-was-a-distraction-A-friendly-public-fac_1768081449261.txt');
const outputFile = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-Extracted.md');

const content = fs.readFileSync(inputFile, 'utf-8');

const themes: Record<string, string[]> = {
  'AI_AND_TECHNOLOGY': [],
  'COSMOLOGY_AND_EARTH': [],
  'SPIRITUAL_TRUTH': [],
  'SCRIPTURE_AND_NAMES': [],
  'MEDICINE_AND_HEALTH': [],
  'SYMBOLS_AND_DECEPTION': [],
  'CONTROL_SYSTEMS': [],
  'FALLEN_ANGELS': [],
  'CALENDAR_AND_TIME': [],
  'PERSONAL_TESTIMONY': [],
  'BOOK_STRUCTURE': []
};

const lines = content.split('\n');
let currentBlock = '';
let isJasonSpeaking = false;
let allJasonContent: string[] = [];
let allOutlines: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  const aiIndicators = [
    '🧠', '🎭', '🕸️', '🌍', '🔥', '💊', '🐝', '📖', '👁️', '🌌', '🧩', '🧭', 
    '♟️', '🎯', '🚪', '🕍', '🪞', '🧬', '✝️', '⚔️', '🩸', '📜', '🔑', '💡',
    "Here's what you've laid down",
    "I've captured this",
    "I've got this",
    "Here's how this piece fits",
    "This segment adds",
    "Ready for the next segment",
    "Let's break it down",
    "So what do I think",
    "You're weaving together",
    "Absolutely, Jason",
    "I'm all in, Jason",
    "I'm tracking every thread",
    "Keep going when you're ready",
    "When you're ready",
    "Just say the word",
    "I'll keep mapping",
    "That's the next layer",
    "This is your foundation so far",
    "Want to dig deeper",
    "Which one do you want to dive into"
  ];
  
  let isAIResponse = false;
  for (const indicator of aiIndicators) {
    if (line.includes(indicator)) {
      isAIResponse = true;
      break;
    }
  }
  
  if (isAIResponse) {
    if (currentBlock.trim()) {
      allJasonContent.push(currentBlock.trim());
      currentBlock = '';
    }
    isJasonSpeaking = false;
    continue;
  }
  
  if (line.match(/^(So |Well |Yeah |Okay |Let's |Now |I |The |Where|You know|Here's|But |And |This |That |If |When |What |Why |How |My |We |They )/)) {
    if (!isJasonSpeaking && currentBlock.trim()) {
      allJasonContent.push(currentBlock.trim());
      currentBlock = '';
    }
    isJasonSpeaking = true;
  }
  
  if (isJasonSpeaking || !line.match(/^[A-Z][a-z]+ [a-z]/)) {
    currentBlock += line + '\n';
  }
  
  if (line.includes('CHAPTER') || line.includes('INTERLUDE') || line.includes('FOREWORD') || 
      line.includes('APPENDIX') || line.includes('TABLE OF CONTENTS')) {
    allOutlines.push(line);
  }
}

if (currentBlock.trim()) {
  allJasonContent.push(currentBlock.trim());
}

let output = `# Through The Veil - Extracted Content\n\n`;
output += `## Source: Full Conversation Extract\n`;
output += `## Total Segments: ${allJasonContent.length}\n\n`;
output += `---\n\n`;

for (let i = 0; i < allJasonContent.length; i++) {
  const segment = allJasonContent[i];
  if (segment.length > 50) {
    output += `### Segment ${i + 1}\n\n`;
    output += segment + '\n\n';
    output += `---\n\n`;
  }
}

if (allOutlines.length > 0) {
  output += `## Detected Chapter/Section Headers\n\n`;
  for (const outline of allOutlines) {
    output += `- ${outline}\n`;
  }
}

fs.writeFileSync(outputFile, output);
console.log(`Extracted to: ${outputFile}`);
console.log(`Total segments: ${allJasonContent.length}`);
console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(0)} KB`);
