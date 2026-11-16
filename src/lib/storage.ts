import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_STATE, LearningState } from './learning';

const STORAGE_KEY = 'kana-path:learning-state:v1';

export async function loadLearningState(): Promise<LearningState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      mastery: parsed.mastery ?? {},
      answerLog: parsed.answerLog ?? [],
    };
  } catch {
    return INITIAL_STATE;
  }
}

export async function saveLearningState(state: LearningState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
