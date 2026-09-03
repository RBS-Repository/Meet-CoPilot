export type AnswerStyle =
  | 'natural'
  | 'concise'
  | 'professional'
  | 'technical'
  | 'detailed';

export type RewriteMode =
  | 'regenerate'
  | 'shorter'
  | 'more_natural'
  | 'more_technical';

export interface UserContext {
  role: string;
  knowledge: string;
  instructions: string;
}

export interface ConversationItem {
  question: string;
  answer: string;
}

export interface AnswerRequest {
  question: string;
  context: UserContext;
  conversation: ConversationItem[];
  answerStyle: AnswerStyle;
}

export interface RewriteRequest {
  question: string;
  currentAnswer: string;
  mode: RewriteMode;
  context: UserContext;
  conversation: ConversationItem[];
  answerStyle: AnswerStyle;
}

export interface TranscriptMessage {
  type: 'interim' | 'final' | 'error';
  text: string;
}
