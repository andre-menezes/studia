/** Calendar-month quota period in the user's time zone (ADR-0009). */

function zonedParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** Offset (ms) of `timeZone` from UTC at `instant`. */
function offsetAt(instant: number, timeZone: string) {
  const p = zonedParts(instant, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(instant / 1000) * 1000
}

/** UTC instant of local midnight on the 1st of `month` (1-12, may overflow). */
function startOfMonth(year: number, month: number, timeZone: string) {
  const naive = Date.UTC(year, month - 1, 1)
  // Two passes settle DST transitions near midnight.
  let instant = naive - offsetAt(naive, timeZone)
  instant = naive - offsetAt(instant, timeZone)
  // Midnight may be skipped (DST gap) or repeated (overlap): settle on the
  // first instant whose local date is the 1st.
  const STEP = 15 * 60 * 1000
  while (zonedParts(instant, timeZone).day !== 1) instant += STEP
  while (zonedParts(instant - STEP, timeZone).day === 1) instant -= STEP
  return instant
}

export function monthlyPeriod(timeZone: string, now = Date.now()) {
  const { year, month } = zonedParts(now, timeZone)
  const start = startOfMonth(year, month, timeZone)
  const end = startOfMonth(year, month + 1, timeZone)
  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    periodStart: new Date(start).toISOString(),
    periodEnd: new Date(end).toISOString(),
  }
}
