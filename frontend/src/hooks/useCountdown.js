import { useState, useEffect, useCallback } from 'react';

export function useCountdown(hoursRemaining) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor(hoursRemaining * 3600))
  );

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor(hoursRemaining * 3600)));
  }, [hoursRemaining]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft > 0]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  let urgency = 'warning';
  if (hours < 1) urgency = 'critical';
  else if (hours < 2) urgency = 'urgent';

  const formatted = secondsLeft <= 0
    ? null
    : `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  const reset = useCallback((newHours) => {
    setSecondsLeft(Math.max(0, Math.floor(newHours * 3600)));
  }, []);

  return { hours, minutes, seconds, secondsLeft, formatted, urgency, reset };
}
