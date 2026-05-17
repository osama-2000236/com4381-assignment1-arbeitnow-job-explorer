import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { fetchJobs } from './lib/api'
import {
  extractDescriptionBlocks,
  formatCount,
  formatJobType,
  formatPostedDate,
  normalizeText,
} from './lib/formatters'
import type { Job, QueryMode, SortMode } from './types'

function BaydarMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 56 56"
      role="img"
      aria-label="Baydar Jobs mark"
    >
      <rect x="4" y="4" width="48" height="48" rx="16" />
      <path d="M34.8 18.2H23.6c-4.9 0-8.8 4-8.8 8.8v9.4c0 1.6 1.3 2.8 2.8 2.8s2.8-1.3 2.8-2.8V27c0-1.8 1.4-3.2 3.2-3.2h8.3v6.7h-8.2c-1.5 0-2.8 1.2-2.8 2.8s1.2 2.8 2.8 2.8h11.1c1.6 0 2.8-1.3 2.8-2.8V21c0-1.6-1.3-2.8-2.8-2.8Z" />
    </svg>
  )
}

type StatCardProps = {
  label: string
  value: string
  hint: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__hint">{hint}</span>
    </article>
  )
}

type JobListItemProps = {
  job: Job
  isActive: boolean
  onSelect: (slug: string) => void
}

