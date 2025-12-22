/* Copyright Contributors to the Open Cluster Management project */
import { generatePath, Outlet, useLocation, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'
import { useCurrentRole } from '../RolesPage'

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
      <>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton component="a" href={NavigationPath.identitiesUsers} style={{ marginRight: '10px' }}>
              {t('button.backToUsers')}
            </AcmButton>
          }
        />
      </>
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
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'user-mgmt-roles-details',
                  title: t('Details'),
                  isActive: isDetailsActive,
                  to: generatePath(NavigationPath.roleDetails, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-roles-permissions',
                  title: t('Permissions'),
                  isActive: isPermissionsActive,
                  to: generatePath(NavigationPath.rolePermissions, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-roles-role-assignments',
                  title: t('Role assignments'),
                  isActive: isRoleAssignmentsActive,
                  to: generatePath(NavigationPath.roleRoleAssignments, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-roles-yaml',
                  title: t('YAML'),
                  isActive: isYamlActive,
                  to: generatePath(NavigationPath.roleYaml, { id: id ?? '' }),
                },
              ]}
            />
          }
        />
      }
    >
      <Outlet />
    </AcmPage>
  )
}

export { RolePage }
