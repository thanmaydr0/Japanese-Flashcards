import { KANA_CARDS, Script, WordCard, WORD_CARDS, KanaCard } from '../data/kana';

export type StudyMode = 'read' | 'write';
export type StudyCard = KanaCard | WordCard;

export type ItemMastery = {
  seen: number;
  correct: number;
  streak: number;
  dueAt: number;
  lastSeenAt: number;
};

export type AnswerLog = {
  at: number;
  correct: boolean;
  mode: StudyMode;
  script: Script;
  cardId: string;
};

export type LearningState = {
  setupCompleted: boolean;
  dailyMinutes: number;
  preferredScript: Script;
  startedAt: number | null;
  updatedAt: number;
  lastStudyDay: string | null;
  streak: number;
  sessionCount: number;
  totalCorrect: number;
  totalAnswers: number;
  mastery: Record<string, ItemMastery>;
  answerLog: AnswerLog[];
};

export const INITIAL_STATE: LearningState = {
  setupCompleted: false,
  dailyMinutes: 20,
  preferredScript: 'hiragana',
  startedAt: null,
  updatedAt: 0,
  lastStudyDay: null,
  streak: 0,
  sessionCount: 0,
  totalCorrect: 0,
  totalAnswers: 0,
  mastery: {},
  answerLog: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTES_FOR_FULL_PATH = 1000;

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  script: Script | 'mixed';
  groups: string[];
  content: 'kana' | 'words' | 'mixed';
  accent: string;
  duration: number;
};

export const LEARNING_PATH: Lesson[] = [
  { id: 'hira-first', title: 'Meet the sounds', subtitle: 'Vowels, K, S & T rows', script: 'hiragana', groups: ['vowels', 'k', 's', 't'], content: 'kana', accent: '#E88470', duration: 10 },
  { id: 'hira-grid', title: 'Fill the hiragana grid', subtitle: 'The rest of the basic sounds', script: 'hiragana', groups: ['n', 'h', 'm', 'y', 'r', 'w', 'n-final'], content: 'kana', accent: '#E8B25E', duration: 12 },
  { id: 'hira-blends', title: 'Add the small sounds', subtitle: 'Dakuten marks & blended kana', script: 'hiragana', groups: ['dakuten', 'yoon'], content: 'kana', accent: '#70A89E', duration: 12 },
  { id: 'hira-reading', title: 'Read your first phrases', subtitle: 'Everyday words, then longer lines', script: 'hiragana', groups: [], content: 'words', accent: '#9B8FC6', duration: 10 },
  { id: 'kata-grid', title: 'Meet katakana', subtitle: 'Recognize and write each sound', script: 'katakana', groups: ['vowels', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'n-final'], content: 'kana', accent: '#E88470', duration: 14 },
  { id: 'kata-blends', title: 'Tackle the sound blends', subtitle: 'Voiced marks, yōon & long vowels', script: 'katakana', groups: ['dakuten', 'yoon'], content: 'kana', accent: '#70A89E', duration: 12 },
  { id: 'kata-reading', title: 'Read real loanwords', subtitle: 'From coffee to longer challenges', script: 'katakana', groups: [], content: 'words', accent: '#9B8FC6', duration: 12 },
  { id: 'mixed-fluency', title: 'Build reading fluency', subtitle: 'Mix both scripts at a natural pace', script: 'mixed', groups: [], content: 'mixed', accent: '#31545B', duration: 15 },
];

export function masteryKey(cardId: string, mode: StudyMode) {
  return `${mode}:${cardId}`;
}

export function getMastery(state: LearningState, cardId: string, mode: StudyMode) {
  return state.mastery[masteryKey(cardId, mode)];
}

function localDay(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousDay(day: string) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return localDay(date.getTime());
}

