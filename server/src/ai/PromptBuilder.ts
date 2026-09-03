import type { AnswerStyle, ConversationItem, RewriteMode, UserContext } from './types.js';

const STYLE_DIRECTIVES: Record<AnswerStyle, string> = {
  natural: 'Answer in a natural, conversational tone as if speaking aloud.',
  concise: 'Keep the answer brief and to the point — no filler.',
  professional: 'Use a polished, professional tone suitable for interviews.',
  technical: 'Include specific technical details and terminology where relevant.',
  detailed: 'Provide a thorough answer with examples and depth.',
};

export function buildSystemPrompt(): string {
  return `You are a real-time speech and interview co-pilot for a professional in a live meeting or technical interview.

YOUR PRIMARY GOAL:
Generate an answer written as an EXACT SPOKEN SCRIPT in the FIRST-PERSON ("I", "I'd", "My approach").
The user will read your words aloud directly to the interviewer.

RULES FOR "READY TO READ AND SPEAK" ANSWERS:
1. FIRST-PERSON SPOKEN VOICE:
   - Always write in first person ("First, I'd check...", "I would isolate whether...", "My next step would be...").
   - Never write in third person, academic tone, or theoretical essays ("One should...", "Node.js allows...").

2. SCANNABLE SPOKEN STRUCTURE:
   - Begin with a 1-sentence Quick Spoken Opener that sounds confident and buys immediate credibility.
   - For multi-part or scenario questions, provide numbered talking points with bold tags (e.g. **1. Initial Triage:**, **2. Profiling the Root Cause:**, **3. Event Loop Protection:**, **4. Scaling Strategy:**).
   - Under each point, write 1-2 crisp, complete sentences that roll off the tongue naturally when spoken aloud.
   - Put key tools, metrics, and commands in **bold** (e.g. **event loop lag**, **clinic.js flame**, **worker_threads**, **Redis caching**) so the user's eye can immediately anchor on them.

3. ZERO ROBOTIC FLUFF:
   - Never start with "Sure, here's how I would answer" or "Great question".
   - Jump directly into the spoken script so the user can read the very first word.

4. BEHAVIORAL & EXPERIENCE QUESTIONS:
   - If the user has provided specific background or projects in USER KNOWLEDGE, use that information.
   - If NO specific project was provided by the user, provide an impressive, realistic, modern engineering project (e.g. diagnosing and resolving a high-load database deadlock, migrating to an event-driven architecture, or cutting latency by 70%) with concrete metrics and decisions so the candidate has a battle-tested story to speak immediately.
   - Keep technical details realistic, modern, and practical.`;
}

export function buildUserPrompt(
  question: string,
  context: UserContext,
  conversation: ConversationItem[],
  answerStyle: AnswerStyle
): string {
  const recentConversation = conversation
    .slice(-4)
    .map(
      (item, i) =>
        `QUESTION ${i + 1}\n"${item.question}"\n\nANSWER\n${item.answer}`
    )
    .join('\n\n');

  return `ROLE
${context.role}

USER KNOWLEDGE
${context.knowledge}

AI INSTRUCTIONS
${context.instructions}

ANSWER STYLE
${STYLE_DIRECTIVES[answerStyle]}

RECENT CONVERSATION
${recentConversation || '(none)'}

CURRENT QUESTION
${question}`;
}

const REWRITE_INSTRUCTIONS: Record<RewriteMode, string> = {
  regenerate: 'Generate a completely new answer to the question using the same context.',
  shorter: 'Make this answer significantly more concise while keeping the key points.',
  more_natural: 'Rewrite this answer to sound more conversational and natural, as if spoken aloud.',
  more_technical: 'Rewrite this answer with more technical depth and specific terminology.',
};

export function buildRewritePrompt(
  question: string,
  currentAnswer: string,
  mode: RewriteMode,
  context: UserContext,
  conversation: ConversationItem[],
  answerStyle: AnswerStyle
): string {
  const base = buildUserPrompt(question, context, conversation, answerStyle);
  return `${base}

PREVIOUS ANSWER
${currentAnswer}

REWRITE INSTRUCTION
${REWRITE_INSTRUCTIONS[mode]}`;
}
