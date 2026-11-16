import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.119.0/cors';

type LearnerSnapshot = {
  focusModeEnabled?: boolean;
  dailyMinutes: number;
  accuracy: number;
  focus: 'hiragana' | 'katakana';
  totalAnswers: number;
  streak: number;
  recentMisses: Array<{
    cardId: string;
    script: 'hiragana' | 'katakana';
    mode: 'read' | 'write';
  }>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function publishableKeyFrom(request: Request) {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // Older Supabase projects expose a single anon key instead.
    }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? request.headers.get('apikey') ?? '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  const accessToken = authorization?.replace(/^Bearer\s+/i, '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = publishableKeyFrom(request);
  if (!accessToken || !supabaseUrl || !publishableKey) return json({ error: 'unauthorized' }, 401);

  const identityClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } = await identityClient.auth.getUser(accessToken);
  if (identityError || !identity.user) return json({ error: 'unauthorized' }, 401);

  let body: Partial<LearnerSnapshot>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  const focus = body.focus === 'katakana' ? 'katakana' : body.focus === 'hiragana' ? 'hiragana' : null;
  const focusModeEnabled = body.focusModeEnabled === true;
  const accuracy = Number(body.accuracy);
  const dailyMinutes = Number(body.dailyMinutes);
  const totalAnswers = Number(body.totalAnswers);
  const streak = Number(body.streak);
  const recentMisses = Array.isArray(body.recentMisses)
    ? body.recentMisses.filter((entry) =>
      entry && typeof entry.cardId === 'string' && entry.cardId.length > 0 && entry.cardId.length <= 120 &&
      (entry.script === 'hiragana' || entry.script === 'katakana') &&
      (entry.mode === 'read' || entry.mode === 'write'),
    ).slice(-8)
    : [];
  if (
    !focus || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100 ||
    !Number.isFinite(dailyMinutes) || dailyMinutes < 5 || dailyMinutes > 180 ||
    !Number.isFinite(totalAnswers) || totalAnswers < 0 ||
    !Number.isFinite(streak) || streak < 0
  ) return json({ error: 'invalid_request' }, 400);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ nudge: null });

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/interactions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        system_instruction: focusModeEnabled
          ? 'You are a kind Japanese kana tutor for a complete beginner using a focus-friendly setting. Suggest exactly one concrete next action that can be started now, preferably one five-card round, in plain English and under 18 words. Keep the tone calm and non-judgmental. Never use streaks, urgency, guilt, or pressure. Fit it to the learner’s available time and recent progress. When recent misses exist, prioritize the most repeated script and reading or writing mode; otherwise recommend a small next step. Use only supplied facts. Never mention AI, models, APIs, learner profiling, or ADHD. Do not promise perfection or invent feelings. Return one sentence only.'
          : 'You are a kind Japanese kana tutor for a complete beginner. Write one short, practical next-study action in plain English, under 18 words. Fit it to the learner’s available time and recent progress. When recent misses exist, prioritize the most repeated script and reading or writing mode; otherwise recommend a small next step. Use only supplied facts. Never mention AI, models, APIs, or learner profiling. Do not promise perfection or invent feelings. Return one sentence only.',
        input: JSON.stringify({
          focus_mode_enabled: focusModeEnabled,
          daily_minutes: Math.round(dailyMinutes),
          recent_accuracy_percent: Math.round(accuracy),
          focus_script: focus,
          total_practice_prompts: Math.round(totalAnswers),
          current_streak_days: Math.round(streak),
          recent_misses: recentMisses,
        }),
        generation_config: {
          max_output_tokens: 60,
          thinking_level: 'minimal',
        },
      }),
    });

    if (!response.ok) return json({ nudge: null });
    const result = await response.json();
    const text = Array.isArray(result.steps)
      ? result.steps.filter((step: { type?: string }) => step.type === 'model_output')
        .flatMap((step: { content?: Array<{ type?: string; text?: string }> }) => step.content ?? [])
        .filter((item: { type?: string }) => item.type === 'text')
        .map((item: { text?: string }) => item.text ?? '')
        .join(' ')
        .replace(/[\r\n]+/g, ' ')
        .trim()
      : '';
    return json({ nudge: text ? text.slice(0, 180) : null });
  } catch {
    return json({ nudge: null });
  } finally {
    clearTimeout(timeout);
  }
});
