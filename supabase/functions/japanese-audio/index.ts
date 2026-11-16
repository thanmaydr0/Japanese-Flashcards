const VOICE_ID = '6KjeF79VZF00h2NU8wKp';
const TTS_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
const MAX_TEXT_LENGTH = 180;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return jsonError('Use GET to request Japanese pronunciation audio.', 405);
  }

  const text = new URL(request.url).searchParams.get('text')?.normalize('NFC').trim() ?? '';
  if (!text || text.length > MAX_TEXT_LENGTH || !/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) {
    return jsonError(`Text must contain Japanese characters and be ${MAX_TEXT_LENGTH} characters or fewer.`, 400);
  }

  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    return jsonError('Japanese audio is not configured. Add ELEVENLABS_API_KEY to Supabase Function Secrets.', 503);
  }

  try {
    const upstream = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 500);
      console.error(`[japanese-audio] ElevenLabs returned ${upstream.status}: ${detail}`);
      return jsonError('ElevenLabs could not generate Japanese audio. Check the API key, voice access, and account quota.', 502);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[japanese-audio] Request to ElevenLabs failed:', error);
    return jsonError('Unable to reach ElevenLabs. Check the connection and retry.', 502);
  }
});
