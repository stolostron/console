/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Stack, Text } from '@patternfly/react-core'
import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmLoadingPage } from '../../../../ui-components'
import { useGroupDetailsContext } from './GroupPage'

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
        <PageSection>
          <div>{t('Group not found')}</div>
        </PageSection>
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
