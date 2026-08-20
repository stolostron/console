/* Copyright Contributors to the Open Cluster Management project */

import { Alert, List, ListComponent, ListItem, OrderType, Title } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'
import InstructionCommand from './InstructionCommand'

export const StepEnableAutoImport = () => {
  const [t] = useTranslation()

  return (
    <>
      <Title headingLevel="h3">
        {t('Enable auto import so that provisioned clusters are automatically registered with ACM.')}
      </Title>

      <List component={ListComponent.ol} type={OrderType.number}>
        <ListItem className="pf-v6-u-mb-lg">
          {t(
            'Edit the ClusterManager resource to enable the ClusterImporter and ManagedClusterAutoApproval feature gates.'
          )}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand className="pf-v6-u-mt-md">oc edit ClusterManager cluster-manager</InstructionCommand>
          <Alert
            variant="info"
            isInline
            isPlain
            className="pf-v6-u-mt-md"
            title={t(
              'Add a registrationConfiguration section under spec with ClusterImporter and ManagedClusterAutoApproval feature gates set to Enable, and add an autoApproveUsers entry for system:serviceaccount:multicluster-engine:agent-registration-bootstrap.'
            )}
          />
        </ListItem>

        <ListItem>
          {t('Bind the CAPI manager permission to the import controller by applying the following ClusterRoleBinding.')}
          <InstructionCommand textAriaLabel="Apply ClusterRoleBinding for CAPI import" className="pf-v6-u-mt-md">
            {`cat <<EOF | oc apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-manager-registration-capi
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: capi-operator-manager-role
subjects:
- kind: ServiceAccount
  name: registration-controller-sa
  namespace: open-cluster-management-hub
EOF`}
          </InstructionCommand>
        </ListItem>
      </List>
    </>
  )
}
