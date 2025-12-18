/* Copyright Contributors to the Open Cluster Management project */
import { Title, Content } from '@patternfly/react-core'

interface GranularityStepContentProps {
  title: string
  description: string
}

export const GranularityStepContent = ({ title, description }: GranularityStepContentProps) => {
  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {title}
      </Title>
      <Content component="p" style={{ marginTop: '8px' }}>
        {description}
      </Content>
    </div>
  )
}
