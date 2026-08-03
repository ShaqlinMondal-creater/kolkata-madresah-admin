import { Link } from 'react-router-dom'
import { site } from '@/config/appConfig'
import SiteFooter from '@/components/layout/SiteFooter'

export default function ContentLayout({ title, children, wide = false }) {
  return (
    <div className="static-page">
      <header className="static-page__hero">
        <img src={site.headerImage} alt="" className="static-page__hero-img" />
        <div className="static-page__hero-shade" />
        <div className="static-page__hero-copy">
          <Link to="/" className="static-page__back">
            ← Back to home
          </Link>
          <p className="static-page__brand">{site.name}</p>
          <h1 className="static-page__title">{title}</h1>
        </div>
      </header>

      <main className={`static-page__main${wide ? ' static-page__main--wide' : ''}`}>
        <div className="static-page__card">{children}</div>
      </main>

      <SiteFooter />
    </div>
  )
}
