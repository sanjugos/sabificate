import { v4 as uuid } from 'uuid';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { CONTENT } from '../../contracts/shared/constants.js';
import type { LessonContent, ContentBlock, TextBlock, QuizBlock, ArtifactPromptBlock } from '../../contracts/schemas/content.js';
import type { QuizAnswer } from '../../contracts/api/progress.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import {
  sendTextMessage,
  sendInteractiveButtons,
  type WhatsAppButton,
} from './client.js';
import {
  getConversationState,
  setConversationState,
  clearConversationState,
  setButtonMappings,
  getButtonMapping,
  hasWhatsAppConsent,
  type ConversationState,
  type ButtonMapping,
} from './conversationState.js';

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_TEXT_MESSAGES_PER_LESSON = 3;
const MAX_WORDS_PER_MESSAGE = CONTENT.WORD_COUNT_MAX_PER_BLOCK; // 300
const MAX_QUIZ_BUTTONS = 3;
const INTER_MESSAGE_DELAY_MS = 1500; // Delay between messages for readability

// ── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitTextIntoChunks(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= maxWords) {
      chunks.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
}

async function getUserPhone(userId: string): Promise<string | null> {
  const result = await query(
    `SELECT phone FROM ${TABLES.USERS} WHERE id = $1`,
    [userId],
  );
  return (result.rows[0] as { phone: string } | undefined)?.phone ?? null;
}

async function getLessonContent(lessonId: string): Promise<LessonContent | null> {
  // Load lesson metadata
  const lessonResult = await query(
    `SELECT l.id, l.title, l.module_id, l.sort_order, l.duration_minutes,
            m.course_id
     FROM ${TABLES.LESSONS} l
     JOIN ${TABLES.MODULES} m ON m.id = l.module_id
     WHERE l.id = $1`,
    [lessonId],
  );

  if (lessonResult.rows.length === 0) return null;

  const row = lessonResult.rows[0] as {
    id: string;
    title: string;
    module_id: string;
    course_id: string;
    sort_order: number;
    duration_minutes: number;
  };

  // Load content blocks (stored as JSONB)
  const contentResult = await query(
    `SELECT content_blocks FROM lesson_content WHERE lesson_id = $1`,
    [lessonId],
  );

  const blocks: ContentBlock[] =
    contentResult.rows.length > 0
      ? (contentResult.rows[0] as { content_blocks: ContentBlock[] }).content_blocks
      : [];

  return {
    id: row.id,
    title: row.title,
    module_id: row.module_id,
    course_id: row.course_id,
    sort_order: row.sort_order,
    estimated_duration_minutes: row.duration_minutes,
    blocks,
    next_lesson_id: null,
    prev_lesson_id: null,
  };
}

// ── Main Delivery ───────────────────────────────────────────────────────────

export async function deliverLesson(userId: string, lessonId: string): Promise<void> {
  // Check WhatsApp consent
  const consented = await hasWhatsAppConsent(userId);
  if (!consented) {
    console.warn(`User ${userId} has not consented to WhatsApp messages. Skipping delivery.`);
    return;
  }

  const phone = await getUserPhone(userId);
  if (!phone) {
    console.error(`No phone number found for user ${userId}`);
    return;
  }

  const lesson = await getLessonContent(lessonId);
  if (!lesson) {
    console.error(`Lesson ${lessonId} not found`);
    return;
  }

  // Separate content by type
  const textBlocks = lesson.blocks.filter((b): b is TextBlock => b.type === 'text_block');
  const quizBlocks = lesson.blocks.filter((b): b is QuizBlock => b.type === 'quiz_block');
  const artifactBlocks = lesson.blocks.filter(
    (b): b is ArtifactPromptBlock => b.type === 'artifact_prompt_block',
  );

  // Build text content: combine all text blocks, then chunk
  const fullText = textBlocks.map((b) => b.content).join('\n\n');
  const textChunks = splitTextIntoChunks(fullText, MAX_WORDS_PER_MESSAGE);
  const messageParts = textChunks.slice(0, MAX_TEXT_MESSAGES_PER_LESSON);

  const totalParts = messageParts.length + quizBlocks.length + (artifactBlocks.length > 0 ? 1 : 0);

  // Initialize conversation state
  const state: ConversationState = {
    user_id: userId,
    lesson_id: lessonId,
    course_id: lesson.course_id,
    phase: 'delivering_content',
    current_content_index: 0,
    total_content_parts: totalParts,
    current_quiz_index: 0,
    total_quiz_count: quizBlocks.length,
    pending_quiz_block_id: null,
    quiz_results: [],
    started_at: new Date().toISOString(),
  };

  await setConversationState(userId, state);

  // 1. Send problem statement / lesson title
  await sendTextMessage(
    phone,
    `*${lesson.title}*\n\nLet's begin your micro-lesson. Read through the content below.`,
    userId,
  );
  await delay(INTER_MESSAGE_DELAY_MS);

  // 2. Send text content in chunks (max 3 messages)
  for (let i = 0; i < messageParts.length; i++) {
    const partLabel = messageParts.length > 1 ? ` (${i + 1}/${messageParts.length})` : '';
    await sendTextMessage(phone, `${messageParts[i]}${partLabel}`, userId);
    state.current_content_index = i + 1;
    await setConversationState(userId, state);
    await delay(INTER_MESSAGE_DELAY_MS);
  }

  // 3. Send quiz questions via interactive buttons (1 question per message)
  if (quizBlocks.length > 0) {
    state.phase = 'quiz_pending';
    await sendQuizQuestion(phone, userId, quizBlocks[0], 0, quizBlocks.length, state);
  } else if (artifactBlocks.length > 0) {
    // No quiz, skip to artifact
    state.phase = 'artifact_prompt';
    await setConversationState(userId, state);
    await sendArtifactPrompt(phone, userId, artifactBlocks[0]);
    await finishLesson(userId, state);
  } else {
    // No quiz or artifact
    await finishLesson(userId, state);
  }
}

