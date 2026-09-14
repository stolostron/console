/* Copyright Contributors to the Open Cluster Management project */

import { Alert, List, ListComponent, ListItem, OrderType, Title } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'
import InstructionCommand from './InstructionCommand'

export const StepEnableClusterAPI = () => {
  const [t] = useTranslation()

  return (
    <>
      <Title headingLevel="h3">
        {t('Enable Cluster API (CAPI) and Cluster API Provider AWS (CAPA) in the MultiClusterEngine resource.')}
      </Title>

      <List component={ListComponent.ol} type={OrderType.number}>
        <ListItem className="pf-v6-u-mb-lg">
          {t('Verify that the MultiClusterEngine custom resource exists.')}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand className="pf-v6-u-mt-md">oc get multiclusterengine</InstructionCommand>
        </ListItem>

        <ListItem className="pf-v6-u-mb-lg">
          {t(
            'Edit the MultiClusterEngine to enable the cluster-api and cluster-api-provider-aws components. Hypershift components must be disabled before enabling these.'
          )}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand className="pf-v6-u-mt-md">
            oc edit multiclusterengine multiclusterengine
          </InstructionCommand>
          <Alert
            variant="info"
            isInline
            isPlain
            className="pf-v6-u-mt-md"
            title={t(
              'Set enabled: true for cluster-api and cluster-api-provider-aws, and enabled: false for hypershift and hypershift-local-hosting.'
            )}
          />
        </ListItem>

        <ListItem>
          {t('Verify the CAPI and CAPA controller deployments are running.')}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand textAriaLabel="Verify CAPI and CAPA deployments" className="pf-v6-u-mt-md">
            oc get deploy -n multicluster-engine capi-controller-manager capa-controller-manager
          </InstructionCommand>
        </ListItem>
      </List>
    </>
  )
}
