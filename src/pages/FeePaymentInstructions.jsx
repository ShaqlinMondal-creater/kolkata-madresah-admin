import ContentLayout from '@/components/layout/ContentLayout'
import { content, site } from '@/config/appConfig'

export default function FeePaymentInstructions() {
  const page = content.fees

  return (
    <ContentLayout title={page.title} wide>
      <p className="static-lead">{page.greeting}</p>
      <p>{page.intro}</p>

      <h3 className="static-heading">{page.firstAccessHeading}</h3>

      {page.firstAccessSteps.map((step, index) => (
        <div className="static-step" key={step.title}>
          <span className="static-step__num">{index + 1}</span>
          <div>
            <h4>{step.title}</h4>
            {step.body ? <p>{step.body}</p> : null}

            {step.showCodes ? (
              <>
                <p className="static-subhead">{page.madresahCodesTitle}</p>
                <ul className="static-codes">
                  {page.madresahCodes.map((item) => (
                    <li key={item.code}>
                      <b>{item.code}</b> - {item.name}
                    </li>
                  ))}
                </ul>
                <p>
                  {step.passwordNote.split('{password}')[0]}
                  <code>{page.defaultPassword}</code>
                  {step.passwordNote.split('{password}')[1]}
                </p>
              </>
            ) : null}

            {step.linkLabel ? (
              <p>
                {step.bodyBeforeLink}{' '}
                <a href={site.studentLogin} target="_blank" rel="noreferrer">
                  {step.linkLabel}
                </a>{' '}
                {step.bodyAfterLink}
              </p>
            ) : null}
          </div>
        </div>
      ))}

      <hr className="static-divider" />

      <h3 className="static-heading">{page.afterLoginHeading}</h3>

      {page.paySteps.map((step, index) => (
        <div className="static-step" key={step.title}>
          <span className="static-step__num">{index + 1}</span>
          <div>
            <h4>{step.title}</h4>
            {step.body ? <p>{step.body}</p> : null}
            {step.bodyWithEmail ? (
              <p>
                {step.bodyBeforeEmail}{' '}
                <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
              </p>
            ) : null}
          </div>
        </div>
      ))}

      <div className="static-note">
        <p>
          <b>{page.noteTitle}</b>
        </p>
        <p>{page.noteBody}</p>
      </div>
    </ContentLayout>
  )
}
