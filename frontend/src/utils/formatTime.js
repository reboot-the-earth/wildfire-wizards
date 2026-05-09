export function formatCountdown(secondsLeft) {
  if (secondsLeft <= 0) return { text: 'NOW', urgency: 'critical' };
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return {
    text: `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`,
    h, m, s,
  };
}

export function formatMinutes(totalMin) {
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDistance(km) {
  return `${km.toFixed(1)} km`;
}
