export function formatDate(iso: string, showTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(showTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  return new Date(iso).toLocaleDateString('en-GB', options);
}
