/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useState } from 'react'
import { ActionGroup, ButtonVariant } from '@patternfly/react-core'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmDrawer, AcmDrawerContext } from './AcmDrawer'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmKubernetesLabelsInput } from '../AcmLabelsInput/AcmLabelsInput'
import { AcmPage } from '../AcmPage/AcmPage'

export default {
  title: 'Drawer',
  component: AcmDrawer,
}

export const Drawer = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [labels, setLabels] = useState<Record<string, string> | undefined>({
    cloud: 'Amazon',
    clusterID: '1b1ghj3c-3a94-4fd3-awec-f3asdfsdff3',
    name: 'local-cluster',
    vendor: 'OpenShift',
  })
  return (
    <>
      <AcmDrawer
        title="Edit Labels"
        isExpanded={isExpanded}
        onCloseClick={() => setIsExpanded(false)}
        panelContent={
          <div>
            <p>
              Labels help you organize and select resources. Adding labels allows you to query for objects by using the
              labels. Selecting labels during policy and application creation allows you to distribute your resources to
              different clusters that share common labels.
            </p>
            <AcmForm style={{ marginTop: '24px' }}>
              <AcmKubernetesLabelsInput
                label="local-cluster labels"
                id="labels-input"
                value={labels}
                onChange={(labels) => setLabels(labels)}
              />
            </AcmForm>
            <ActionGroup style={{ marginTop: '24px' }}>
              <AcmButton onClick={() => setIsExpanded(!isExpanded)}>Save</AcmButton>
              <AcmButton onClick={() => setIsExpanded(!isExpanded)} variant={ButtonVariant.link}>
                Cancel
              </AcmButton>
            </ActionGroup>
          </div>
        }
      >
        <div style={{ height: '100vh' }}>
          <AcmButton onClick={() => setIsExpanded(!isExpanded)}>Open drawer</AcmButton>
        </div>
      </AcmDrawer>
    </>
  )
}

export const DrawerUsingAcmPageContext = () => {
  const [labels, setLabels] = useState<Record<string, string> | undefined>({
    cloud: 'Amazon',
    clusterID: '1b1ghj3c-3a94-4fd3-awec-f3asdfsdff3',
    name: 'local-cluster',
    vendor: 'OpenShift',
  })
  return (
    <AcmPage header={<Fragment />} hasDrawer={true}>
      <AcmDrawerContext.Consumer>
        {({ setDrawerContext }) => (
          <div style={{ height: '100vh' }}>
            <AcmButton
              onClick={() =>
                setDrawerContext({
                  isExpanded: true,
                  title: 'Edit labels',
                  onCloseClick: () => setDrawerContext(undefined),
                  panelContent: (
                    <div>
                      <p>
                        Labels help you organize and select resources. Adding labels allows you to query for objects by
                        using the labels. Selecting labels during policy and application creation allows you to
                        distribute your resources to different clusters that share common labels.
                      </p>
                      <AcmForm style={{ marginTop: '24px' }}>
                        <AcmKubernetesLabelsInput
                          label="local-cluster labels"
                          id="labels-input"
                          value={labels}
                          onChange={(labels) => setLabels(labels)}
                        />
                      </AcmForm>
                      <ActionGroup style={{ marginTop: '24px' }}>
                        <AcmButton onClick={() => setDrawerContext(undefined)}>Save</AcmButton>
                        <AcmButton onClick={() => setDrawerContext(undefined)} variant={ButtonVariant.link}>
                          Cancel
                        </AcmButton>
                      </ActionGroup>
                    </div>
                  ),
                })
              }
            >
              Open drawer
            </AcmButton>
          </div>
        )}
      </AcmDrawerContext.Consumer>
    </AcmPage>
  )
}
