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

const API_PROVIDER = 'Arbeitnow Job Board API'
const API_ROOT_URL = 'https://www.arbeitnow.com'
const API_RESOURCE_PATH = '/api/job-board-api'
const API_QUERY_PAGE2 = '?page=2'
const API_QUERY_VISA = '?visa_sponsorship=true'

function LogoMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Project mark"
    >
      <rect x="2" y="2" width="36" height="36" rx="8" />
      <path d="M14 12h8.5c2.5 0 4.5 2 4.5 4.5 0 1.3-.6 2.5-1.5 3.3 1.7.7 2.9 2.4 2.9 4.4 0 2.6-2.1 4.8-4.8 4.8H14V12zm3.2 3v4.3h5.1c1.2 0 2.1-1 2.1-2.2s-.9-2.1-2.1-2.1h-5.1zm0 7.2v4.8h5.7c1.4 0 2.5-1.1 2.5-2.4 0-1.4-1.1-2.4-2.5-2.4h-5.7z" />
    </svg>
  )
}

type StatProps = { label: string; value: string; hint: string }

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
      <span className="stat__hint">{hint}</span>
    </div>
  )
}

type JobRowProps = {
  job: Job
  isActive: boolean
  onSelect: (slug: string) => void
}

function JobRow({ job, isActive, onSelect }: JobRowProps) {
  return (
    <button
      type="button"
      className={`job${isActive ? ' job--active' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(job.slug)}
    >
      <div className="job__head">
        <div>
          <h3>{job.title}</h3>
          <span className="job__company">{job.companyName}</span>
        </div>
        <span className={`badge${job.remote ? ' badge--remote' : ''}`}>
          {job.remote ? 'Remote' : 'On-site'}
        </span>
      </div>

      <div className="job__meta">
        <span>{job.location}</span>
        <span>{formatPostedDate(job.createdAt)}</span>
      </div>

      <p className="job__summary">{job.summary}</p>

      <div className="job__tags">
        {job.tags.slice(0, 3).map((tag) => (
          <span key={`${job.slug}-${tag}`} className="chip">
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

type FactProps = { label: string; value: string; note: string }

function Fact({ label, value, note }: FactProps) {
  return (
    <article className="fact">
      <span className="fact__label">{label}</span>
      <code>{value}</code>
      <p>{note}</p>
    </article>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M4 13V5a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

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
  const [lastUpdated, setLastUpdated] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    async function loadJobs() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const nextJobs = await fetchJobs(queryMode, controller.signal)
        if (ignore) return

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
        if (ignore || controller.signal.aborted) return

        setStatus('error')
        setJobs([])
        setSelectedSlug(null)

        let friendly = 'Could not load jobs. Try again in a moment.'
        if (error instanceof Error) {
          if (error.name === 'TypeError' || /failed to fetch/i.test(error.message)) {
            friendly = 'Cannot reach the API. Check your internet connection.'
          } else if (/status 429/i.test(error.message)) {
            friendly = 'Hit the provider rate limit. Wait a minute and refresh.'
          } else {
            friendly = error.message
          }
        }
        setErrorMessage(friendly)
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
  ).sort((a, b) => a.localeCompare(b))

  const filteredJobs = jobs
    .filter((job) => {
      if (remoteOnly && !job.remote) return false
      if (jobType !== 'all' && !job.jobTypes.includes(jobType)) return false
      if (!normalizedSearch) return true

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
    .sort((a, b) => {
      if (sortMode === 'company') return a.companyName.localeCompare(b.companyName)
      if (sortMode === 'remote') {
        if (a.remote === b.remote) return b.createdAt - a.createdAt
        return Number(b.remote) - Number(a.remote)
      }
      return b.createdAt - a.createdAt
    })

  const activeJob =
    filteredJobs.find((job) => job.slug === selectedSlug) ?? filteredJobs[0] ?? null
  const activeBlocks = activeJob ? extractDescriptionBlocks(activeJob.description) : null

  const remoteCount = jobs.filter((job) => job.remote).length
  const companyCount = new Set(jobs.map((job) => job.companyName)).size
  const tagCount = new Set(jobs.flatMap((job) => job.tags)).size

  const activeQuerySuffix =
    queryMode === 'visa'
      ? API_QUERY_VISA
      : queryMode === 'page2'
        ? API_QUERY_PAGE2
        : ''
  const activeRequestUrl = API_ROOT_URL + API_RESOURCE_PATH + activeQuerySuffix

  const filtersActive =
    Boolean(searchQuery) || jobType !== 'all' || sortMode !== 'recent' || remoteOnly

  function resetFilters() {
    startTransition(() => {
      setSearchQuery('')
      setJobType('all')
      setSortMode('recent')
      setRemoteOnly(false)
    })
  }

  async function copyRequestUrl() {
    try {
      await navigator.clipboard.writeText(activeRequestUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  const statusLabel =
    status === 'loading' ? 'Loading' : status === 'success' ? 'Connected' : 'Error'
  const statusDotClass =
    status === 'success'
      ? 'conn__dot conn__dot--ok'
      : status === 'error'
        ? 'conn__dot conn__dot--err'
        : 'conn__dot conn__dot--loading'
  const statusDetail =
    status === 'loading'
      ? 'Calling Arbeitnow.'
      : status === 'success'
        ? `Last updated ${lastUpdated}`
        : errorMessage

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <LogoMark />
          <div>
            <strong>Baydar Jobs</strong>
            <span>COM4381 / Assignment 1</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Primary">
          <a href="#workspace">Jobs</a>
          <a href="#guide">REST notes</a>
          <a
            href="https://www.arbeitnow.com/api/job-board-api"
            target="_blank"
            rel="noreferrer"
          >
            Open API
          </a>
        </nav>
      </header>

      <div className="section-stack">
        <section className="hero">
          <div>
            <span className="hero__eyebrow">COM4381 / Part 2</span>
            <h1>A small frontend that reads jobs from a public REST API.</h1>
            <p className="hero__lede">
              We call <code>GET {API_ROOT_URL + API_RESOURCE_PATH}</code> from the browser,
              parse the JSON, and render the results. Search and sort happen in the page so
              we do not spam the provider.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#workspace">Open the list</a>
              <a className="btn btn--ghost" href="#guide">REST notes</a>
            </div>
          </div>

          <aside className="hero__meta" aria-label="API summary">
            <div className="hero__meta-title">{API_PROVIDER}</div>
            <p className="hero__meta-sub">
              Public job board. Returns JSON. No auth needed.
            </p>
            <dl>
              <div>
                <dt>Root URL</dt>
                <dd>{API_ROOT_URL}</dd>
              </div>
              <div>
                <dt>Resource</dt>
                <dd>{API_RESOURCE_PATH}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>GET</dd>
              </div>
              <div>
                <dt>Active request</dt>
                <dd>{activeRequestUrl}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="stats" aria-label="Summary">
          <Stat label="Loaded" value={formatCount(jobs.length)} hint="Jobs from one fetch" />
          <Stat label="Companies" value={formatCount(companyCount)} hint="Unique on this page" />
          <Stat label="Remote" value={formatCount(remoteCount)} hint="Flagged remote" />
          <Stat label="Tags" value={formatCount(tagCount)} hint="Unique tags seen" />
        </section>

        <section className="conn" aria-label="API status">
          <div className="conn__left">
            <span className={statusDotClass} aria-hidden="true" />
            <div className="conn__text">
              <strong>{statusLabel}</strong>
              <span>{statusDetail}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => startTransition(() => setReloadToken((v) => v + 1))}
          >
            Refetch
          </button>
        </section>

        <section id="workspace" className="workspace">
          <div className="controls">
            <div className="controls__head">
              <div>
                <h2>Request mode</h2>
                <p>Pick which query parameters to send. One live request per mode.</p>
              </div>
            </div>

            <fieldset className="qmode">
              <legend>Query mode</legend>
              <label>
                <input
                  type="radio"
                  name="qmode"
                  value="recent"
                  checked={queryMode === 'recent'}
                  onChange={() => startTransition(() => setQueryMode('recent'))}
                />
                <span>Recent</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="qmode"
                  value="page2"
                  checked={queryMode === 'page2'}
                  onChange={() => startTransition(() => setQueryMode('page2'))}
                />
                <span>Page 2</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="qmode"
                  value="visa"
                  checked={queryMode === 'visa'}
                  onChange={() => startTransition(() => setQueryMode('visa'))}
                />
                <span>Visa sponsorship</span>
              </label>
            </fieldset>

            <div className="req">
              <span className="req__verb">GET</span>
              <code>{activeRequestUrl}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={copyRequestUrl}
                aria-label="Copy request URL"
              >
                <CopyIcon />
                <span>Copy</span>
              </button>
              <span className="copy-status" role="status" aria-live="polite">
                {copyState === 'copied'
                  ? 'Copied'
                  : copyState === 'failed'
                    ? 'Failed'
                    : ''}
              </span>
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="search">Search</label>
                <input
                  id="search"
                  type="search"
                  value={searchQuery}
                  placeholder="title, company, location, tag"
                  onChange={(event) =>
                    startTransition(() => setSearchQuery(event.target.value))
                  }
                />
              </div>

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
                <label htmlFor="sort-mode">Sort</label>
                <select
                  id="sort-mode"
                  value={sortMode}
                  onChange={(event) =>
                    startTransition(() => setSortMode(event.target.value as SortMode))
                  }
                >
                  <option value="recent">Newest</option>
                  <option value="company">Company A-Z</option>
                  <option value="remote">Remote first</option>
                </select>
              </div>
            </div>

            <label className="toggle" htmlFor="remote-only">
              <input
                id="remote-only"
                type="checkbox"
                checked={remoteOnly}
                onChange={(event) =>
                  startTransition(() => setRemoteOnly(event.target.checked))
                }
              />
              <span>Remote only</span>
            </label>

            <div className="controls__footer" aria-live="polite">
              <span className="controls__count">
                <strong>{formatCount(filteredJobs.length)}</strong> of{' '}
                {formatCount(jobs.length)} job{jobs.length === 1 ? '' : 's'} match
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={resetFilters}
                disabled={!filtersActive}
              >
                Reset filters
              </button>
            </div>
            <p className="controls__hint">
              Search, filter, and sort run locally so we only hit the API once per mode.
            </p>
          </div>

          <div className="workspace__grid">
            <section className="results" aria-label="Job list">
              <div className="results__heading">
                <h2>Jobs</h2>
                <span>Pick a row to see details</span>
              </div>

              {status === 'loading' && (
                <div
                  className="results results--skeleton"
                  aria-busy="true"
                  aria-label="Loading"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="job job--skeleton" aria-hidden="true">
                      <span className="skel skel--title" />
                      <span className="skel skel--meta" />
                      <span className="skel skel--line" />
                      <span className="skel skel--line skel--short" />
                      <div className="skel-chips">
                        <span className="skel skel--chip" />
                        <span className="skel skel--chip" />
                        <span className="skel skel--chip" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {status === 'error' && (
                <div className="placeholder placeholder--error">
                  <strong>Request failed</strong>
                  <p>{errorMessage}</p>
                </div>
              )}

              {status === 'success' && filteredJobs.length === 0 && (
                <div className="placeholder">
                  <strong>No jobs match the filters.</strong>
                  <p>Try a broader search, change job type, or turn off remote-only.</p>
                </div>
              )}

              {status === 'success' &&
                filteredJobs.map((job) => (
                  <JobRow
                    key={job.slug}
                    job={job}
                    isActive={activeJob?.slug === job.slug}
                    onSelect={setSelectedSlug}
                  />
                ))}
            </section>

            <aside className="detail" aria-label="Job details">
              {activeJob ? (
                <>
                  <div className="detail__head">
                    <div>
                      <h3>{activeJob.title}</h3>
                      <span className="detail__company">{activeJob.companyName}</span>
                    </div>
                    <span
                      className={`badge${activeJob.remote ? ' badge--remote' : ''}`}
                    >
                      {activeJob.remote ? 'Remote' : 'On-site'}
                    </span>
                  </div>

                  <dl className="detail__facts">
                    <div>
                      <dt>Location</dt>
                      <dd>{activeJob.location}</dd>
                    </div>
                    <div>
                      <dt>Posted</dt>
                      <dd>{formatPostedDate(activeJob.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>
                        {activeJob.jobTypes.map(formatJobType).join(', ') || 'Not given'}
                      </dd>
                    </div>
                  </dl>

                  {activeJob.tags.length > 0 && (
                    <div className="detail__tags">
                      {activeJob.tags.map((tag) => (
                        <span key={`${activeJob.slug}-d-${tag}`} className="chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="detail__body">
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

                  <div className="detail__actions">
                    <a
                      className="btn btn--accent"
                      href={activeJob.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the original posting
                    </a>
                    <a
                      className="btn btn--ghost"
                      href={API_ROOT_URL + API_RESOURCE_PATH + API_QUERY_PAGE2}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View page=2 raw
                    </a>
                  </div>
                </>
              ) : status === 'loading' ? (
                <div className="placeholder">
                  <strong>Loading</strong>
                  <p>Details will appear after the first response.</p>
                </div>
              ) : (
                <div className="placeholder">
                  <strong>Nothing selected</strong>
                  <p>Pick a job on the left to see the full details here.</p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section id="guide" className="guide" aria-label="REST notes">
          <div className="guide__head">
            <h2>REST notes for the presentation</h2>
            <p>
              Quick reference for Part 1 of the assignment. Provider, resource, method,
              representation, and the two query parameters we demo live.
            </p>
          </div>

          <div className="guide__grid">
            <Fact
              label="Provider"
              value={API_PROVIDER}
              note="Public job board that exposes its data as a REST resource."
            />
            <Fact
              label="Base resource"
              value={API_ROOT_URL + API_RESOURCE_PATH}
              note="Represents the jobs collection. Callable from the browser."
            />
            <Fact
              label="Method"
              value="GET"
              note="We only read, so GET is correct. No server state changes."
            />
            <Fact
              label="Representation"
              value="application/json"
              note="Response is JSON. We map it into the cards on the left."
            />
            <Fact
              label="Pagination query"
              value={API_QUERY_PAGE2}
              note="Page 2 of the jobs collection. Switchable from the tabs above."
            />
            <Fact
              label="Visa-sponsorship query"
              value={API_QUERY_VISA}
              note="Filters for roles that mention visa sponsorship. Same tabs above."
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
