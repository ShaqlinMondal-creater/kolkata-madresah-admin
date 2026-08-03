import { Link } from 'react-router-dom'
import {
  content,
  getCopyrightText,
  navLinks,
  site,
} from '@/config/appConfig'

export default function BrandPanel() {
  const home = content.home

  return (
    <div className="brand-panel">
      <div className="brand-panel__hero">
        <img
          src={site.headerImage}
          alt="Kolkata Madresah"
          className="brand-panel__hero-img"
        />
        <div className="brand-panel__hero-shade" />
      </div>

      <div className="brand-panel__content">
        <p className="brand-panel__kicker">{home.kicker}</p>
        <h1 className="brand-panel__title">{home.title}</h1>
        <p className="brand-panel__lead">
          {home.leadBeforeSup}
          <sup>{home.leadSup}</sup>
        </p>

        <nav className="brand-panel__links" aria-label="Public site links">
          {navLinks.map((item) =>
            item.type === 'internal' ? (
              <Link key={item.to} to={item.to} className="brand-panel__link">
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="brand-panel__link"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <p className="brand-panel__contact">
          {home.queriesPrefix}{' '}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </p>
        <p className="brand-panel__copyright">{getCopyrightText()}</p>
      </div>
    </div>
  )
}
