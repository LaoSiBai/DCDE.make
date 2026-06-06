export default function Footer() {
  return (
    <footer style={{ padding: '0 var(--spacing-page)' }}>
      <div className="dcde-rule-solid mb-6" />
      <div className="flex items-center justify-between py-6">
        <p className="dcde-caption text-ink-faint">
          © {new Date().getFullYear()} DCDE
        </p>
        <a
          href="https://dcde.club"
          target="_blank"
          rel="noopener noreferrer"
          className="dcde-caption text-ink-faint hover:text-accent transition-colors"
        >
          dcde.club
        </a>
      </div>
    </footer>
  )
}
