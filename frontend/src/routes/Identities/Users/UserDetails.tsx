/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Stack, Text } from '@patternfly/react-core'
import { DescriptionList, DescriptionListTerm, DescriptionListGroup, DescriptionListDescription } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useQuery } from '../../../lib/useQuery'
import { listUsers } from '../../../resources/rbac'
import { useMemo } from 'react'
import AcmTimestamp from '../../../lib/AcmTimestamp'
import { AcmLoadingPage } from '../../../ui-components'

const UserDetails = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading } = useQuery(listUsers)

  const user = useMemo(() => {
    if (!users || !id) return undefined
    return users.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [users, id])

  if (loading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (!user) {
    return (
      <PageSection>
        <div>{t('User not found')}</div>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSection variant={'light'}>
        <Text style={{ fontSize: '1.25rem', fontFamily: 'RedHatDisplay' }} component={'h2'}>
          {t('General information')}
        </Text>
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
          </DescriptionList>
        </Stack>
      </PageSection>
    </PageSection>
  )
}

export { UserDetails } 