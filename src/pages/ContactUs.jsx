import ContentLayout from '@/components/layout/ContentLayout'
import { content, site } from '@/config/appConfig'

export default function ContactUs() {
  const page = content.contact

  return (
    <ContentLayout title={page.title}>
      <div className="static-contact">
        <p className="static-contact__org">
          <b>{page.org}</b>
        </p>

        <div className="static-contact__grid">
          <div className="static-contact__item">
            <span className="static-contact__label">{page.labels.address}</span>
            <p>
              {page.addressLines[0]}
              <br />
              {page.addressLines[1]}
            </p>
          </div>

          <div className="static-contact__item">
            <span className="static-contact__label">{page.labels.email}</span>
            <p>
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </p>
          </div>

          <div className="static-contact__item">
            <span className="static-contact__label">{page.labels.phone}</span>
            <p>{page.phone}</p>
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}
