export const socialLinks = [
  ["facebook", "https://facebook.com/szinhazonline/"],
  ["instagram", "https://instagram.com/szinhaz.online/"],
] as const

export function formatDate(date: string) {
  return new Date(date).toLocaleString("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
