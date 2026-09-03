import type { DetectedQuestion } from '../types';

const INTERROGATIVES = [
  'what',
  'how',
  'why',
  'when',
  'where',
  'who',
  'which',
  'whose',
  'can',
  'could',
  'would',
  'will',
  'shall',
  'should',
  'do',
  'does',
  'did',
  'is',
  'are',
  'was',
  'were',
  'have',
  'has',
  'had',
  'tell me',
  'explain',
  'describe',
  'walk me through',
  'walk us through',
  'give me an example',
];

const SCENARIO_STARTERS = [
  /\b(say|suppose|imagine|consider|assume|in a scenario|in a case|if you have|if your|when your|given a|let's say|lets say)\b/i,
  /\b(walk|talk|take|guide)\s+(me|us)\s+through\b/i,
  /\b(explain|describe|clarify|elaborate\s+on)\b/i,
];

const QUESTION_PATTERNS = [
  /\b(do|did|does|have|has|had|are|is|were|was|can|could|would|will|should)\s+you\b/i,
  /\bwhat\s+(is|are|was|were|do|does|did|would|should|can|about|if|metrics|tools|steps|approach)\b/i,
  /\bhow\s+(do|does|did|can|could|would|should|to|is|are|was|were|about|would you)\b/i,
  /\bwhy\s+(do|does|did|is|are|was|were|would|should|can)\b/i,
  /\b(tell|explain|describe|walk)\s+(me|us)\b/i,
  /\b(any\s+thoughts\s+on|what\s+do\s+you\s+think)\b/i,
  /\b(your\s+experience\s+with|have\s+you\s+ever|worked\s+with|how\s+would\s+you)\b/i,
  /\b(what\s+architectural|how\s+do\s+you\s+prevent|how\s+do\s+you\s+determine)\b/i,
];

const INTRO_FILLER_REGEX =
  /^(all right|alright|okay|ok|so|now|next|moving on|here('s| is)|let's (see|talk|do|move)|great|cool|awesome|got it|makes sense)\b.*?(question|one|next|scenario|topic)?[:.,]?$/i;

const CONFIDENCE_THRESHOLD = 0.35;
const COOLDOWN_MS = 2_500;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export class QuestionDetector {
  private lastQuestion = '';
  private lastDetectedAt = 0;

  analyze(text: string, _isFinal: boolean): DetectedQuestion | null {
    if (!text || !text.trim()) return null;

    const trimmed = text.trim();
    if (trimmed.split(/\s+/).length < 2) return null;

    const lower = trimmed.toLowerCase();
    let confidence = 0;

    // Has question mark(s)
    if (trimmed.includes('?')) {
      confidence += 0.45;
    }

    // Contains scenario starters (e.g. "Say your Node.js API...", "Walk me through...")
    if (SCENARIO_STARTERS.some((re) => re.test(lower))) {
      confidence += 0.4;
    }

    // Starts with or contains interrogatives
    const startsWithInterrogative = INTERROGATIVES.some(
      (w) => lower.startsWith(w + ' ') || lower.startsWith(w + "'")
    );
    if (startsWithInterrogative) {
      confidence += 0.35;
    }

    // Matches conversational interview / meeting question patterns
    for (const pattern of QUESTION_PATTERNS) {
      if (pattern.test(lower)) {
        confidence += 0.25;
        break;
      }
    }

    if (confidence < CONFIDENCE_THRESHOLD) {
      return null;
    }

    // Extract the full prompt starting from where scenario or question begins,
    // trimming off purely conversational filler (e.g. "All right, here's a senior one.")
    const targetQuestion = this.cleanPrompt(trimmed);

    // Cooldown check for automatic triggers
    const now = Date.now();
    if (now - this.lastDetectedAt < COOLDOWN_MS) {
      return null;
    }

    const normalized = normalize(targetQuestion);
    if (
      this.lastQuestion &&
      jaccardSimilarity(normalized, normalize(this.lastQuestion)) > 0.8
    ) {
      return null;
    }

    this.lastQuestion = targetQuestion;
    this.lastDetectedAt = now;

    return { question: targetQuestion, confidence };
  }

  /**
   * Cleans leading conversational filler while keeping the entire scenario and all sub-questions intact.
   */
  private cleanPrompt(text: string): string {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      return text;
    }

    // Find the first sentence that begins the actual scenario or question
    let startIndex = 0;
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const sLower = s.toLowerCase();

      // If it's pure filler, skip to next sentence
      if (INTRO_FILLER_REGEX.test(s)) {
        startIndex = i + 1;
        continue;
      }

      // If it matches a scenario starter or question, keep from here onwards!
      const isScenario = SCENARIO_STARTERS.some((re) => re.test(sLower));
      const isQuestion =
        INTERROGATIVES.some((w) => sLower.startsWith(w + ' ') || sLower.startsWith(w + "'")) ||
        QUESTION_PATTERNS.some((p) => p.test(sLower)) ||
        s.includes('?');

      if (isScenario || isQuestion) {
        startIndex = i;
        break;
      }
    }

    if (startIndex < sentences.length) {
      return sentences.slice(startIndex).join(' ');
    }

    return text;
  }

  reset(): void {
    this.lastQuestion = '';
    this.lastDetectedAt = 0;
  }
}

export const questionDetector = new QuestionDetector();
