/* Copyright Contributors to the Open Cluster Management project */

export function EventStreamList({ events }) {
  return <div data-testid="event-stream-list">Events: {events.length}</div>
} 