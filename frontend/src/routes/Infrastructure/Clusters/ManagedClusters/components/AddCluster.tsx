/* Copyright Contributors to the Open Cluster Management project */
import { AcmButton, AcmDropdown } from '../../../../../ui-components'
import { ActionList, ActionListItem, Bullseye } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Link, useNavigate } from 'react-router-dom-v5-compat'
import { canUser } from '../../../../../lib/rbac-util'
import {
  getBackCancelLocationLinkProps,
  navigateToBackCancelLocation,
  NavigationPath,
} from '../../../../../NavigationPath'
import { ManagedClusterDefinition } from '../../../../../resources'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../lib/doc-util'

export function AddCluster(props: { type: 'button' | 'dropdown'; buttonType?: 'primary' | 'link' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
  useEffect(() => {
    const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
    canCreateManagedCluster.promise
      .then((result) => setCanCreateCluster(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canCreateManagedCluster.abort()
  }, [])

  if (props.type === 'button') {
    return (
      <div>
        <Bullseye>
          <ActionList>
            <ActionListItem>
              <AcmButton
                component={Link}
                isDisabled={!canCreateCluster}
                tooltip={t('rbac.unauthorized')}
                variant={props.buttonType ?? 'primary'}
                {...getBackCancelLocationLinkProps(NavigationPath.createCluster)}
              >
                {t('managed.createCluster')}
              </AcmButton>
            </ActionListItem>
            <ActionListItem>
              <AcmButton
                component={Link}
                isDisabled={!canCreateCluster}
                tooltip={t('rbac.unauthorized')}
                variant={props.buttonType ?? 'primary'}
                {...getBackCancelLocationLinkProps(NavigationPath.importCluster)}
              >
                {t('managed.importCluster')}
              </AcmButton>
            </ActionListItem>
          </ActionList>
        </Bullseye>
        <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
      </div>
    )
  } else {
    const onSelect = (id: string) => {
      switch (id) {
        case 'create-cluster':
          navigateToBackCancelLocation(navigate, NavigationPath.createCluster)
          break
        case 'import-cluster':
          navigateToBackCancelLocation(navigate, NavigationPath.importCluster)
          break
      }
    }
    return (
      <div>
        <AcmDropdown
          dropdownItems={[
            {
              id: 'create-cluster',
              text: t('managed.createCluster'),
              isAriaDisabled: !canCreateCluster,
              tooltip: !canCreateCluster ? t('rbac.unauthorized') : '',
            },
            {
              id: 'import-cluster',
              text: t('managed.importCluster'),
              isAriaDisabled: !canCreateCluster,
              tooltip: !canCreateCluster ? t('rbac.unauthorized') : '',
            },
          ]}
          text={t('managed.addCluster')}
          onSelect={onSelect}
          id="cluster-actions"
          isKebab={false}
          isPrimary={true}
        />
        <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
      </div>
    )
  }
}
