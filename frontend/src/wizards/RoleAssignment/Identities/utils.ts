/* Copyright Contributors to the Open Cluster Management project */

export function validateIdentityIdentifier(value: string, errorMessage: string): string | undefined {
  if (!value || value.trim() === '') {
    return errorMessage
  }
  return undefined
}
