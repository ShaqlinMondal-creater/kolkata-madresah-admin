import { Link } from 'react-router-dom'
import { footerLinks, getCopyrightText } from '@/config/appConfig'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer__nav" aria-label="Footer">
        {footerLinks.map((item, index) => (
          <span key={item.to} className="site-footer__item">
            {index > 0 ? <span className="site-footer__dot">·</span> : null}
            <Link to={item.to}>{item.label}</Link>
          </span>
        ))}
      </nav>
      <p className="site-footer__copy">{getCopyrightText()}</p>
    </footer>
  )
}
