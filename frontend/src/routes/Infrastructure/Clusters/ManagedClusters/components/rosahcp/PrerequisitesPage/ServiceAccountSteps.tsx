/* Copyright Contributors to the Open Cluster Management project */

import {
  Card,
  CardBody,
  CardTitle,
  List,
  ListComponent,
  ListItem,
  OrderType,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../lib/doc-util'
import { getTypedCreateCredentialsPath } from '../../../../../../Credentials/CreateCredentialsCatalog'
import { Provider } from '../../../../../../../ui-components'
import { Link } from 'react-router'

export const ServiceAccountSteps = () => {
  const [t] = useTranslation()

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h2">{t('RedHat service account prerequisites')}</Title>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <List component={ListComponent.ol} type={OrderType.number}>
              <ListItem className="pf-v6-u-mb-lg">
                {t('To create a ROSA HCP cluster, a Red Hat service account is required. ')}
                <a target="_blank" rel="noreferrer" href={DOC_LINKS.ROSA_SERVICE_ACCOUNT}>
                  {t('Create a service account')}
                </a>{' '}
                {t('before starting cluster creation.')}
              </ListItem>
              <ListItem className="pf-v6-u-mb-lg">
                {t('After creating a service account, please add it to your Advanced Cluser Manager credentials. ')}
                <Link to={getTypedCreateCredentialsPath(Provider.redhatcloud)}>{t('Add credentials')}</Link>
              </ListItem>
            </List>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  )
}
