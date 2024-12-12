/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'

interface SimpleTimestampProps {
  timestamp: string | number | Date
}

export const SimpleTimestamp: React.FC<SimpleTimestampProps> = ({ timestamp }) => {
  const date = new Date(timestamp)

  let formattedDate = date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  formattedDate = formattedDate.replace(' am', ' AM').replace(' pm', ' PM')
  return <>{formattedDate}</>
}

export default SimpleTimestamp
