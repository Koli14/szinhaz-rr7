export const socialLinks = [
  ['facebook', 'https://facebook.com/szinhazonline/'],
  ['instagram', 'https://instagram.com/szinhaz.online/'],
] as const

// WordPress dates are site-local wall-clock times without an offset: format
// them as they are, so the server (UTC) and the browser render the same text.
export function formatDate(date: string) {
  const utc = /(Z|[+-]\d\d:\d\d)$/.test(date) ? date : `${date}Z`
  return new Date(utc).toLocaleString('hu-HU', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
