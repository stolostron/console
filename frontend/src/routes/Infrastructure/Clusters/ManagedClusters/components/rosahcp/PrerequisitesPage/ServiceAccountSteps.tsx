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
import { Trans, useTranslation } from '../../../../../../../lib/acm-i18next'
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
                <Trans
                  i18nKey="To create a ROSA HCP cluster, a Red Hat service account is required. <serviceAccountLink>Create a service account</serviceAccountLink> before starting cluster creation."
                  components={{
                    serviceAccountLink: (
                      <a target="_blank" href={DOC_LINKS.ROSA_SERVICE_ACCOUNT}>
                        {}
                      </a>
                    ),
                  }}
                />
              </ListItem>
              <ListItem className="pf-v6-u-mb-lg">
                <Trans
                  i18nKey="After creating a service account, please add it to your Red Hat Advanced Cluster Management for Kubernetes credentials. <addCredentialLink>Add credential.</addCredentialLink>"
                  components={{
                    addCredentialLink: <Link to={getTypedCreateCredentialsPath(Provider.redhatcloud)}>{}</Link>,
                  }}
                />
              </ListItem>
            </List>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  )
}