// ── Quiz Delivery ───────────────────────────────────────────────────────────

async function sendQuizQuestion(
  phone: string,
  userId: string,
  quiz: QuizBlock,
  questionIndex: number,
  totalQuestions: number,
  state: ConversationState,
): Promise<void> {
  // Build buttons (max 3 per WhatsApp rule)
  const optionsToShow = quiz.options.slice(0, MAX_QUIZ_BUTTONS);
  const buttons: WhatsAppButton[] = optionsToShow.map((opt, i) => ({
    id: `quiz_${quiz.id}_opt_${i}`,
    title: opt.slice(0, 20), // WhatsApp button title max 20 chars
  }));

  // Store button mappings in Redis
  const mappings: Record<string, ButtonMapping> = {};
  for (let i = 0; i < optionsToShow.length; i++) {
    const buttonId = `quiz_${quiz.id}_opt_${i}`;
    mappings[buttonId] = {
      quiz_block_id: quiz.id,
      option_index: i,
      option_text: quiz.options[i],
      is_correct: i === quiz.correct_answer,
    };
  }
  await setButtonMappings(userId, mappings);

  // Update state
  state.current_quiz_index = questionIndex;
  state.pending_quiz_block_id = quiz.id;
  state.phase = 'quiz_pending';
  await setConversationState(userId, state);

  const questionLabel =
    totalQuestions > 1 ? `Question ${questionIndex + 1}/${totalQuestions}\n\n` : '';

  await sendInteractiveButtons(
    phone,
    `${questionLabel}${quiz.question}`,
    buttons,
    userId,
  );
}

async function sendArtifactPrompt(
  phone: string,
  userId: string,
  artifact: ArtifactPromptBlock,
): Promise<void> {
  const message = [
    '*Application Exercise*',
    '',
    artifact.prompt,
    '',
    `Target role: ${artifact.target_role}`,
    `Industry: ${artifact.industry_vertical}`,
    '',
    'Take a moment to work through this exercise. You can share your answer in the SABIficate app.',
  ].join('\n');

  await sendTextMessage(phone, message, userId);
}

// ── Quiz Reply Processing ───────────────────────────────────────────────────

