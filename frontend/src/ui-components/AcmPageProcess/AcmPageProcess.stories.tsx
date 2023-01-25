/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmPageProcess } from './AcmPageProcess'
import { AcmButton } from '../AcmButton/AcmButton'

export default {
  title: 'PageProcess',
  component: AcmPageProcess,
  argTypes: {
    loadingTitle: { type: 'string' },
    loadingMessage: { type: 'string' },
    successTitle: { type: 'string' },
    successMessage: { type: 'string' },
  },
}

export const PageProcess = (args: any) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000)
  }, [])

  return (
    <AcmPageProcess
      {...args}
      isLoading={isLoading}
      loadingPrimaryAction={
        <AcmButton variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right">
          View logs
        </AcmButton>
      }
      primaryAction={<AcmButton>Back to Cluster management</AcmButton>}
      secondaryActions={
        <>
          <AcmButton variant="link">Create a new cluster</AcmButton>
          <AcmButton variant="link">Import a new cluster</AcmButton>
        </>
      }
    />
  )
}

PageProcess.args = {
  loadingTitle: 'Your cluster is in the process of being destroyed',
  loadingMessage: 'Do not click away from this page until it has finished destroying',
  successTitle: 'Cluster was successfully destroyed',
  successMessage:
    'The cluster was successfully destroyed, you can choose to go back to your Clusters list or create a new cluster.',
}
