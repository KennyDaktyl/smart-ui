export function formatDateForInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(dateString: string, deltaDays: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return formatDateForInput(date);
}

export function isFutureDate(dateString: string, today: string): boolean {
  return dateString > today;
}
