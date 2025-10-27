/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  PageSection,
  Stack,
  Text,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useUserDetailsContext } from './UserPage'

const UserDetails = () => {
  const { t } = useTranslation()
  const { user } = useUserDetailsContext()

  if (!user) {
    return (
      <PageSection>
        <div>{t('User not found')}</div>
      </PageSection>
    )
  }
  // TODO: trigger sonar issue
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
            {/* TODO: add 'last login' column once 'last login' is implemented */}
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

export { UserDetails }
