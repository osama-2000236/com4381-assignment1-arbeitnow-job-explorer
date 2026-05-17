export type QueryMode = 'recent' | 'visa'

export type SortMode = 'recent' | 'company' | 'remote'

export type Job = {
  slug: string
  companyName: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  jobTypes: string[]
  location: string
  createdAt: number
  summary: string
}

export type JobsApiResponse = {
  data: Array<{
    slug: string
    company_name: string
    title: string
    description: string
    remote: boolean
    url: string
    tags: string[]
    job_types: string[]
    location: string
    created_at: number
  }>
}
