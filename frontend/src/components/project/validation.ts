/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'

/**
 * Validates the project name field using RFC 1123 label requirements
 * @param value - The name value to validate
 * @param t - Translation function
 * @returns Error message if validation fails, undefined if valid
 */
export const validateName = (value: string, t: TFunction): string | undefined => {
  if (!value || value.trim() === '') {
    return t('Name is required')
  }
  if (value.length >= 64) {
    return t('Name must be less than 64 characters')
  }

  // RFC 1123 label validation: lowercase alphanumeric characters or '-',
  // must start and end with alphanumeric character
  const rfc1123Regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/
  if (!rfc1123Regex.test(value)) {
    return t(
      "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
    )
  }

  return undefined
}
