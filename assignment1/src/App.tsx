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

const BOOKMARKS_STORAGE_KEY = 'baydar-jobs:bookmarks:v1'

function loadBookmarks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function saveBookmarks(slugs: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // storage full or blocked; nothing to do for an in-class demo
  }
}

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

type StarIconProps = { filled: boolean }

function StarIcon({ filled }: StarIconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M10 1.8l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L10 15.2l-5.3 2.7 1.1-5.8L1.5 8l5.9-.8L10 1.8z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type JobRowProps = {
  job: Job
  isActive: boolean
  isBookmarked: boolean
  onSelect: (slug: string) => void
  onToggleBookmark: (slug: string) => void
}

function JobRow({ job, isActive, isBookmarked, onSelect, onToggleBookmark }: JobRowProps) {
  return (
    <div className={`job${isActive ? ' job--active' : ''}`}>
      <button
        type="button"
        className="job__hit"
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(job.slug)}
      >
        <div className="job__head">
          <div className="job__title-block">
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

      <button
        type="button"
        className={`star${isBookmarked ? ' star--on' : ''}`}
        onClick={() => onToggleBookmark(job.slug)}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? `Remove ${job.title} from saved` : `Save ${job.title}`}
        title={isBookmarked ? 'Remove from saved' : 'Save for later'}
      >
        <StarIcon filled={isBookmarked} />
      </button>
    </div>
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
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadBookmarks())
  const [savedOnly, setSavedOnly] = useState(false)

  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    saveBookmarks(bookmarks)
  }, [bookmarks])

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

  const bookmarkSet = new Set(bookmarks)

  const filteredJobs = jobs
    .filter((job) => {
      if (savedOnly && !bookmarkSet.has(job.slug)) return false
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
  const activeIsBookmarked = activeJob ? bookmarkSet.has(activeJob.slug) : false

  const remoteCount = jobs.filter((job) => job.remote).length
  const companyCount = new Set(jobs.map((job) => job.companyName)).size
  const savedOnPageCount = jobs.filter((job) => bookmarkSet.has(job.slug)).length

  const activeQuerySuffix =
    queryMode === 'visa'
      ? API_QUERY_VISA
      : queryMode === 'page2'
        ? API_QUERY_PAGE2
        : ''
  const activeRequestUrl = API_ROOT_URL + API_RESOURCE_PATH + activeQuerySuffix

  const filtersActive =
    Boolean(searchQuery) ||
    jobType !== 'all' ||
    sortMode !== 'recent' ||
    remoteOnly ||
    savedOnly

  function resetFilters() {
    startTransition(() => {
      setSearchQuery('')
      setJobType('all')
      setSortMode('recent')
      setRemoteOnly(false)
      setSavedOnly(false)
    })
  }

  function toggleBookmark(slug: string) {
    setBookmarks((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    )
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
      ? 'Calling Arbeitnow'
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
            <span>COM4381 · Part 2 · Birzeit University</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Primary">
          <a href="#workspace">Jobs</a>
          <a href="#guide">REST notes</a>
          {bookmarks.length > 0 && (
            <button
              type="button"
              className="nav-pill"
              onClick={() => {
                setSavedOnly((on) => !on)
                document
                  .getElementById('workspace')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              aria-pressed={savedOnly}
            >
              <StarIcon filled />
              {bookmarks.length} saved
            </button>
          )}
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
            <span className="hero__eyebrow">COM4381 · Part 2</span>
            <h1>A browser that reads a public jobs board, with a star button so we don't lose the good ones.</h1>
            <p className="hero__lede">
              Iyas and I picked Arbeitnow because most public job APIs hide behind keys
              and OAuth dances. Arbeitnow just hands you JSON. We send one{' '}
              <code>GET</code> per request mode and keep the rest of the work
              (search, sort, save) in the page. Whatever you star is kept in{' '}
              <code>localStorage</code>, so the list survives a refresh.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#workspace">Browse the list</a>
              <a className="btn btn--ghost" href="#guide">REST notes</a>
            </div>
          </div>

          <aside className="hero__meta" aria-label="API summary">
            <div className="hero__meta-title">{API_PROVIDER}</div>
            <p className="hero__meta-sub">
              No auth. No pagination cursor wrangling. Just JSON.
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
          <Stat label="On this page" value={formatCount(jobs.length)} hint="From the most recent GET" />
          <Stat label="Companies" value={formatCount(companyCount)} hint="Distinct employers in view" />
          <Stat label="Remote" value={formatCount(remoteCount)} hint="API flagged these as remote" />
          <Stat
            label="Saved"
            value={formatCount(bookmarks.length)}
            hint={
              savedOnPageCount === bookmarks.length
                ? 'All shown on this page'
                : `${savedOnPageCount} of them on this page`
            }
          />
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
                <h2>What we ask the API</h2>
                <p>
                  Three modes. Each one is a different GET. Switching tabs is the only
                  thing in this UI that talks to the network.
                </p>
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
                  placeholder="title, company, city, tag..."
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
                  <option value="recent">Newest first</option>
                  <option value="company">Company A-Z</option>
                  <option value="remote">Remote first</option>
                </select>
              </div>
            </div>

            <div className="toggle-row">
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
              <label className="toggle" htmlFor="saved-only">
                <input
                  id="saved-only"
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(event) =>
                    startTransition(() => setSavedOnly(event.target.checked))
                  }
                  disabled={bookmarks.length === 0}
                />
                <span>Saved only ({bookmarks.length})</span>
              </label>
            </div>

            <div className="controls__footer" aria-live="polite">
              <span className="controls__count">
                <strong>{formatCount(filteredJobs.length)}</strong> of{' '}
                {formatCount(jobs.length)} job{jobs.length === 1 ? '' : 's'} match the filters
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={resetFilters}
                disabled={!filtersActive}
              >
                Clear filters
              </button>
            </div>
            <p className="controls__hint">
              The four boxes above never touch the network. Only the three tabs at the
              top do.
            </p>
          </div>

          <div className="workspace__grid">
            <section className="results" aria-label="Job list">
              <div className="results__heading">
                <h2>Jobs</h2>
                <span>Click a row for the full posting</span>
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
                  <strong>
                    {savedOnly ? 'No saved jobs match these filters.' : 'Nothing matches.'}
                  </strong>
                  <p>
                    {savedOnly
                      ? 'Turn off "Saved only" or change the other filters.'
                      : 'Try a shorter search, a different job type, or clear the filters.'}
                  </p>
                </div>
              )}

              {status === 'success' &&
                filteredJobs.map((job) => (
                  <JobRow
                    key={job.slug}
                    job={job}
                    isActive={activeJob?.slug === job.slug}
                    isBookmarked={bookmarkSet.has(job.slug)}
                    onSelect={setSelectedSlug}
                    onToggleBookmark={toggleBookmark}
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
                    <div className="detail__head-actions">
                      <button
                        type="button"
                        className={`star star--lg${activeIsBookmarked ? ' star--on' : ''}`}
                        onClick={() => toggleBookmark(activeJob.slug)}
                        aria-pressed={activeIsBookmarked}
                        aria-label={
                          activeIsBookmarked ? 'Remove from saved' : 'Save for later'
                        }
                      >
                        <StarIcon filled={activeIsBookmarked} />
                      </button>
                      <span
                        className={`badge${activeJob.remote ? ' badge--remote' : ''}`}
                      >
                        {activeJob.remote ? 'Remote' : 'On-site'}
                      </span>
                    </div>
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
                        {activeJob.jobTypes.map(formatJobType).join(', ') ||
                          'Not specified by the employer'}
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
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => toggleBookmark(activeJob.slug)}
                    >
                      {activeIsBookmarked ? 'Unsave' : 'Save for later'}
                    </button>
                  </div>
                </>
              ) : status === 'loading' ? (
                <div className="placeholder">
                  <strong>Loading</strong>
                  <p>Details show up after the first response lands.</p>
                </div>
              ) : (
                <div className="placeholder">
                  <strong>Pick a job</strong>
                  <p>Click any row on the left to see the full description here.</p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section id="guide" className="guide" aria-label="REST notes">
          <div className="guide__head">
            <h2>What we say in Part 1</h2>
            <p>
              The provider, the URL, the verb, the format, and the two query parameters
              we wire into the UI tabs. Same info, condensed for the slide.
            </p>
          </div>

          <div className="guide__grid">
            <Fact
              label="Provider"
              value={API_PROVIDER}
              note="Free public job board run by Arbeitnow. No API key, no rate-limit headers we have to negotiate."
            />
            <Fact
              label="Base resource"
              value={API_ROOT_URL + API_RESOURCE_PATH}
              note="Stands for the whole jobs collection. We hit it straight from the browser."
            />
            <Fact
              label="Method"
              value="GET"
              note="The verb fits because we never change the server's state. We just read."
            />
            <Fact
              label="Representation"
              value="application/json"
              note="JSON comes back ready to map into the cards on the left. Single representation, no Accept negotiation."
            />
            <Fact
              label="?page=2"
              value={API_QUERY_PAGE2}
              note="Pagination. Same resource, second page. Live in the middle tab."
            />
            <Fact
              label="?visa_sponsorship=true"
              value={API_QUERY_VISA}
              note="Server-side filter. Useful for the half of our class planning to leave the country anyway."
            />
          </div>
        </section>
      </div>

      <footer className="footnote">
        <p>
          Built for COM4381 by Osama Abujarad (1202883) and Iyas Qasqas (1220248), Birzeit
          University. Source on{' '}
          <a
            href="https://github.com/osama-2000236/com4381-assignment1-arbeitnow-job-explorer"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </footer>
    </main>
  )
}

export default App
