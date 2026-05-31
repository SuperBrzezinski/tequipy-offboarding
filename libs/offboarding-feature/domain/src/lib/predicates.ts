import type { ReturnItem } from './types';

export function canComplete(items: ReturnItem[]): boolean {
  if (items.length === 0) return false;
  const noPending = items.every((i) => i.status !== 'Pending');
  const allIssuesNoted = items
    .filter((i) => i.status === 'Issue')
    .every((i) => i.note.trim().length > 0);
  return noPending && allIssuesNoted;
}

export function hasOpenIssues(items: ReturnItem[]): boolean {
  return items.some((i) => i.status === 'Issue');
}