export async function processQuizReply(
  userId: string,
  _messageId: string,
  buttonPayload: string,
): Promise<void> {
  const state = await getConversationState(userId);
  if (!state || state.phase !== 'quiz_pending') {
    console.warn(`No pending quiz for user ${userId}, ignoring button reply`);
    return;
  }

  const phone = await getUserPhone(userId);
  if (!phone) return;

  // Look up button mapping
  const mapping = await getButtonMapping(userId, buttonPayload);
  if (!mapping) {
    console.warn(`Unknown button payload ${buttonPayload} for user ${userId}`);
    await sendTextMessage(phone, 'Sorry, that response was not recognized. Please try again.', userId);
    return;
  }

  // Record the answer
  const quizResult = {
    quiz_block_id: mapping.quiz_block_id,
    selected_option: mapping.option_index,
    is_correct: mapping.is_correct,
    answered_at: new Date().toISOString(),
  };
  state.quiz_results.push(quizResult);

  // Record in database
  await recordQuizAnswer(userId, state.lesson_id, quizResult);

  // Send feedback
  state.phase = 'quiz_feedback';
  await setConversationState(userId, state);

  if (mapping.is_correct) {
    await sendTextMessage(phone, 'Correct! Well done.', userId);
  } else {
    // Load quiz block to get explanation
    const explanation = await getQuizExplanation(state.lesson_id, mapping.quiz_block_id);
    const feedback = explanation
      ? `Not quite. ${explanation}`
      : 'Not quite. Review the lesson content and try again next time.';
    await sendTextMessage(phone, feedback, userId);
  }

  await delay(INTER_MESSAGE_DELAY_MS);

  // Check if there are more quiz questions
  const lesson = await getLessonContent(state.lesson_id);
  if (!lesson) return;

  const quizBlocks = lesson.blocks.filter((b): b is QuizBlock => b.type === 'quiz_block');
  const nextQuizIndex = state.current_quiz_index + 1;

  if (nextQuizIndex < quizBlocks.length) {
    // Send next quiz question
    await sendQuizQuestion(phone, userId, quizBlocks[nextQuizIndex], nextQuizIndex, quizBlocks.length, state);
  } else {
    // All quiz questions done, check for artifact prompt
    const artifactBlocks = lesson.blocks.filter(
      (b): b is ArtifactPromptBlock => b.type === 'artifact_prompt_block',
    );

    if (artifactBlocks.length > 0) {
      state.phase = 'artifact_prompt';
      await setConversationState(userId, state);
      await sendArtifactPrompt(phone, userId, artifactBlocks[0]);
    }

    await finishLesson(userId, state);
  }
}

// ── Lesson Completion ───────────────────────────────────────────────────────

async function finishLesson(userId: string, state: ConversationState): Promise<void> {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  // Send completion summary
  const totalQuestions = state.quiz_results.length;
  const correctAnswers = state.quiz_results.filter((r) => r.is_correct).length;

  if (totalQuestions > 0) {
    await delay(INTER_MESSAGE_DELAY_MS);
    await sendTextMessage(
      phone,
      `Lesson complete! You scored ${correctAnswers}/${totalQuestions} on the quiz. Keep learning!`,
      userId,
    );
  } else {
    await delay(INTER_MESSAGE_DELAY_MS);
    await sendTextMessage(phone, 'Lesson complete! Keep up the great work.', userId);
  }

  // Sync quiz answers to progress system
  if (state.quiz_results.length > 0) {
    const quizAnswers: QuizAnswer[] = state.quiz_results.map((r) => ({
      quiz_block_id: r.quiz_block_id,
      selected_option: r.selected_option,
      is_correct: r.is_correct,
      answered_at: r.answered_at,
    }));

    await queues[QUEUE_NAMES.WHATSAPP_QUIZ_COMPLETED].add('quiz-sync', {
      user_id: userId,
      lesson_id: state.lesson_id,
      course_id: state.course_id,
      quiz_answers: quizAnswers,
      completed_at: new Date().toISOString(),
    });
  }

  // Clear conversation state
  await clearConversationState(userId);
}

// ── DB Helpers ──────────────────────────────────────────────────────────────

async function recordQuizAnswer(
  userId: string,
  lessonId: string,
  result: { quiz_block_id: string; selected_option: number; is_correct: boolean; answered_at: string },
): Promise<void> {
  await query(
    `INSERT INTO ${TABLES.ASSESSMENT_ATTEMPTS}
       (id, user_id, lesson_id, quiz_block_id, selected_option, is_correct, attempted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuid(),
      userId,
      lessonId,
      result.quiz_block_id,
      result.selected_option,
      result.is_correct,
      result.answered_at,
    ],
  );
}

async function getQuizExplanation(
  lessonId: string,
  quizBlockId: string,
): Promise<string | null> {
  const contentResult = await query(
    `SELECT content_blocks FROM lesson_content WHERE lesson_id = $1`,
    [lessonId],
  );

  if (contentResult.rows.length === 0) return null;

  const blocks = (contentResult.rows[0] as { content_blocks: ContentBlock[] }).content_blocks;
  const quizBlock = blocks.find(
    (b): b is QuizBlock => b.type === 'quiz_block' && b.id === quizBlockId,
  );

  return quizBlock?.explanation ?? null;
}