export function recordAnswer(
  current: LearningState,
  card: StudyCard,
  mode: StudyMode,
  correct: boolean,
  at = Date.now(),
): LearningState {
  const key = masteryKey(card.id, mode);
  const existing = current.mastery[key] ?? { seen: 0, correct: 0, streak: 0, dueAt: 0, lastSeenAt: 0 };
  const nextStreak = correct ? existing.streak + 1 : 0;
  const interval = correct
    ? [1, 10 * 60 * 1000, DAY_MS, 3 * DAY_MS, 7 * DAY_MS, 14 * DAY_MS][Math.min(nextStreak, 5)]
    : 8 * 60 * 1000;
  const today = localDay(at);
  const newStudyDay = today !== current.lastStudyDay;
  const streak = newStudyDay
    ? (current.lastStudyDay === previousDay(today) ? current.streak + 1 : 1)
    : current.streak;
  const item: ItemMastery = {
    seen: existing.seen + 1,
    correct: existing.correct + (correct ? 1 : 0),
    streak: nextStreak,
    dueAt: at + interval,
    lastSeenAt: at,
  };
  const log = [...current.answerLog, { at, correct, mode, script: card.script, cardId: card.id }].slice(-80);
  return {
    ...current,
    lastStudyDay: today,
    streak,
    sessionCount: current.sessionCount + (newStudyDay ? 1 : 0),
    totalAnswers: current.totalAnswers + 1,
    totalCorrect: current.totalCorrect + (correct ? 1 : 0),
    mastery: { ...current.mastery, [key]: item },
    answerLog: log,
  };
}

export function masteryCounts(state: LearningState) {
  const total = (KANA_CARDS.length + WORD_CARDS.length) * 2;
  const mastered = Object.values(state.mastery).filter((item) => item.streak >= 3).length;
  return { mastered: Math.min(mastered, total), total, percent: total ? Math.min(100, (mastered / total) * 100) : 0 };
}

export function accuracyPercent(state: LearningState) {
  if (!state.totalAnswers) return 0;
  return Math.round((state.totalCorrect / state.totalAnswers) * 100);
}

export function getPlanEstimate(state: LearningState, now = Date.now()) {
  const { mastered, total } = masteryCounts(state);
  const remaining = Math.max(0, total - mastered);
  const currentAccuracy = state.answerLog.length
    ? state.answerLog.slice(-30).filter((entry) => entry.correct).length / Math.min(30, state.answerLog.length)
    : 0.78;
  const retentionFactor = Math.max(0.82, Math.min(1.38, 1.16 - ((currentAccuracy - 0.68) * 0.52)));
  const goalDays = (MINUTES_FOR_FULL_PATH * (remaining / total) * retentionFactor) / Math.max(state.dailyMinutes, 5);
  const elapsedDays = state.startedAt ? Math.max(1, Math.ceil((now - state.startedAt) / DAY_MS)) : 1;
  const observedRate = mastered / elapsedDays;
  const actualDays = observedRate > 0 && mastered >= 12 && elapsedDays >= 3 ? remaining / observedRate : goalDays;
  const blendedDays = mastered >= 12 && elapsedDays >= 3 ? (goalDays * 0.65) + (actualDays * 0.35) : goalDays;
  return Math.max(1, Math.ceil(blendedDays));
}

