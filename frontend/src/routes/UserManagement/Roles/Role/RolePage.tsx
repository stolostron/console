/* Copyright Contributors to the Open Cluster Management project */
import { useParams, useLocation, Link, Outlet, generatePath } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useCurrentRole } from '../RolesPage'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem, AcmButton } from '../../../../ui-components'
import { NavigationPath } from '../../../../NavigationPath'
import { Page } from '@patternfly/react-core'
import { ErrorPage } from '../../../../components/ErrorPage'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'

const RolePage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()
  const role = useCurrentRole()

  const isDetailsActive = location.pathname === generatePath(NavigationPath.roleDetails, { id: id ?? '' })
  const isPermissionsActive = location.pathname.includes('/permissions')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isYamlActive = location.pathname.includes('/yaml')

  if (!role) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton component="a" href={NavigationPath.identitiesUsers} style={{ marginRight: '10px' }}>
              {t('button.backToUsers')}
            </AcmButton>
          }
        />
      </Page>
    )
  }
  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={role?.metadata.name}
          description={`ClusterRole`}
          breadcrumb={[
            { text: t('User Management'), to: NavigationPath.roles },
            { text: t('Roles'), to: NavigationPath.roles },
            { text: role?.metadata.name ?? t('Unknown Role') },
          ]}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isDetailsActive}>
                <Link to={generatePath(NavigationPath.roleDetails, { id: id ?? '' })}>{t('Details')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isPermissionsActive}>
                <Link to={generatePath(NavigationPath.rolePermissions, { id: id ?? '' })}>{t('Permissions')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                <Link to={generatePath(NavigationPath.roleRoleAssignments, { id: id ?? '' })}>
                  {t('Role assignments')}
                </Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isYamlActive}>
                <Link to={generatePath(NavigationPath.roleYaml, { id: id ?? '' })}>{t('YAML')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Outlet />
    </AcmPage>
  )
}

export { RolePage }
