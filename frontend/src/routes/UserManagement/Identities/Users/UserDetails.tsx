/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Stack, Text } from '@patternfly/react-core'
import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { AcmLoadingPage } from '../../../../ui-components'
import { useUserDetailsContext } from './UserPage'

const UserDetails = () => {
  const { t } = useTranslation()
  const { user, loading } = useUserDetailsContext()

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !user:
      return (
        <PageSection>
          <div>{t('User not found')}</div>
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
                  <DescriptionListTerm>{t('Full name')}</DescriptionListTerm>
                  <DescriptionListDescription>{user.fullName ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Username')}</DescriptionListTerm>
                  <DescriptionListDescription>{user.metadata.name ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Last login')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {user.metadata.creationTimestamp ? (
                      <AcmTimestamp timestamp={user.metadata.creationTimestamp} />
                    ) : (
                      '-'
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Identity Provider')}</DescriptionListTerm>
                  <DescriptionListDescription>{user.identities ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Stack>
          </PageSection>
        </PageSection>
      )
  }
}

export { UserDetails }
