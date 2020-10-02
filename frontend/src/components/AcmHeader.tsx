import {
    Avatar,
    Brand,
    Button,
    ButtonVariant,
    Nav,
    NavItem,
    NavList,
    Page,
    PageHeader,
    PageHeaderTools,
    PageHeaderToolsGroup,
    PageHeaderToolsItem,
    PageSidebar,
} from '@patternfly/react-core'
import '@patternfly/react-core/dist/styles/base.css'
import imgAvatar from '@patternfly/react-core/src/components/Avatar/examples/avatarImg.svg'
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import React from 'react'
import imgBrand from '../RHACM-Logo.svg'

export enum NavItemE {
    home = '/home',
    overview = '/overview',
    topology = '/topology',
    clusterManagement = '/cluster-management',
    manageApps = '/manageApps',
    grc = '/grc',
}

export function AcmHeaderTools() {
    return (
        <PageHeaderTools>
            <PageHeaderToolsGroup
                visibility={{
                    default: 'hidden',
                    lg: 'visible',
                }} /** the settings and help icon buttons are only visible on desktop sizes and replaced by a kebab dropdown for other sizes */
            >
                <PageHeaderToolsItem>
                    <Button aria-label="Settings actions" variant={ButtonVariant.plain}>
                        <CogIcon />
                    </Button>
                </PageHeaderToolsItem>
                <PageHeaderToolsItem>
                    <Button aria-label="Help actions" variant={ButtonVariant.plain}>
                        <HelpIcon />
                    </Button>
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>

            <Avatar src={imgAvatar} alt="Avatar image" />
        </PageHeaderTools>
    )
}
export function AcmHeader(props: { children: React.ReactNode; activeItem: NavItemE }) {
    const PageNav = (
        <Nav aria-label="Nav">
            <NavList>
                <NavItem to={NavItemE.home} isActive={props.activeItem === NavItemE.home}>
                    Home
                </NavItem>
                <NavItem to={NavItemE.overview} isActive={props.activeItem === NavItemE.overview}>
                    Overview
                </NavItem>
                <NavItem to={NavItemE.topology} isActive={props.activeItem === NavItemE.topology}>
                    Topology
                </NavItem>
                <NavItem to={NavItemE.clusterManagement} isActive={props.activeItem === NavItemE.clusterManagement}>
                    Cluster Management
                </NavItem>
                <NavItem to={NavItemE.manageApps} isActive={props.activeItem === NavItemE.manageApps}>
                    Manage Applications
                </NavItem>
                <NavItem to={NavItemE.grc} isActive={props.activeItem === NavItemE.grc}>
                    Governance and risk
                </NavItem>
            </NavList>
        </Nav>
    )

    const Header = (
        <PageHeader
            headerTools={<AcmHeaderTools />}
            logo={<Brand src={imgBrand} alt="Advanced" />}
            showNavToggle
        ></PageHeader>
    )
    const Sidebar = <PageSidebar nav={PageNav} />

    return (
        <Page
            header={Header}
            sidebar={Sidebar}
            isManagedSidebar
            defaultManagedSidebarIsOpen={false}
            style={{ height: '100vh' }}
        >
            {props.children}
        </Page>
    )
}
