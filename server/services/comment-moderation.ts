const SPAM_PATTERNS = [
  /buy now/i,
  /100x guaranteed/i,
  /check out my (token|coin)/i,
  /easy money/i,
  /dm me for/i,
  /join (my|this) (telegram|discord)/i,
  /airdrop coming/i,
  /presale now/i,
  /send [\d.]+ (eth|sol|bnb)/i,
  /www\..+\.(xyz|io|com)/i,
  /@\w+ join/i,
];

const SCAM_PATTERNS = [
  /validate your wallet/i,
  /connect wallet to claim/i,
  /free (tokens|coins|crypto)/i,
  /guaranteed profit/i,
  /no risk/i,
  /limited time offer/i,
  /exclusive access/i,
  /official support/i,
  /seed phrase/i,
  /private key/i,
  /verify account/i,
  /claim rewards now/i,
];

const ABUSE_PATTERNS = [
  /\b(idiot|stupid|moron|dumb)\b/i,
  /\bf+u+c+k/i,
  /\bs+h+i+t/i,
  /\bkill\s+yourself\b/i,
  /\bdie\b/i,
  /\btrash\b/i,
  /\bgarbage\b/i,
  /ngmi/i,
];

const EMOJI_SPAM_THRESHOLD = 10;
const CAPS_RATIO_THRESHOLD = 0.6;
const MIN_LENGTH_FOR_CAPS_CHECK = 20;

export interface ModerationResult {
  isAllowed: boolean;
  flags: ModerationFlag[];
  score: number;
  requiresReview: boolean;
}

export interface ModerationFlag {
  type: 'spam' | 'scam' | 'abuse' | 'quality';
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export function moderateComment(content: string): ModerationResult {
  const flags: ModerationFlag[] = [];
  let score = 100;
  
  const text = content.trim();
  
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        type: 'spam',
        reason: 'Contains promotional or spam-like content',
        severity: 'medium'
      });
      score -= 25;
      break;
    }
  }
  
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        type: 'scam',
        reason: 'Contains potential scam indicators',
        severity: 'high'
      });
      score -= 40;
      break;
    }
  }
  
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        type: 'abuse',
        reason: 'Contains abusive or offensive language',
        severity: 'medium'
      });
      score -= 20;
      break;
    }
  }
  
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
  const emojiCount = (text.match(emojiRegex) || []).length;
  if (emojiCount > EMOJI_SPAM_THRESHOLD) {
    flags.push({
      type: 'quality',
      reason: 'Excessive emoji usage',
      severity: 'low'
    });
    score -= 10;
  }
  
  if (text.length >= MIN_LENGTH_FOR_CAPS_CHECK) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    const upperCount = (letters.match(/[A-Z]/g) || []).length;
    const ratio = letters.length > 0 ? upperCount / letters.length : 0;
    
    if (ratio > CAPS_RATIO_THRESHOLD) {
      flags.push({
        type: 'quality',
        reason: 'Excessive use of capital letters',
        severity: 'low'
      });
      score -= 10;
    }
  }
  
  if (text.length < 5) {
    flags.push({
      type: 'quality',
      reason: 'Comment too short to be helpful',
      severity: 'low'
    });
    score -= 5;
  }
  
  score = Math.max(0, score);
  
  const hasHighSeverity = flags.some(f => f.severity === 'high');
  const hasMediumSeverity = flags.some(f => f.severity === 'medium');
  
  return {
    isAllowed: !hasHighSeverity && score > 30,
    flags,
    score,
    requiresReview: hasMediumSeverity || (score < 70 && score > 30)
  };
}

export function getSentimentFromContent(content: string): 'bullish' | 'bearish' | 'warning' | 'neutral' {
  const text = content.toLowerCase();
  
  const bullishWords = ['moon', 'bullish', 'pump', 'buy', 'holding', 'gem', 'early', 'lfg', 'wagmi', 'diamond', 'hands'];
  const bearishWords = ['dump', 'sell', 'bearish', 'down', 'short', 'ngmi', 'rekt', 'crash'];
  const warningWords = ['rug', 'scam', 'honeypot', 'warning', 'careful', 'suspicious', 'avoid', 'fake', 'beware'];
  
  const bullishCount = bullishWords.filter(w => text.includes(w)).length;
  const bearishCount = bearishWords.filter(w => text.includes(w)).length;
  const warningCount = warningWords.filter(w => text.includes(w)).length;
  
  if (warningCount > 0) return 'warning';
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}
