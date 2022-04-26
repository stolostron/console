/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { AcmTable, AcmEmptyState, AcmTablePaginationContextProvider, AcmButton } from '@stolostron/ui-components'
import { TextContent, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { Link, useHistory } from 'react-router-dom'
import queryString from 'query-string'
import { ApplicationDefinition, IResource, Namespace } from '../../../resources'
import { DeleteResourceModal, IDeleteResourceModalProps } from './DeleteResourceModal'
import { NavigationPath } from '../../../NavigationPath'
import { Fragment, useEffect, useState } from 'react'
import { checkPermission, rbacCreate } from '../../../lib/rbac-util'
import { Trans } from '../../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../../lib/doc-util'

export interface IToggleSelectorProps<T = any> {
    keyFn: (item: T) => string
    modalProps: IDeleteResourceModalProps | { open: false }
    table: any
    t: TFunction
    namespaces: Namespace[]
}

export function ToggleSelector(props: IToggleSelectorProps) {
    const t = props.t
    const defaultOption = 'subscriptions'
    const options = [
        { id: 'subscriptions', title: 'Subscriptions' },
        { id: 'channels', title: 'Channels' },
        { id: 'placements', title: 'Placements' },
        { id: 'placementrules', title: 'Placement rules' },
    ]
    const [canCreateApplication, setCanCreateApplication] = useState<boolean>(false)
    const selectedId = getSelectedId({ location, options, defaultOption, queryParam: 'resources' })
    const selectedResources = _.get(props.table, `${selectedId}`)

    useEffect(() => {
        checkPermission(rbacCreate(ApplicationDefinition), setCanCreateApplication, props.namespaces)
    }, [props.namespaces])

    return (
        <AcmTablePaginationContextProvider localStorageKey="advanced-tables-pagination">
            <DeleteResourceModal {...props.modalProps} />
            <AcmTable<IResource>
                plural=""
                columns={selectedResources.columns}
                keyFn={props.keyFn}
                items={selectedResources.items}
                extraToolbarControls={
                    <QuerySwitcher
                        key="switcher"
                        options={options.map(({ id, title }) => ({
                            id,
                            /*
                                t('Subscriptions')
                                t('Channels')
                                t('Placements')
                                t('Placement rules')
                                */
                            contents: t(title),
                        }))}
                        defaultOption={defaultOption}
                    />
                }
                rowActionResolver={selectedResources.rowActionResolver}
                emptyState={
                    <AcmEmptyState
                        message={
                            selectedId === 'subscriptions' ? (
                                <Trans
                                    i18nKey={'advancedConfiguration.empty.subtitle'}
                                    components={{ italic: <em />, bold: <strong /> }}
                                />
                            ) : null
                        }
                        /*
                            t('You don\'t have any subscriptions')
                            t('You don\'t have any channels')
                            t('You don\'t have any placements')
                            t('You don\'t have any placement rules')
                            */
                        title={t(
                            `You don't have any ${options
                                .find((option) => option.id === selectedId)
                                ?.title.toLowerCase()}`
                        )}
                        action={
                            <Fragment>
                                {selectedId === 'subscriptions' && (
                                    <AcmButton
                                        isDisabled={!canCreateApplication}
                                        tooltip={!canCreateApplication ? t('rbac.unauthorized') : ''}
                                        component={Link}
                                        to={NavigationPath.createApplicationSubscription}
                                    >
                                        {t('Create application')}
                                    </AcmButton>
                                )}
                                <TextContent>{viewDocumentation(DOC_LINKS.MANAGE_APPLICATIONS, t)}</TextContent>
                            </Fragment>
                        }
                    />
                }
            />
        </AcmTablePaginationContextProvider>
    )
}

function QuerySwitcher(props: IQuerySwitcherInterface) {
    const { options, defaultOption, queryParam = 'resources' } = props
    const query = queryString.parse(location.search)
    const selectedId = getSelectedId({
        query,
        options,
        defaultOption,
        queryParam,
    })
    const history = useHistory()

    const isSelected = (id: string) => id === selectedId
    const handleChange = (_: any, event: any) => {
        const id = event.currentTarget.id
        if (queryParam) {
            query[queryParam] = id
        }
        const newQueryString = queryString.stringify(query)
        const optionalNewQueryString = newQueryString && `?${newQueryString}`
        history.replace(`${location.pathname}${optionalNewQueryString}${location.hash}`, { noScrollToTop: true })
    }

    return (
        <ToggleGroup>
            {options.map(({ id, contents }) => (
                <ToggleGroupItem
                    key={id}
                    buttonId={id}
                    isSelected={isSelected(id)}
                    onChange={handleChange}
                    text={contents}
                />
            ))}
        </ToggleGroup>
    )
}

function getSelectedId(props: ISelectedIds) {
    const { options, queryParam, defaultOption, location } = props
    let { query } = props
    if (!query) {
        query = location && queryString.parse(location.search)
    }
    const validOptionIds = options.map((o) => o.id)
    const isQueryParam = query && queryParam ? (query[queryParam] as string) : undefined
    const isValidOptionIds = isQueryParam ? validOptionIds.includes(isQueryParam) : false
    return queryParam && query && isValidOptionIds ? query[queryParam] : defaultOption
}

export interface IQuerySwitcherInterface {
    options: { id: string; contents: string }[]
    defaultOption: String
    queryParam?: string
}
export interface ISelectedIds {
    location?: Location
    options: { id: string; contents?: string }[]
    defaultOption: String
    queryParam?: string
    query?: queryString.ParsedQuery<string>
}
