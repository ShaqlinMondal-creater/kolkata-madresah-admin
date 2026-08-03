export default function ModulePlaceholder({ title, description }) {
  return (
    <section className="module-page">
      <header className="module-page__head">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="module-page__body">
        <p>This module is a placeholder. Content will be added next.</p>
      </div>
    </section>
  )
}
