const jobTypeDictionary: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد',
  freelance: 'عمل حر',
  internship: 'تدريب',
  intern: 'متدرب',
  temporary: 'مؤقت',
  graduate: 'خريج حديث',
  traineeship: 'برنامج تدريبي',
  volunteer: 'تطوع',
  berufserfahren: 'خبرة مهنية',
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('ar-PS').format(value)
}

export function normalizeText(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function formatJobType(value: string) {
  if (jobTypeDictionary[value]) {
    return jobTypeDictionary[value]
  }

  return value.replace(/[_-]+/g, ' ')
}

export function formatPostedDate(unixSeconds: number) {
  return new Intl.DateTimeFormat('ar-PS', {
    dateStyle: 'medium',
  }).format(new Date(unixSeconds * 1000))
}

export function extractDescriptionBlocks(html: string) {
  if (typeof window === 'undefined') {
    return {
      paragraphs: [html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()],
      bullets: [],
    }
  }

  const documentFragment = new DOMParser().parseFromString(html, 'text/html')
  const paragraphs = Array.from(documentFragment.querySelectorAll('p'))
    .map((paragraph) => paragraph.textContent?.trim() ?? '')
    .filter(Boolean)

  const bullets = Array.from(documentFragment.querySelectorAll('li'))
    .map((item) => item.textContent?.trim() ?? '')
    .filter(Boolean)

  if (paragraphs.length === 0) {
    paragraphs.push(
      (documentFragment.body.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 420),
    )
  }

  return { paragraphs, bullets }
}
