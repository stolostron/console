/* Copyright Contributors to the Open Cluster Management project */

import { Alert, List, ListComponent, ListItem, OrderType, Title } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'
import InstructionCommand from './InstructionCommand'

export const StepConfigureAWSCredentials = () => {
  const [t] = useTranslation()

  return (
    <>
      <Title headingLevel="h3">
        {t('Configure AWS credentials for the CAPA controller so it can provision AWS resources.')}
      </Title>

      <List component={ListComponent.ol} type={OrderType.number}>
        <ListItem className="pf-v6-u-mb-lg">
          {t('Update the capa-manager-bootstrap-credentials secret with your AWS credentials.')}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand className="pf-v6-u-mt-md">
            oc edit secret -n multicluster-engine capa-manager-bootstrap-credentials
          </InstructionCommand>
          <Alert
            variant="info"
            isInline
            isPlain
            className="pf-v6-u-mt-md"
            title={t(
              'Set the data.credentials field to your base64-encoded AWS credentials containing aws_access_key_id, aws_secret_access_key, and region.'
            )}
          />
        </ListItem>

        <ListItem>
          {t('Restart the CAPA controller to pick up the new credentials.')}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand textAriaLabel="Restart CAPA controller manager" className="pf-v6-u-mt-md">
            oc rollout restart deployment capa-controller-manager -n multicluster-engine
          </InstructionCommand>
        </ListItem>
      </List>
    </>
  )
}
