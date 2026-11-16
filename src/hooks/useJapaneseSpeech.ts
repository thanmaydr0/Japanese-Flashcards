import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { supabase, supabasePublishableKey, supabaseUrl } from '../lib/supabase';

function getFriendlyAudioError() {
  return 'Check your connection and confirm ELEVENLABS_API_KEY is set in Supabase Functions → Secrets.';
}

export function useJapaneseSpeech() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [isPreparing, setIsPreparing] = useState(false);
  const preparing = useRef(false);

  useEffect(() => {
    if (status.error) {
      Alert.alert('Japanese audio unavailable', getFriendlyAudioError());
    }
  }, [status.error]);

  const speak = useCallback(async (text: string) => {
    const normalizedText = text.normalize('NFC').trim();
    if (!normalizedText || preparing.current) return;

    if (!supabase || !supabaseUrl || !supabasePublishableKey) {
      Alert.alert('Japanese audio unavailable', 'Connect the app to its Supabase project and try again.');
      return;
    }

    preparing.current = true;
    setIsPreparing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const audioUrl = new URL('/functions/v1/japanese-audio', supabaseUrl);
      audioUrl.searchParams.set('text', normalizedText);
      player.replace({
        uri: audioUrl.toString(),
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${session?.access_token ?? supabasePublishableKey}`,
        },
      });
      player.play();
    } catch {
      Alert.alert('Japanese audio unavailable', getFriendlyAudioError());
    } finally {
      preparing.current = false;
      setIsPreparing(false);
    }
  }, [player]);

  return { speak, isPreparing: isPreparing || status.isBuffering };
}
