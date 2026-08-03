import ContentLayout from '@/components/layout/ContentLayout'
import { content } from '@/config/appConfig'

export default function PrivacyPolicy() {
  const page = content.privacy

  return (
    <ContentLayout title={page.title}>
      <p>{page.intro}</p>

      <ol className="static-list">
        {page.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <p>{page.closing}</p>
    </ContentLayout>
  )
}
