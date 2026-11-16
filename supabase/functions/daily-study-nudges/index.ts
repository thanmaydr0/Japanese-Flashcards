import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

type PushDevice = {
  id: string;
  user_id: string;
  token: string;
  timezone: string;
  reminder_hour: number;
  reminder_minute: number;
  last_nudge_at: string | null;
};

type LearnerSettings = { user_id: string; streak_days: number; updated_at: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlJson(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function localParts(date: Date, timezone: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
  }
  const value = (name: string) => parts.find((part) => part.type === name)?.value ?? '00';
  return {
    day: `${value('year')}-${value('month')}-${value('day')}`,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

let cachedOAuthToken: { value: string; expiresAt: number } | null = null;

async function firebaseAccessToken() {
  if (cachedOAuthToken && cachedOAuthToken.expiresAt > Date.now() + 60_000) return cachedOAuthToken.value;
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('Firebase sender credentials are missing.');

  const encodedKey = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(encodedKey), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const assertion = `${base64UrlJson({ alg: 'RS256', typ: 'JWT' })}.${base64UrlJson({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(assertion));
  const signedAssertion = `${assertion}.${bytesToBase64Url(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedAssertion,
    }),
  });
  if (!response.ok) throw new Error(`Firebase OAuth token request failed (${response.status}).`);
  const tokenResponse = await response.json() as { access_token: string; expires_in: number };
  cachedOAuthToken = { value: tokenResponse.access_token, expiresAt: Date.now() + tokenResponse.expires_in * 1000 };
  return tokenResponse.access_token;
}

async function sendFirebaseMessage(device: PushDevice, token: string, projectId: string, streak: number) {
  const copy = streak >= 7
    ? {
        title: 'Your fox is doing a victory dance 🦊',
        body: `Keep that ${streak}-day streak glowing with a tiny kana session.`,
      }
    : streak > 0
      ? {
          title: 'Psst, your kana are waiting 🦊',
          body: `One little lesson keeps your ${streak}-day streak going.`,
        }
      : {
          title: 'A tiny Japanese lesson?',
          body: 'Your fox found a few fresh flashcards. Come say こんにちは!',
        };
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: device.token,
        notification: copy,
        android: { priority: 'HIGH', notification: { channel_id: 'study-reminders' } },
      },
    }),
  });
  if (!response.ok) throw new Error(`Firebase message failed (${response.status}).`);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const cronSecret = Deno.env.get('PUSH_CRON_SECRET');
  if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  if (!supabaseUrl || !serviceRoleKey || !projectId) return json({ error: 'sender_not_configured' }, 503);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();
  const sent: string[] = [];
  let failed = 0;
  try {
    const oauthToken = await firebaseAccessToken();
    for (let offset = 0; ; offset += 500) {
      const { data: devices, error } = await admin
        .from('push_devices')
        .select('id,user_id,token,timezone,reminder_hour,reminder_minute,last_nudge_at')
        .eq('enabled', true)
        .range(offset, offset + 499);
      if (error) throw error;
      if (!devices?.length) break;

      const userIds = [...new Set(devices.map((device) => device.user_id))];
      const { data: settings, error: settingsError } = await admin
        .from('learner_settings')
        .select('user_id,streak_days,updated_at')
        .in('user_id', userIds);
      if (settingsError) throw settingsError;
      const byUser = new Map((settings ?? []).map((row) => [row.user_id, row as LearnerSettings]));
      const due = (devices as PushDevice[]).filter((device) => {
        const localNow = localParts(now, device.timezone);
        if (localNow.minutes < device.reminder_hour * 60 + device.reminder_minute) return false;
        if (device.last_nudge_at && localParts(new Date(device.last_nudge_at), device.timezone).day === localNow.day) return false;
        const latest = byUser.get(device.user_id);
        if (latest && localParts(new Date(latest.updated_at), device.timezone).day === localNow.day) return false;
        return true;
      });

      for (let index = 0; index < due.length; index += 40) {
        const batch = due.slice(index, index + 40);
        await Promise.all(batch.map(async (device) => {
          try {
            await sendFirebaseMessage(device, oauthToken, projectId, byUser.get(device.user_id)?.streak_days ?? 0);
            await admin.from('push_devices').update({ last_nudge_at: now.toISOString() }).eq('id', device.id);
            sent.push(device.id);
          } catch (error) {
            failed += 1;
            if (error instanceof Error && error.message.includes('(404)')) {
              await admin.from('push_devices').update({ enabled: false, updated_at: now.toISOString() }).eq('id', device.id);
            }
          }
        }));
      }
      if (devices.length < 500) break;
    }
    return json({ sent: sent.length, failed });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'push_send_failed' }, 500);
  }
});
