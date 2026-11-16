import { ItemMastery, StudyMode, LearningState } from './learning';
import { Script } from '../data/kana';
import { supabase, supabaseConfigured } from './supabase';

export async function ensureCloudUser() {
  if (!supabase) return null;
  const current = await supabase.auth.getSession();
  if (current.data.session?.user) return current.data.session.user;
  const created = await supabase.auth.signInAnonymously();
  if (created.error) throw created.error;
  return created.data.user;
}

export async function syncLearningState(state: LearningState) {
  if (!supabase) return;
  const user = await ensureCloudUser();
  if (!user) return;

  const { error: settingsError } = await supabase.from('learner_settings').upsert({
    user_id: user.id,
    daily_goal_minutes: state.dailyMinutes,
    preferred_script: state.preferredScript,
    onboarding_completed: state.setupCompleted,
    streak_days: state.streak,
    updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
  });
  if (settingsError) throw settingsError;

  const rows = Object.entries(state.mastery).map(([key, item]) => {
    const separator = key.indexOf(':');
    const mode = key.slice(0, separator) as StudyMode;
    const itemId = key.slice(separator + 1);
    const script = itemId.startsWith('h-') || itemId.startsWith('word-h-') ? 'hiragana' : 'katakana';
    return {
      user_id: user.id,
      item_id: itemId,
      script,
      mode,
      seen_count: item.seen,
      correct_count: item.correct,
      correct_streak: item.streak,
      due_at: new Date(item.dueAt).toISOString(),
      last_seen_at: new Date(item.lastSeenAt).toISOString(),
      updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
    };
  });

  if (rows.length) {
    const { error } = await supabase.from('kana_mastery').upsert(rows, { onConflict: 'user_id,item_id,mode' });
    if (error) throw error;
  }
}

export type CloudLearningSnapshot = {
  dailyMinutes: number;
  preferredScript: Script;
  setupCompleted: boolean;
  startedAt: number | null;
  updatedAt: number;
  lastStudyDay: string | null;
  streak: number;
  mastery: Record<string, ItemMastery>;
  totalAnswers: number;
  totalCorrect: number;
};

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function loadCloudLearningSnapshot(): Promise<CloudLearningSnapshot | null> {
  if (!supabase) return null;
  try {
    const current = await supabase.auth.getSession();
    const user = current.data.session?.user;
    if (!user) return null;

    const [settingsResult, masteryResult] = await Promise.all([
      supabase.from('learner_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('kana_mastery').select('item_id,mode,seen_count,correct_count,correct_streak,due_at,last_seen_at').eq('user_id', user.id),
    ]);
    if (settingsResult.error || masteryResult.error || !settingsResult.data) return null;

    const mastery: Record<string, ItemMastery> = {};
    let latestSeenAt = 0;
    let totalAnswers = 0;
    let totalCorrect = 0;
    for (const row of masteryResult.data) {
      const lastSeenAt = Date.parse(row.last_seen_at);
      const item: ItemMastery = {
        seen: row.seen_count,
        correct: row.correct_count,
        streak: row.correct_streak,
        dueAt: Date.parse(row.due_at),
        lastSeenAt,
      };
      mastery[`${row.mode}:${row.item_id}`] = item;
      totalAnswers += item.seen;
      totalCorrect += item.correct;
      latestSeenAt = Math.max(latestSeenAt, lastSeenAt);
    }

    const startedAt = Date.parse(settingsResult.data.created_at);
    const updatedAt = Date.parse(settingsResult.data.updated_at);
    return {
      dailyMinutes: settingsResult.data.daily_goal_minutes,
      preferredScript: settingsResult.data.preferred_script,
      setupCompleted: settingsResult.data.onboarding_completed,
      startedAt: Number.isFinite(startedAt) ? startedAt : null,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
      lastStudyDay: latestSeenAt ? dayKey(latestSeenAt) : null,
      streak: settingsResult.data.streak_days,
      mastery,
      totalAnswers,
      totalCorrect,
    };
  } catch {
    return null;
  }
}

export function mergeCloudLearningState(local: LearningState, cloud: CloudLearningSnapshot): LearningState {
  const mergedMastery = { ...local.mastery };
  for (const [key, remote] of Object.entries(cloud.mastery)) {
    const current = mergedMastery[key];
    if (!current || remote.lastSeenAt > current.lastSeenAt || (remote.lastSeenAt === current.lastSeenAt && remote.seen > current.seen)) {
      mergedMastery[key] = remote;
    }
  }
  const remoteIsNewer = cloud.updatedAt > local.updatedAt;
  const seenTotal = Object.values(mergedMastery).reduce((total, item) => total + item.seen, 0);
  const correctTotal = Object.values(mergedMastery).reduce((total, item) => total + item.correct, 0);
  return {
    ...local,
    setupCompleted: local.setupCompleted || cloud.setupCompleted,
    dailyMinutes: remoteIsNewer ? cloud.dailyMinutes : local.dailyMinutes,
    preferredScript: remoteIsNewer ? cloud.preferredScript : local.preferredScript,
    startedAt: local.startedAt ?? cloud.startedAt,
    updatedAt: Math.max(local.updatedAt, cloud.updatedAt),
    lastStudyDay: remoteIsNewer ? cloud.lastStudyDay : local.lastStudyDay,
    streak: remoteIsNewer ? cloud.streak : local.streak,
    mastery: mergedMastery,
    totalAnswers: Math.max(local.totalAnswers, cloud.totalAnswers, seenTotal),
    totalCorrect: Math.max(local.totalCorrect, cloud.totalCorrect, correctTotal),
  };
}

export async function askForStudyNudge(state: LearningState) {
  if (!supabaseConfigured || !supabase) return null;
  try {
    await ensureCloudUser();
    const recent = state.answerLog.slice(-20);
    const correct = recent.filter((entry) => entry.correct).length;
    const weakScript = recent.filter((entry) => !entry.correct).reduce<Record<string, number>>((counts, entry) => {
      counts[entry.script] = (counts[entry.script] ?? 0) + 1;
      return counts;
    }, {});
    const focus = (weakScript.katakana ?? 0) > (weakScript.hiragana ?? 0) ? 'katakana' : 'hiragana';
    const { data, error } = await supabase.functions.invoke('practice-coach', {
      body: {
        dailyMinutes: state.dailyMinutes,
        accuracy: recent.length ? Math.round((correct / recent.length) * 100) : 0,
        focus,
        totalAnswers: state.totalAnswers,
        streak: state.streak,
        recentMisses: recent
          .filter((entry) => !entry.correct)
          .slice(-8)
          .map(({ cardId, script, mode }) => ({ cardId, script, mode })),
      },
    });
    if (error) return null;
    return typeof data?.nudge === 'string' ? data.nudge : null;
  } catch {
    return null;
  }
}
