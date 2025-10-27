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
import { AcmButton } from '../../../../ui-components'
import { useGroupDetailsContext } from './GroupPage'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
// TODO: trigger sonar issue
const GroupDetails = () => {
  const { t } = useTranslation()
  const { group } = useGroupDetailsContext()

  if (!group) {
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
  }

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

export { GroupDetails }
