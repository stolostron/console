/* Copyright Contributors to the Open Cluster Management project */
import { Title, Content } from '@patternfly/react-core'
import { ReactNode } from 'react'

interface GranularityStepContentProps {
  title: string
  description: string | string[]
  action?: ReactNode
  titleSize?: 'xl' | 'lg'
}

export const GranularityStepContent = ({
  title,
  description,
  action,
  titleSize = 'xl',
}: GranularityStepContentProps) => {
  const descriptions = Array.isArray(description) ? description : [description]

  return (
    <div>
      {action ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <Title headingLevel="h2" size={titleSize}>
            {title}
          </Title>
          {action}
        </div>
      ) : (
        <Title headingLevel="h2" size={titleSize}>
          {title}
        </Title>
      )}
      {descriptions.map((desc, index) => (
        <Content
          key={index}
          component="p"
          style={{
            marginTop: index === 0 && !action ? '8px' : undefined,
            marginBottom: index === descriptions.length - 1 ? '16px' : '8px',
          }}
        >
          {desc}
        </Content>
      ))}
    </div>
  )
}
