export function localDateKey(date: Date = new Date()): string {
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shouldSwitchDaily(lastDateKey: string | undefined, now: Date = new Date()): boolean {
  return lastDateKey !== localDateKey(now);
}
