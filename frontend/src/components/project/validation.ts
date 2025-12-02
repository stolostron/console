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
  if (value.length >= 255) {
    return t('Name must be less than 255 characters')
  }
  return undefined
}

/**
 * Validates the project display name field
 * @param value - The display name value to validate
 * @param t - Translation function
 * @returns Error message if validation fails, undefined if valid
 */
export const validateDisplayName = (value: string, t: TFunction): string | undefined => {
  if (value.length >= 255) {
    return t('Display name must be less than 255 characters')
  }
  return undefined
}

/**
 * Validates the project description field
 * @param value - The description value to validate
 * @param t - Translation function
 * @returns Error message if validation fails, undefined if valid
 */
export const validateDescription = (value: string, t: TFunction): string | undefined => {
  if (value.length >= 255) {
    return t('Description must be less than 255 characters')
  }
  return undefined
}
