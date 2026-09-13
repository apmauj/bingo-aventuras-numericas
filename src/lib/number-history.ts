export interface ScrollableNumberHistory {
  scrollTop: number;
  scrollHeight: number;
}

export function scrollToLatest(container: ScrollableNumberHistory | null): void {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}
