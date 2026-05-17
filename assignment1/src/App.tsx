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
      aria-label="شعار بيدر"
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
          {job.remote ? 'عن بُعد' : 'حضوري / هجين'}
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
          new Intl.DateTimeFormat('ar-PS', {
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
            : 'تعذر تحميل الوظائف حالياً. حاول مرة أخرى بعد قليل.',
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
            <strong>بيدر للوظائف</strong>
            <span>Arabic RTL REST Explorer</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="التنقل الرئيسي">
          <a href="#jobs">استكشف الوظائف</a>
          <a href="#rest-guide">شرح REST</a>
          <a href="https://www.arbeitnow.com/api/job-board-api" target="_blank" rel="noreferrer">
            افتح الـ API
          </a>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <span className="eyebrow">مشروع COM4381 - استهلاك REST API حقيقي</span>
          <h1>مستكشف وظائف عربي يجلب بيانات حقيقية مباشرة من Arbeitnow</h1>
          <p>
            هذه الواجهة مبنية بـ <strong>React + Vite</strong> وتستهلك خدمة REST حقيقية عبر
            <code>GET</code> ثم تتيح للطالب أو الخريج تصفية النتائج محلياً بدون استدعاءات زائدة.
          </p>

          <div className="hero-panel__actions">
            <a className="primary-link" href="#jobs">
              ابدأ الاستكشاف
            </a>
            <a className="secondary-link" href="#rest-guide">
              شاهد شرح REST
            </a>
          </div>
        </div>

        <aside className="hero-panel__highlight">
          <span className="status-pill status-pill--live">Live API</span>
          <strong>{API_PROVIDER}</strong>
          <p>المزوّد يعرض فرص عمل عامة بصيغة JSON ويمكن الوصول إليه من الواجهة مباشرة.</p>
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

      <section className="stats-grid" aria-label="ملخص البيانات">
        <StatCard
          label="الوظائف المتاحة"
          value={formatCount(jobs.length)}
          hint="تم جلبها مرة واحدة من الواجهة الحية"
        />
        <StatCard
          label="الشركات"
          value={formatCount(companyCount)}
          hint="عدد الجهات التي ظهرت في الصفحة الحالية"
        />
        <StatCard
          label="عن بُعد"
          value={formatCount(remoteCount)}
          hint="مناسب للطلاب والخريجين الباحثين عن مرونة"
        />
        <StatCard
          label="الوسوم"
          value={formatCount(tagCount)}
          hint="تفيد في فهم التخصصات والمهارات المطلوبة"
        />
      </section>

      <section className="api-status-panel" aria-label="حالة الاتصال">
        <div>
          <span className={`status-pill${status === 'success' ? ' status-pill--live' : ''}`}>
            {status === 'loading'
              ? 'جار التحميل'
              : status === 'success'
                ? 'الاتصال ناجح'
                : 'يوجد خطأ'}
          </span>
          <strong>حالة جلب البيانات</strong>
          <p>
            {status === 'loading'
              ? 'يتم الآن تحميل البيانات الحقيقية من خدمة Arbeitnow.'
              : status === 'success'
                ? `آخر تحديث: ${lastUpdated}`
                : errorMessage}
          </p>
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={() => startTransition(() => setReloadToken((value) => value + 1))}
        >
          إعادة التحميل من الـ API
        </button>
      </section>

      <section id="jobs" className="workspace">
        <div className="workspace__controls">
          <fieldset className="query-switch">
            <legend>طلب REST المستخدم الآن</legend>
            <label>
              <input
                type="radio"
                name="query-mode"
                value="recent"
                checked={queryMode === 'recent'}
                onChange={() => startTransition(() => setQueryMode('recent'))}
              />
              <span>أحدث الوظائف</span>
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
            <label htmlFor="search">ابحث بالعنوان أو الشركة أو الموقع</label>
            <input
              id="search"
              type="search"
              value={searchQuery}
              placeholder="مثال: developer أو berlin"
              onChange={(event) =>
                startTransition(() => setSearchQuery(event.target.value))
              }
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="job-type">نوع الوظيفة</label>
              <select
                id="job-type"
                value={jobType}
                onChange={(event) =>
                  startTransition(() => setJobType(event.target.value))
                }
              >
                <option value="all">كل الأنواع</option>
                {availableJobTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatJobType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="sort-mode">الترتيب</label>
              <select
                id="sort-mode"
                value={sortMode}
                onChange={(event) =>
                  startTransition(() => setSortMode(event.target.value as SortMode))
                }
              >
                <option value="recent">الأحدث أولاً</option>
                <option value="company">بحسب اسم الشركة</option>
                <option value="remote">عن بُعد أولاً</option>
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
            <span>عرض الوظائف التي تشير إلى العمل عن بُعد فقط</span>
          </label>

          <div className="workspace__summary">
            <strong>{formatCount(filteredJobs.length)} نتيجة مرئية</strong>
            <span>التصفية محلية بعد تحميل واحد فقط لتقليل الطلبات على الواجهة.</span>
          </div>
        </div>

        <div className="workspace__content">
          <section className="results-panel" aria-label="قائمة الوظائف">
            <div className="section-heading">
              <h2>قائمة الفرص</h2>
              <p>اختر أي بطاقة لعرض التفاصيل والانتقال إلى صفحة التقديم الأصلية.</p>
            </div>

            {status === 'loading' && (
              <div className="panel-message">
                <strong>جار تحميل الوظائف...</strong>
                <p>ننتظر الاستجابة الحية من المورد ثم سنفعل التصفية والفرز داخل المتصفح.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="panel-message panel-message--error">
                <strong>تعذر إكمال الطلب</strong>
                <p>{errorMessage}</p>
              </div>
            )}

            {status === 'success' && filteredJobs.length === 0 && (
              <div className="panel-message">
                <strong>لا توجد نتائج مطابقة</strong>
                <p>غيّر كلمات البحث أو ألغِ مرشح العمل عن بُعد لتوسيع النتائج.</p>
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

          <aside className="detail-panel" aria-label="تفاصيل الوظيفة">
            <div className="section-heading">
              <h2>تفاصيل مختارة</h2>
              <p>هذا السيناريو مفيد لطالب أو خريج يراجع الفرص بسرعة ثم ينتقل للرابط الأصلي.</p>
            </div>

            {activeJob ? (
              <article className="detail-card">
                <div className="detail-card__title-row">
                  <div>
                    <h3>{activeJob.title}</h3>
                    <span>{activeJob.companyName}</span>
                  </div>
                  <span className={`job-badge${activeJob.remote ? ' job-badge--accent' : ''}`}>
                    {activeJob.remote ? 'Remote' : 'On-site / Hybrid'}
                  </span>
                </div>

                <dl className="detail-card__facts">
                  <div>
                    <dt>الموقع</dt>
                    <dd>{activeJob.location}</dd>
                  </div>
                  <div>
                    <dt>نُشرت في</dt>
                    <dd>{formatPostedDate(activeJob.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>أنواع الوظيفة</dt>
                    <dd>{activeJob.jobTypes.map(formatJobType).join('، ') || 'غير محدد'}</dd>
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
                    افتح صفحة التقديم الأصلية
                  </a>
                  <a
                    className="secondary-link"
                    href={API_ROOT_URL + API_RESOURCE_PATH + API_DEMO_QUERY}
                    target="_blank"
                    rel="noreferrer"
                  >
                    مثال حي على page=2
                  </a>
                </div>
              </article>
            ) : (
              <div className="panel-message">
                <strong>اختر وظيفة من القائمة</strong>
                <p>ستظهر هنا التفاصيل الكاملة بمجرد تحديد بطاقة من النتائج.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section id="rest-guide" className="rest-guide">
        <div className="section-heading">
          <h2>كيف يحقق المشروع مبادئ REST في العرض الصفي</h2>
          <p>
            هذا القسم مخصص للشرح أثناء العرض: من هو المزوّد، ما المورد، كيف نرسل الطلب، وما
            نوع البيانات التي نحصل عليها.
          </p>
        </div>

        <div className="rest-guide__grid">
          <RestFact
            title="مزوّد الخدمة"
            value={API_PROVIDER}
            description="خدمة عامة لعرض فرص العمل، وتسمح باستهلاك البيانات عبر مورد واحد واضح."
          />
          <RestFact
            title="المورد الأساسي"
            value={API_ROOT_URL + API_RESOURCE_PATH}
            description="يمثل قائمة الوظائف كمورد يمكن استدعاؤه مباشرة من العميل."
          />
          <RestFact
            title="الفعل HTTP"
            value="GET"
            description="نستخدم GET لأننا نسترجع بيانات فقط ولا نرسل تعديلات للخادم."
          />
          <RestFact
            title="تمثيل الاستجابة"
            value="application/json"
            description="الاستجابة تعود بصيغة JSON، ثم نحوّلها إلى بطاقات وتفاصيل قابلة للعرض."
          />
          <RestFact
            title="معامل الاستعلام"
            value={API_DEMO_QUERY}
            description="يستخدم لتبديل الصفحة في الاستعراض العملي داخل Postman أو المتصفح."
          />
          <RestFact
            title="معامل عملي إضافي"
            value={API_VISA_QUERY}
            description="يعرض وظائف رعاية التأشيرة كما يوضح توثيق Arbeitnow، وهو مدمج داخل الواجهة."
          />
          <RestFact
            title="سيناريو الاستخدام"
            value="طالب أو خريج يبحث عن فرصة"
            description="يفتح الواجهة، يراجع الفرص، يفلتر النتائج، ثم ينتقل لصفحة التقديم الأصلية."
          />
        </div>
      </section>
    </main>
  )
}

export default App
