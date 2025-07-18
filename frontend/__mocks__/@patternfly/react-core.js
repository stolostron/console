/* Copyright Contributors to the Open Cluster Management project */

export function EmptyState({ title, children }) {
  return (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function PageSection({ children }) {
  return <div data-testid="page-section">{children}</div>
}

export function Spinner() {
  return <div data-testid="spinner">Loading...</div>
} 