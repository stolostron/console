/* Copyright Contributors to the Open Cluster Management project */
import { Page, PageSection, Stack, Text } from '@patternfly/react-core'
import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmButton, AcmLoadingPage } from '../../../../ui-components'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { useRolesContext, useCurrentRole } from '../RolesPage'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useNavigate } from 'react-router-dom-v5-compat'

const RoleDetail = () => {
  const { t } = useTranslation()
  const { loading } = useRolesContext()
  const role = useCurrentRole()
  const navigate = useNavigate()

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !role:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton role="link" onClick={() => navigate(NavigationPath.roles)} style={{ marginRight: '10px' }}>
                {t('button.backToRoles')}
              </AcmButton>
            }
          />
        </Page>
      )
    default:
      return (
        <PageSection>
          <PageSection variant={'light'}>
            <Text style={{ fontFamily: 'RedHatDisplay', marginBottom: '2rem' }}>{t('General information')}</Text>
            <Stack hasGutter>
              <DescriptionList isHorizontal={false}>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                  <DescriptionListDescription>{role.metadata.name ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Created At')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {role.metadata.creationTimestamp ? (
                      <AcmTimestamp timestamp={role.metadata.creationTimestamp} simple={true} />
                    ) : (
                      '-'
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Stack>
          </PageSection>
        </PageSection>
      )
  }
}

export { RoleDetail }
