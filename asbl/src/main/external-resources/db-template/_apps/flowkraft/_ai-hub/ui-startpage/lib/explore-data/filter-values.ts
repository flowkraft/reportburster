/**
 * What a dashboard filter's new value means for the canvas.
 *
 * <rb-parameters> reports every value through one `valueChange` event, and it fires that event
 * twice for two different reasons: once when it seeds itself from the declared defaults, and again
 * whenever a person types, picks or clears something. An empty value means opposite things in the
 * two cases - a seeded empty must not write over a value the canvas already holds, while a person
 * clearing a box is saying "no filter", which the canvas has to hear. The event says which it is
 * (`rbInit`), and this is the rule that reads it.
 */
export function filterValueApplies(
  next: string,
  current: string | undefined,
  fromInit: boolean,
): boolean {
  // Something was entered: always the newest thing the user did.
  if (next !== "") return true;
  // Nothing was entered, by a person: the filter is cleared, and an empty filter is not applied.
  if (!fromInit) return true;
  // Nothing was entered, by the component seeding itself: it may not shadow a value already there.
  return !current;
}

/**
 * The other filters an options SELECT names as `${id}`, in the bar's order: the ones whose change
 * asks it again (#17). The same rule as the server's `ReportingService.optionsUses`, which the
 * published dashboard's config reads.
 */
export function optionsUses(sql: string, params: { id: string }[], ownId: string): string[] {
  const uses: string[] = [];
  for (const p of params) {
    if (p.id && p.id !== ownId && !uses.includes(p.id) && sql.includes("${" + p.id + "}")) uses.push(p.id);
  }
  return uses;
}
