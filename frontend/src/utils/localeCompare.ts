/* Copyright Contributors to the Open Cluster Management project */
export function localeCompare(a?: string, b?: string) {
  return (a ?? '').localeCompare(b ?? '')
}
