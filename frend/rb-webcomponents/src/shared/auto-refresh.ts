/**
 * How often a published dashboard asks all its data again (#22).
 *
 * The author sets it in the canvas's dashboard settings, and the published template carries it on
 * its root as `data-auto-refresh="<minutes>"` (`DashboardFileGenerator`). A dashboard without it, or
 * with anything but a whole number from 1 up, never refreshes by itself.
 */
export function autoRefreshMinutesOf(root: Element | null | undefined): number {
  const dashboard = root?.matches?.('[data-auto-refresh]') ? root : root?.querySelector?.('[data-auto-refresh]');
  const text = (dashboard?.getAttribute('data-auto-refresh') || '').trim();
  if (!/^\d+$/.test(text)) return 0;
  const minutes = Number(text);
  return minutes >= 1 ? minutes : 0;
}
