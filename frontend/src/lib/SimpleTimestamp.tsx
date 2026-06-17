/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { useTranslation } from './acm-i18next'

interface SimpleTimestampProps {
  timestamp: string | number | Date
}

export const SimpleTimestamp: React.FC<SimpleTimestampProps> = ({ timestamp }) => {
  const { t } = useTranslation()
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return <>{t('Invalid Date')}</>
  }

  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const hour = date.getHours() % 12 || 12
  const minute = date.getMinutes().toString().padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'

  const formattedDate = `${month} ${day}, ${year}, ${hour}:${minute} ${ampm}`

  return <>{formattedDate}</>
}

export default SimpleTimestamp
