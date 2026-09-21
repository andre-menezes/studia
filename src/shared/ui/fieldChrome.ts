export const fieldControlBaseClass =
  "w-full rounded-xl border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60";

export const fieldControlOkClass =
  "border-border focus:border-accent focus:ring-2 focus:ring-accent/25";

export const fieldControlErrorClass =
  "border-error focus:border-error focus:ring-2 focus:ring-error/25";

let fieldIdSeq = 0;

export function nextFieldId(prefix = "app-field"): string {
  fieldIdSeq += 1;
  return `${prefix}-${fieldIdSeq}`;
}
