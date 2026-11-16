import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Script } from '../data/kana';
import { recordAnswer, LearningState, StudyCard, StudyMode, INITIAL_STATE } from '../lib/learning';
import { loadCloudLearningSnapshot, mergeCloudLearningState, syncLearningState } from '../lib/cloud';
import { loadLearningState, saveLearningState } from '../lib/storage';

type LearningContextValue = {
  state: LearningState;
  loaded: boolean;
  completeSetup: (minutes: number) => void;
  changeDailyMinutes: (minutes: number) => void;
  setPreferredScript: (script: Script) => void;
  gradeCard: (card: StudyCard, mode: StudyMode, correct: boolean) => void;
  resetProgress: () => void;
  refreshCloudProgress: () => Promise<void>;
};

const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(INITIAL_STATE);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    loadLearningState().then((saved) => {
      if (!active) return;
      stateRef.current = saved;
      setState(saved);
      setLoaded(true);
      void loadCloudLearningSnapshot().then((snapshot) => {
        if (!active || !snapshot) return;
        const merged = mergeCloudLearningState(stateRef.current, snapshot);
        stateRef.current = merged;
        setState(merged);
        void saveLearningState(merged);
        void syncLearningState(merged).catch(() => undefined);
      });
    });
    return () => {
      active = false;
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const commit = useCallback((next: LearningState) => {
    const updated = { ...next, updatedAt: Date.now() };
    stateRef.current = updated;
    setState(updated);
    void saveLearningState(updated);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    if (updated.setupCompleted) {
      syncTimer.current = setTimeout(() => {
        void syncLearningState(stateRef.current).catch(() => undefined);
      }, 900);
    }
  }, []);

  const completeSetup = useCallback((minutes: number) => {
    commit({
      ...state,
      setupCompleted: true,
      dailyMinutes: minutes,
      startedAt: state.startedAt ?? Date.now(),
    });
  }, [commit, state]);

  const changeDailyMinutes = useCallback((minutes: number) => {
    commit({ ...state, dailyMinutes: minutes });
  }, [commit, state]);

  const setPreferredScript = useCallback((script: Script) => {
    commit({ ...state, preferredScript: script });
  }, [commit, state]);

  const gradeCard = useCallback((card: StudyCard, mode: StudyMode, correct: boolean) => {
    commit(recordAnswer(state, card, mode, correct));
  }, [commit, state]);

  const resetProgress = useCallback(() => {
    commit({
      ...INITIAL_STATE,
      setupCompleted: true,
      dailyMinutes: state.dailyMinutes,
      startedAt: Date.now(),
    });
  }, [commit, state.dailyMinutes]);

  const refreshCloudProgress = useCallback(async () => {
    const snapshot = await loadCloudLearningSnapshot();
    if (!snapshot) return;
    const merged = mergeCloudLearningState(stateRef.current, snapshot);
    stateRef.current = merged;
    setState(merged);
    await saveLearningState(merged);
    await syncLearningState(merged).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      state,
      loaded,
      completeSetup,
      changeDailyMinutes,
      setPreferredScript,
      gradeCard,
      resetProgress,
      refreshCloudProgress,
    }),
    [state, loaded, completeSetup, changeDailyMinutes, setPreferredScript, gradeCard, resetProgress, refreshCloudProgress]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) throw new Error('useLearning must be used inside LearningProvider');
  return context;
}
