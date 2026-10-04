export function isPreDiagnosticEvent(title = '', type = '') {
  return /pré[- ]diagnostic/i.test(`${title} ${type}`);
}

export function formatHistoryDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}