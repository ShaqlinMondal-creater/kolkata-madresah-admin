import { Link } from 'react-router-dom'
import { site } from '@/config/appConfig'
import SiteFooter from '@/components/layout/SiteFooter'

export default function NotFoundPage() {
  return (
    <div className="static-page not-found-page">
      <header className="static-page__hero">
        <img src={site.headerImage} alt="" className="static-page__hero-img" />
        <div className="static-page__hero-shade" />
        <div className="static-page__hero-copy">
          <Link to="/" className="static-page__back">
            ← Back to home
          </Link>
          <p className="static-page__brand">{site.name}</p>
          <h1 className="static-page__title">Page not found</h1>
        </div>
      </header>

      <main className="static-page__main">
        <div className="static-page__card not-found-page__card">
          <p className="not-found-page__code" aria-hidden="true">
            404
          </p>
          <p className="static-lead">This page does not exist</p>
          <p>
            The link may be broken, mistyped, or the page may have been moved.
            Check the URL, or go back to a known page.
          </p>
          <div className="not-found-page__actions">
            <Link
              to="/"
              className="not-found-page__btn not-found-page__btn--primary"
            >
              Go to login
            </Link>
            <Link to="/about-us" className="not-found-page__btn">
              About us
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
