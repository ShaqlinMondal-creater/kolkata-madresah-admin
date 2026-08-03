import ContentLayout from '@/components/layout/ContentLayout'
import { content } from '@/config/appConfig'

export default function AboutUs() {
  const page = content.about

  return (
    <ContentLayout title={page.title}>
      {page.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </ContentLayout>
  )
}
