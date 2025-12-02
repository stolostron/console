/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'

/**
 * Validates the project name field
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
  return undefined
}
