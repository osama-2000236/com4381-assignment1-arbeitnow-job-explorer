import type { Job, JobsApiResponse, QueryMode } from '../types'

const JOBS_ENDPOINT = 'https://www.arbeitnow.com/api/job-board-api'

function toPlainText(html: string) {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const documentFragment = new DOMParser().parseFromString(html, 'text/html')
  return (documentFragment.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeJob(entry: JobsApiResponse['data'][number]): Job {
  const summary = toPlainText(entry.description).slice(0, 220).trim()

  return {
    slug: entry.slug,
    companyName: entry.company_name,
    title: entry.title,
    description: entry.description,
    remote: entry.remote,
    url: entry.url,
    tags: entry.tags ?? [],
    jobTypes: entry.job_types ?? [],
    location: entry.location || 'غير محدد',
    createdAt: entry.created_at,
    summary: summary.endsWith('.') ? summary : `${summary}...`,
  }
}

export async function fetchJobs(mode: QueryMode, signal?: AbortSignal) {
  const requestUrl = new URL(JOBS_ENDPOINT)

  if (mode === 'visa') {
    requestUrl.searchParams.set('visa_sponsorship', 'true')
  }

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`فشل الاتصال بالخدمة. رمز الاستجابة: ${response.status}`)
  }

  const payload = (await response.json()) as JobsApiResponse

  if (!payload.data || !Array.isArray(payload.data)) {
    throw new Error('صيغة البيانات غير متوقعة من خدمة الوظائف.')
  }

  return payload.data.map(normalizeJob)
}
