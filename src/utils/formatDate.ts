const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// Ex.: "terça, 18 de agosto" — mesmo formato usado no protótipo "Home Minimalista".
// Escrito à mão (em vez de Intl.DateTimeFormat) pra não depender de dados de
// locale do ICU estarem disponíveis no engine JS do dispositivo.
export function formatFriendlyDate(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return `${weekday}, ${day} de ${month}`;
}
