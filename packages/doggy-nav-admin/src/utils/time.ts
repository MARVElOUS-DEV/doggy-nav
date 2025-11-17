type DateInput = string | number | Date | null | undefined;

const DEFAULT_PLACEHOLDER = '--';

const pad = (num: number) => String(num).padStart(2, '0');

export function formatDateTime(value: DateInput, placeholder?: string): string {
  const displayPlaceholder =
    typeof placeholder === 'string' && placeholder.trim().length > 0
      ? placeholder
      : DEFAULT_PLACEHOLDER;

  if (value === null || value === undefined) return displayPlaceholder;

  let dateValue: Date;

  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === 'number') {
    dateValue = new Date(value);
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return displayPlaceholder;

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      dateValue = new Date(trimmed.length === 10 ? numeric * 1000 : numeric);
    } else {
      dateValue = new Date(trimmed);
    }
  } else {
    return displayPlaceholder;
  }

  if (Number.isNaN(dateValue.getTime())) return displayPlaceholder;

  return [
    `${dateValue.getFullYear()}-${pad(dateValue.getMonth() + 1)}-${pad(
      dateValue.getDate(),
    )}`,
    `${pad(dateValue.getHours())}:${pad(dateValue.getMinutes())}:${pad(
      dateValue.getSeconds(),
    )}`,
  ].join(' ');
}
