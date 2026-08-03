import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/services/analyticsApi'
import { getAcademicYears } from '@/services/academicYearApi'
import DonutChart from '@/components/charts/DonutChart'
import {
  IconFees,
  IconStudents,
  IconTransaction,
} from '@/components/icons/AdminIcons'

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })
}

function MoneyValue({ value, loading }) {
  if (loading) return '—'
  return (
    <span className="money-value">
      <small>₹</small>
      {formatMoney(value)}
    </span>
  )
}

const emptyStats = {
  ay_id: '',
  ay_name: '',
  ay_current: false,
  total_students: 0,
  male_count: 0,
  female_count: 0,
  total_paid: 0,
  total_due: 0,
}

export default function DashboardPage() {
  const [years, setYears] = useState([])
  const [ayId, setAyId] = useState('')
  const [stats, setStats] = useState(emptyStats)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadYears() {
      setLoadingYears(true)
      setError('')
      try {
        const res = await getAcademicYears()
        if (!alive) return

        if (Number(res.status) === 200 && res.data?.years) {
          setYears(res.data.years)
          const defaultId = res.data.current_ay_id || res.data.years[0]?.ay_id
          if (defaultId) setAyId(String(defaultId))
        } else {
          setError(res.message || 'Could not load academic seasons.')
        }
      } catch {
        if (alive) setError('Season list is unavailable. Please try again.')
      } finally {
        if (alive) setLoadingYears(false)
      }
    }

    loadYears()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!ayId) return

    let alive = true

    async function loadStats() {
      setLoadingStats(true)
      setError('')
      try {
        const res = await getDashboardStats(ayId)
        if (!alive) return

        if (Number(res.status) === 200 && res.data) {
          setStats(res.data)
        } else {
          setError(res.message || 'Could not load dashboard summary.')
        }
      } catch {
        if (alive) setError('Dashboard data is unavailable. Please try again.')
      } finally {
        if (alive) setLoadingStats(false)
      }
    }

    loadStats()
    return () => {
      alive = false
    }
  }, [ayId])

  const loading = loadingYears || loadingStats
  const feeTotal = Number(stats.total_paid || 0) + Number(stats.total_due || 0)

  const cards = [
    {
      key: 'students',
      label: 'On-roll strength',
      value: formatCount(stats.total_students),
      hint: 'Active students this season',
      icon: IconStudents,
      tone: 'panel',
    },
    {
      key: 'male',
      label: 'Boys',
      value: formatCount(stats.male_count),
      hint: 'Male enrolment',
      icon: IconStudents,
      tone: 'gold',
    },
    {
      key: 'female',
      label: 'Girls',
      value: formatCount(stats.female_count),
      hint: 'Female enrolment',
      icon: IconStudents,
      tone: 'soft',
    },
    {
      key: 'paid',
      label: 'Fees collected',
      value: <MoneyValue value={stats.total_paid} loading={loading} />,
      hint: 'Net amount received',
      icon: IconFees,
      tone: 'paid',
      isMoney: true,
    },
    {
      key: 'due',
      label: 'Outstanding dues',
      value: <MoneyValue value={stats.total_due} loading={loading} />,
      hint: 'Net amount pending',
      icon: IconTransaction,
      tone: 'due',
      isMoney: true,
    },
  ]

  const studentSegments = [
    {
      label: 'Boys',
      value: stats.male_count,
      displayValue: formatCount(stats.male_count),
      color: '#c4a35a',
    },
    {
      label: 'Girls',
      value: stats.female_count,
      displayValue: formatCount(stats.female_count),
      color: '#16382e',
    },
  ]

  const feeSegments = [
    {
      label: 'Collected',
      value: stats.total_paid,
      displayValue: `₹ ${formatMoney(stats.total_paid)}`,
      color: '#1f5c42',
    },
    {
      label: 'Pending',
      value: stats.total_due,
      displayValue: `₹ ${formatMoney(stats.total_due)}`,
      color: '#b42318',
    },
  ]

  return (
    <section className="module-page dash-page">
      <header className="dash-page__head">
        <div>
          <h1 className="text-gold-gradient">Dashboard</h1>
          <p>
            Live snapshot of enrolment and fee collection for the selected
            academic season.
          </p>
        </div>

        <label className="dash-page__filter">
          <span>Academic season</span>
          <select
            value={ayId}
            onChange={(e) => setAyId(e.target.value)}
            disabled={loadingYears || !years.length}
          >
            {loadingYears || !years.length ? (
              <option value="">Loading seasons…</option>
            ) : (
              years.map((y) => (
                <option key={y.ay_id} value={String(y.ay_id)}>
                  {y.ay_name}
                  {y.ay_current ? ' · Current' : ''}
                </option>
              ))
            )}
          </select>
        </label>
      </header>

      {error ? <p className="dash-page__error">{error}</p> : null}

      <div className={`dash-stats${loading ? ' is-loading' : ''}`}>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.key}
              className={`dash-stat dash-stat--${card.tone}`}
            >
              <div className="dash-stat__top">
                <span className="dash-stat__icon">
                  <Icon />
                </span>
                <span className="dash-stat__label">{card.label}</span>
              </div>
              <p className="dash-stat__value">
                {loading && !card.isMoney ? '—' : card.value}
              </p>
              <p className="dash-stat__hint">{card.hint}</p>
            </article>
          )
        })}
      </div>

      <div className={`dash-charts${loading ? ' is-loading' : ''}`}>
        <article className="dash-chart-card">
          <header className="dash-chart-card__head">
            <h2>Student composition</h2>
            <p>Gender split of on-roll students for this season.</p>
          </header>
          <DonutChart
            segments={studentSegments}
            centerValue={loading ? '—' : formatCount(stats.total_students)}
            centerLabel="Students"
          />
        </article>

        <article className="dash-chart-card">
          <header className="dash-chart-card__head">
            <h2>Fee collection</h2>
            <p>Share of collected vs pending fees (net of concession).</p>
          </header>
          <DonutChart
            segments={feeSegments}
            centerValue={loading ? '—' : formatMoney(feeTotal)}
            centerLabel="₹ Net fees"
          />
        </article>
      </div>

      <div className="dash-page__note">
        <p>
          Viewing <strong>{stats.ay_name || '—'}</strong>
          {stats.ay_current ? ' (current season)' : ''}. Figures include
          on-roll students only. Fee amounts are shown after concession.
        </p>
      </div>
    </section>
  )
}
