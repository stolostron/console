/* Copyright Contributors to the Open Cluster Management project */

export default function TogglePlay({ active, onClick }) {
  return (
    <button data-testid="toggle-play" onClick={onClick}>
      {active ? 'Pause' : 'Play'}
    </button>
  )
} 