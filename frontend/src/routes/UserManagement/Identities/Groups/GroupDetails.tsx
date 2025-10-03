/* Copyright Contributors to the Open Cluster Management project */
import {
  Page,
  PageSection,
  Stack,
  Text,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmButton, AcmLoadingPage } from '../../../../ui-components'
import { useGroupDetailsContext } from './GroupPage'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'

const GroupDetails = () => {
  const { t } = useTranslation()
  const { group, loading } = useGroupDetailsContext()

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !group:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton component="a" href={NavigationPath.identitiesGroups} style={{ marginRight: '10px' }}>
                {t('button.backToGroups')}
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
                  <DescriptionListTerm>{t('Group name')}</DescriptionListTerm>
                  <DescriptionListDescription>{group.metadata.name ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Stack>
          </PageSection>
        </PageSection>
      )
  }
}

export { GroupDetails }
