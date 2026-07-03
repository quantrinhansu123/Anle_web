/** Today's date as YYYY-MM-DD (local timezone). */
export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** DDMMYY segment used in shipment codes, e.g. SCMANL15062601 → 150626 */
export function formatShipmentCodeDatePart(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}
