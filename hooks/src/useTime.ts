import { useState } from "react";

export const useTimer = (): [number, () => void, () => void, () => void] => {
  const [time, setTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const clearTimerInterval = (): void => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  const startOrResumeTimer = (): void => {
    clearTimerInterval();
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const resetTimer = (): void => {
    setTime(0);
    clearTimerInterval();
    startOrResumeTimer();
  };

  return [time, resetTimer, clearTimerInterval, startOrResumeTimer];
};