export function formatDays(days: number) {
  if (days <= 1) return '1 day';
  if (days < 7) return `${days} days`;
  const weeks = Math.ceil(days / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
}

export function lessonProgress(lesson: Lesson, state: LearningState) {
  let items: StudyCard[] = [];
  if (lesson.content === 'kana') {
    items = KANA_CARDS.filter((card) => card.script === lesson.script && lesson.groups.includes(card.group));
  } else if (lesson.content === 'words') {
    items = WORD_CARDS.filter((word) => word.script === lesson.script);
  } else {
    items = [...KANA_CARDS.filter((card) => card.kind !== 'basic'), ...WORD_CARDS.filter((word) => word.level === 'stretch')];
  }
  const skills = items.flatMap((item) => [getMastery(state, item.id, 'read'), getMastery(state, item.id, 'write')]);
  const mastered = skills.filter((item) => item && item.streak >= 3).length;
  const total = Math.max(1, skills.length);
  return { mastered, total, percent: mastered / total, itemCount: items.length };
}

export function currentLessonIndex(state: LearningState) {
  const index = LEARNING_PATH.findIndex((lesson) => lessonProgress(lesson, state).percent < 0.72);
  return index === -1 ? LEARNING_PATH.length - 1 : index;
}

export function isLessonUnlocked(index: number, state: LearningState) {
  if (index === 0) return true;
  return lessonProgress(LEARNING_PATH[index - 1], state).percent >= 0.58;
}

export function getNextCard(
  script: Script | 'mixed',
  mode: StudyMode,
  content: 'kana' | 'words' | 'mixed',
  state: LearningState,
  allowedGroups: string[] = [],
): StudyCard {
  const matchesScript = (card: StudyCard) => script === 'mixed' || card.script === script;
  const kanaCards = content === 'words'
    ? []
    : KANA_CARDS.filter((card) => matchesScript(card) && (!allowedGroups.length || allowedGroups.includes(card.group)));
  const wordCards = content === 'kana'
    ? []
    : WORD_CARDS.filter(matchesScript);
  const cards: StudyCard[] = [...kanaCards, ...wordCards];
  const due = cards
    .filter((card) => {
      const mastery = getMastery(state, card.id, mode);
      return mastery && mastery.dueAt <= Date.now();
    })
    .sort((a, b) => (getMastery(state, a.id, mode)?.dueAt ?? 0) - (getMastery(state, b.id, mode)?.dueAt ?? 0));
  if (due.length) return due[0];
  const unseen = cards.filter((card) => !getMastery(state, card.id, mode));
  if (unseen.length) {
    if (script === 'mixed' && content === 'mixed') {
      const previous = state.answerLog[state.answerLog.length - 1];
      const preferredScript = previous
        ? previous.script === 'hiragana' ? 'katakana' : 'hiragana'
        : state.preferredScript;
      const previousWasWord = previous?.cardId.startsWith('word-') ?? false;
      const preferredKindIsWord = previous ? !previousWasWord : false;
      const preferredCard = unseen.find((card) =>
        card.script === preferredScript && isWordCard(card) === preferredKindIsWord,
      );
      return preferredCard ?? unseen.find((card) => card.script === preferredScript) ?? unseen[0];
    }
    if (script === 'mixed') {
      const previous = state.answerLog[state.answerLog.length - 1];
      const preferredScript = previous
        ? previous.script === 'hiragana' ? 'katakana' : 'hiragana'
        : state.preferredScript;
      return unseen.find((card) => card.script === preferredScript) ?? unseen[0];
    }
    return unseen[0];
  }
  return [...cards].sort((a, b) => {
    const aMastery = getMastery(state, a.id, mode)!;
    const bMastery = getMastery(state, b.id, mode)!;
    const aAccuracy = aMastery.correct / Math.max(aMastery.seen, 1);
    const bAccuracy = bMastery.correct / Math.max(bMastery.seen, 1);
    return aAccuracy - bAccuracy || aMastery.streak - bMastery.streak;
  })[0];
}

export function suggestedFocus(state: LearningState) {
  const recent = state.answerLog.slice(-16);
  if (!recent.length) return 'Start with five vowel sounds';
  const scriptMisses = recent.reduce<Record<Script, number>>((counts, entry) => {
    counts[entry.script] += entry.correct ? 0 : 1;
    return counts;
  }, { hiragana: 0, katakana: 0 });
  const script: Script = scriptMisses.hiragana >= scriptMisses.katakana ? 'hiragana' : 'katakana';
  const scriptLabel = script === 'hiragana' ? 'Hiragana' : 'Katakana';
  const misses = scriptMisses[script];
  if (misses >= 3) return `Take a calm ${scriptLabel} review to lock in tricky sounds`;
  const { mastered } = masteryCounts(state);
  if (mastered < 12) return `Build confidence with the ${scriptLabel} sound rows`;
  return `Mix ${scriptLabel} reading with a short writing round`;
}

export function countDue(state: LearningState) {
  const now = Date.now();
  return Object.values(state.mastery).filter((item) => item.streak > 0 && item.dueAt <= now).length;
}

export function cardCharacter(card: StudyCard) {
  return 'character' in card ? card.character : card.text;
}

export function isWordCard(card: StudyCard): card is WordCard {
  return 'text' in card;
}
