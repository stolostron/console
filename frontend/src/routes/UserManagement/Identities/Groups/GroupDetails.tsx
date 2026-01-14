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
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton } from '../../../../ui-components'
import { useGroupDetailsContext } from './GroupPage'

const GroupDetails = () => {
  const { t } = useTranslation()
  const { group } = useGroupDetailsContext()

  if (!group) {
    return (
      <>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton component="a" href={NavigationPath.identitiesGroups} style={{ marginRight: '10px' }}>
              {t('button.backToGroups')}
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
