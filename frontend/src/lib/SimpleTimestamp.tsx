/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'

interface SimpleTimestampProps {
  timestamp: string | number | Date
  relative?: boolean
}

export const SimpleTimestamp: React.FC<SimpleTimestampProps> = ({ timestamp, relative }) => {
  const date = new Date(timestamp)

  if (isNaN(date.getTime())) {
    return <>Invalid Date</>
  }

  if (relative) {
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()

    const diffInSeconds = Math.round(diffInMs / 1000)
    const diffInMinutes = Math.round(diffInSeconds / 60)
    const diffInHours = Math.round(diffInMinutes / 60)
    const diffInDays = Math.round(diffInHours / 24)

    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

    let formattedTime: string
    if (Math.abs(diffInSeconds) < 60) {
      formattedTime = formatter.format(diffInSeconds, 'seconds')
    } else if (Math.abs(diffInMinutes) < 60) {
      formattedTime = formatter.format(diffInMinutes, 'minutes')
    } else if (Math.abs(diffInHours) < 24) {
      formattedTime = formatter.format(diffInHours, 'hours')
    } else {
      formattedTime = formatter.format(diffInDays, 'days')
    }

    return <>{formattedTime}</>
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