function JobListItem({ job, isActive, onSelect }: JobListItemProps) {
  return (
    <button
      type="button"
      className={`job-list-item${isActive ? ' job-list-item--active' : ''}`}
      onClick={() => onSelect(job.slug)}
    >
      <div className="job-list-item__header">
        <div>
          <strong>{job.title}</strong>
          <span>{job.companyName}</span>
        </div>
        <span className={`job-badge${job.remote ? ' job-badge--accent' : ''}`}>
          {job.remote ? 'Remote' : 'On-site or hybrid'}
        </span>
      </div>

      <div className="job-list-item__meta">
        <span>{job.location}</span>
        <span>{formatPostedDate(job.createdAt)}</span>
      </div>

      <p>{job.summary}</p>

      <div className="tag-row">
        {job.tags.slice(0, 3).map((tag) => (
          <span key={`${job.slug}-${tag}`} className="tag-row__tag">
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

type RestFactProps = {
  title: string
  value: string
  description: string
}

function RestFact({ title, value, description }: RestFactProps) {
  return (
    <article className="rest-fact">
      <span className="rest-fact__title">{title}</span>
      <code>{value}</code>
      <p>{description}</p>
    </article>
  )
}

const API_PROVIDER = 'Arbeitnow Job Board API'
const API_ROOT_URL = 'https://www.arbeitnow.com'
const API_RESOURCE_PATH = '/api/job-board-api'
const API_DEMO_QUERY = '?page=2'
const API_VISA_QUERY = '?visa_sponsorship=true'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [queryMode, setQueryMode] = useState<QueryMode>('recent')
  const [jobType, setJobType] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [reloadToken, setReloadToken] = useState(0)

  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    async function loadJobs() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const nextJobs = await fetchJobs(queryMode, controller.signal)

        if (ignore) {
          return
        }

        setJobs(nextJobs)
        setSelectedSlug(nextJobs[0]?.slug ?? null)
        setLastUpdated(
          new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date()),
        )
        setStatus('success')
      } catch (error) {
        if (ignore || controller.signal.aborted) {
          return
        }

        setStatus('error')
        setJobs([])
        setSelectedSlug(null)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Jobs could not be loaded right now. Please try again in a moment.',
        )
      }
    }

    void loadJobs()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [queryMode, reloadToken])

  const normalizedSearch = normalizeText(deferredSearch)
  const availableJobTypes = Array.from(
    new Set(jobs.flatMap((job) => job.jobTypes).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second))

  const filteredJobs = jobs
    .filter((job) => {
      if (remoteOnly && !job.remote) {
        return false
      }

      if (jobType !== 'all' && !job.jobTypes.includes(jobType)) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = normalizeText(
        [
          job.title,
          job.companyName,
          job.location,
          job.summary,
          job.tags.join(' '),
          job.jobTypes.join(' '),
        ].join(' '),
      )

      return haystack.includes(normalizedSearch)
    })
    .sort((first, second) => {
      if (sortMode === 'company') {
        return first.companyName.localeCompare(second.companyName)
      }

      if (sortMode === 'remote') {
        if (first.remote === second.remote) {
          return second.createdAt - first.createdAt
        }

        return Number(second.remote) - Number(first.remote)
      }

      return second.createdAt - first.createdAt
    })

  const activeJob =
    filteredJobs.find((job) => job.slug === selectedSlug) ?? filteredJobs[0] ?? null
  const activeBlocks = activeJob ? extractDescriptionBlocks(activeJob.description) : null

  const remoteCount = jobs.filter((job) => job.remote).length
  const companyCount = new Set(jobs.map((job) => job.companyName)).size
  const tagCount = new Set(jobs.flatMap((job) => job.tags)).size
  const activeRequestUrl =
    queryMode === 'visa'
      ? API_ROOT_URL + API_RESOURCE_PATH + API_VISA_QUERY
      : API_ROOT_URL + API_RESOURCE_PATH

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <BaydarMark />
          <div>
            <strong>Baydar Jobs</strong>
            <span>English REST Job Explorer</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Primary navigation">
          <a href="#jobs">Explore jobs</a>
          <a href="#rest-guide">REST explanation</a>
          <a href="https://www.arbeitnow.com/api/job-board-api" target="_blank" rel="noreferrer">
            Open API
          </a>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <span className="eyebrow">COM4381 project with a real REST API</span>
          <h1>Explore live job data from Arbeitnow with a polished English interface.</h1>
          <p>
            This <strong>React + Vite</strong> client calls a real REST endpoint with
            <code>GET</code>, then lets students and graduates search, filter, compare,
            and open original application links without unnecessary repeated requests.
          </p>

          <div className="hero-panel__actions">
            <a className="primary-link" href="#jobs">
              Start exploring
            </a>
            <a className="secondary-link" href="#rest-guide">
              View REST proof
            </a>
          </div>
        </div>

        <aside className="hero-panel__highlight">
          <span className="status-pill status-pill--live">Live API</span>
          <strong>{API_PROVIDER}</strong>
          <p>The provider exposes public job opportunities as JSON and can be consumed directly from the browser.</p>
          <dl>
            <div>
              <dt>Root URL</dt>
              <dd>{API_ROOT_URL}</dd>
            </div>
            <div>
              <dt>Resource Path</dt>
              <dd>{API_RESOURCE_PATH}</dd>
            </div>
            <div>
              <dt>Query Demo</dt>
              <dd>{queryMode === 'visa' ? API_VISA_QUERY : API_DEMO_QUERY}</dd>
            </div>
            <div>
              <dt>Active Request</dt>
              <dd>{activeRequestUrl}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="stats-grid" aria-label="Live data summary">
        <StatCard
          label="Jobs loaded"
          value={formatCount(jobs.length)}
          hint="Fetched from the live endpoint"
        />
        <StatCard
          label="Companies"
          value={formatCount(companyCount)}
          hint="Unique employers in this page"
        />
        <StatCard
          label="Remote"
          value={formatCount(remoteCount)}
          hint="Flexible opportunities for students"
        />
        <StatCard
          label="Tags"
          value={formatCount(tagCount)}
          hint="Signals skills and job families"
        />
      </section>

      <section className="api-status-panel" aria-label="API connection status">
        <div>
          <span className={`status-pill${status === 'success' ? ' status-pill--live' : ''}`}>
            {status === 'loading'
              ? 'Loading'
              : status === 'success'
                ? 'Connected'
                : 'Error'}
          </span>
          <strong>Live data status</strong>
          <p>
            {status === 'loading'
              ? 'Loading real data from Arbeitnow now.'
              : status === 'success'
                ? `Last updated: ${lastUpdated}`
                : errorMessage}
          </p>
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={() => startTransition(() => setReloadToken((value) => value + 1))}
        >
          Refresh from API
        </button>
      </section>

      <section id="jobs" className="workspace">
        <div className="workspace__controls">
          <fieldset className="query-switch">
            <legend>Current REST request</legend>
            <label>
              <input
                type="radio"
                name="query-mode"
                value="recent"
                checked={queryMode === 'recent'}
                onChange={() => startTransition(() => setQueryMode('recent'))}
              />
              <span>Recent jobs</span>
            </label>
            <label>
              <input
                type="radio"
                name="query-mode"
                value="visa"
                checked={queryMode === 'visa'}
                onChange={() => startTransition(() => setQueryMode('visa'))}
              />
              <span>Visa sponsorship</span>
            </label>
          </fieldset>

          <div className="request-line">
            <span>GET</span>
            <code>{activeRequestUrl}</code>
          </div>

          <div className="field">
            <label htmlFor="search">Search by title, company, location, or skill</label>
            <input
              id="search"
              type="search"
              value={searchQuery}
              placeholder="Try developer, Berlin, support..."
              onChange={(event) =>
                startTransition(() => setSearchQuery(event.target.value))
              }
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="job-type">Job type</label>
              <select
                id="job-type"
                value={jobType}
                onChange={(event) =>
                  startTransition(() => setJobType(event.target.value))
                }
              >
                <option value="all">All types</option>
                {availableJobTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatJobType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="sort-mode">Sort by</label>
              <select
                id="sort-mode"
                value={sortMode}
                onChange={(event) =>
                  startTransition(() => setSortMode(event.target.value as SortMode))
                }
              >
                <option value="recent">Newest first</option>
                <option value="company">Company name</option>
                <option value="remote">Remote first</option>
              </select>
            </div>
          </div>

          <label className="toggle-field" htmlFor="remote-only">
            <input
              id="remote-only"
              type="checkbox"
              checked={remoteOnly}
              onChange={(event) =>
                startTransition(() => setRemoteOnly(event.target.checked))
              }
            />
            <span>Show remote jobs only</span>
          </label>

          <div className="workspace__summary">
            <strong>{formatCount(filteredJobs.length)} visible result{filteredJobs.length === 1 ? '' : 's'}</strong>
            <span>Filtering is local after one live request to keep API usage low.</span>
          </div>
        </div>

        <div className="workspace__content">
          <section className="results-panel" aria-label="Job results">
            <div className="section-heading">
              <h2>Opportunity list</h2>
              <p>Select a job to inspect details and continue to the original provider page.</p>
            </div>

            {status === 'loading' && (
              <div className="panel-message">
                <strong>Loading jobs...</strong>
                <p>Waiting for the live provider response, then search and sorting run in the browser.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="panel-message panel-message--error">
                <strong>Request failed</strong>
                <p>{errorMessage}</p>
              </div>
            )}

            {status === 'success' && filteredJobs.length === 0 && (
              <div className="panel-message">
                <strong>No matching jobs</strong>
                <p>Try a broader search term, change the job type, or turn off the remote-only filter.</p>
              </div>
            )}

            <div className="results-list">
              {filteredJobs.map((job) => (
                <JobListItem
                  key={job.slug}
                  job={job}
                  isActive={activeJob?.slug === job.slug}
                  onSelect={setSelectedSlug}
                />
              ))}
            </div>
          </section>

          <aside className="detail-panel" aria-label="Selected job details">
            <div className="section-heading">
              <h2>Selected details</h2>
              <p>Review the most useful information before opening the original application page.</p>
            </div>

            {activeJob ? (
              <article className="detail-card">
                <div className="detail-card__title-row">
                  <div>
                    <h3>{activeJob.title}</h3>
                    <span>{activeJob.companyName}</span>
                  </div>
                  <span className={`job-badge${activeJob.remote ? ' job-badge--accent' : ''}`}>
                    {activeJob.remote ? 'Remote' : 'On-site or hybrid'}
                  </span>
                </div>

                <dl className="detail-card__facts">
                  <div>
                    <dt>Location</dt>
                    <dd>{activeJob.location}</dd>
                  </div>
                  <div>
                    <dt>Posted</dt>
                    <dd>{formatPostedDate(activeJob.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Job types</dt>
                    <dd>{activeJob.jobTypes.map(formatJobType).join(', ') || 'Not specified'}</dd>
                  </div>
                </dl>

                <div className="tag-row tag-row--detail">
                  {activeJob.tags.map((tag) => (
                    <span key={`${activeJob.slug}-detail-${tag}`} className="tag-row__tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="detail-card__description">
                  {activeBlocks?.paragraphs.slice(0, 3).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {activeBlocks && activeBlocks.bullets.length > 0 && (
                    <ul>
                      {activeBlocks.bullets.slice(0, 5).map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="detail-card__actions">
                  <a
                    className="primary-link"
                    href={activeJob.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open original application
                  </a>
                  <a
                    className="secondary-link"
                    href={API_ROOT_URL + API_RESOURCE_PATH + API_DEMO_QUERY}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live page=2 example
                  </a>
                </div>
              </article>
            ) : (
              <div className="panel-message">
                <strong>Select a job from the list</strong>
                <p>The full detail preview will appear here once a result is selected.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section id="rest-guide" className="rest-guide">
        <div className="section-heading">
          <h2>How this project demonstrates REST</h2>
          <p>
            Use this section in the presentation to explain the provider, resource, HTTP method,
            JSON representation, and query parameters.
          </p>
        </div>

        <div className="rest-guide__grid">
          <RestFact
            title="API provider"
            value={API_PROVIDER}
            description="A public job-board service that exposes job openings through a clear REST resource."
          />
          <RestFact
            title="Base resource"
            value={API_ROOT_URL + API_RESOURCE_PATH}
            description="Represents the jobs collection and can be called directly from the frontend."
          />
          <RestFact
            title="HTTP method"
            value="GET"
            description="GET is used because the app only reads data and does not modify server state."
          />
          <RestFact
            title="Response representation"
            value="application/json"
            description="The API returns JSON that the client maps into searchable cards and details."
          />
          <RestFact
            title="Required query demo"
            value={API_DEMO_QUERY}
            description="Demonstrates pagination in Postman or the browser for Assignment Part 1."
          />
          <RestFact
            title="Implemented query demo"
            value={API_VISA_QUERY}
            description="A real query mode implemented in the UI to show how query parameters change data."
          />
          <RestFact
            title="Use case"
            value="Student or graduate job search"
            description="The user loads real jobs, narrows the results locally, then opens the original posting."
          />
        </div>
      </section>
    </main>
  )
}

export default App
