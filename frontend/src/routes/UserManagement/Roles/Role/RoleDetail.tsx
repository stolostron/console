/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core'
import { useNavigate } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton } from '../../../../ui-components'
import { useCurrentRole } from '../RolesPage'

const RoleDetail = () => {
  const { t } = useTranslation()
  const role = useCurrentRole()
  const navigate = useNavigate()

  if (!role) {
    return (
      <>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton onClick={() => navigate(NavigationPath.roles)} style={{ marginRight: '10px' }}>
              {t('button.backToRoles')}
            </AcmButton>
          }
        />
      </>
    )
  }

  return (
    <PageSection hasBodyWrapper={false}>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h3">{t('General information')}</Title>
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

export { RoleDetail }
