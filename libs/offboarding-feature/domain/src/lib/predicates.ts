import type { ReturnItem } from './types';

export function canComplete(items: ReturnItem[]): boolean {
  if (items.length === 0) return false;
  const noPending = items.every((item) => item.status !== 'Pending');
  const allIssuesNoted = items
    .filter((item) => item.status === 'Issue')
    .every((item) => item.note.trim().length > 0);
  return noPending && allIssuesNoted;
}

export function hasOpenIssues(items: ReturnItem[]): boolean {
  return items.some((item) => item.status === 'Issue');
}
