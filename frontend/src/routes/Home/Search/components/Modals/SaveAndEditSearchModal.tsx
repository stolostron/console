/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import '@patternfly/react-core/dist/styles/base.css'
import React, { Fragment, useReducer, useEffect, useState } from 'react'
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import {
    AcmModal,
    AcmButton,
    AcmForm,
    AcmTextInput,
    AcmTextArea,
    AcmAlert,
} from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { SavedSearchesDocument, useSaveSearchMutation, UserSearch } from '../../search-sdk/search-sdk'
import { searchClient } from '../../search-sdk/search-client'
import SuggestQueryTemplates from '../SuggestedQueryTemplates'
import { makeStyles } from '@material-ui/styles'

type IState = {
    searchName: string
    searchDesc: string
}

type ActionType = {
    field: string
    value: string
}

const initState = {
    searchName: '',
    searchDesc: '',
}

const useStyles = makeStyles({
    prompt: {
        paddingBottom: '1.5rem',
    },
})

export const SaveAndEditSearchModal = (props: any) => {
    const { t } = useTranslation()
    const [state, dispatch] = useReducer(reducer, initState)
    const { searchName, searchDesc } = state
    const [saveSearchMutation, { error }] = useSaveSearchMutation({ client: searchClient })
    const [isError, setIsError] = useState<boolean>(false)
    const [isNameConflict, setIsNameConflict] = useState<boolean>(false)
    const classes = useStyles()

    useEffect(() => {
        dispatch({ field: 'searchName', value: props.editSearch?.name ?? '' })
        dispatch({ field: 'searchDesc', value: props.editSearch?.description ?? '' })
        return () => {
            setIsNameConflict(false)
        }
    }, [props.editSearch])

    useEffect(() => {
        dispatch({ field: 'searchName', value: '' })
        dispatch({ field: 'searchDesc', value: '' })
        return () => {
            setIsNameConflict(false)
        }
    }, [props.saveSearch])

    function reducer(state: IState, { field, value }: ActionType) {
        return {
            ...state,
            [field]: value,
        }
    }

    function onChange(value: string, e: React.FormEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        const suggestedQueryTemplates = SuggestQueryTemplates?.templates ?? ([] as UserSearch[])
        const allSavedQueryNames = [...suggestedQueryTemplates, ...props.savedSearchQueries].map(
            (savedQuery: UserSearch) => savedQuery.name?.toLowerCase() || ''
        )
        if (
            allSavedQueryNames.includes(value.toLowerCase()) &&
            props.editSearch?.name.toLowerCase() !== value.toLowerCase()
        ) {
            setIsNameConflict(true)
        } else if (isNameConflict) {
            setIsNameConflict(false)
        }
        dispatch({ field: e.currentTarget.name, value: value })
    }

    function SaveSearch() {
        let id = props.editSearch ? props.editSearch.id : Date.now().toString()
        let searchText = props.editSearch ? props.editSearch.searchText : props.saveSearch
        props.editSearch ?? props.setSelectedSearch(searchName)
        saveSearchMutation({
            variables: {
                resource: {
                    id: id,
                    name: searchName,
                    description: searchDesc,
                    searchText: searchText,
                },
            },
            refetchQueries: [{ query: SavedSearchesDocument }],
        }).then((res) => {
            if (res.errors) {
                setIsError(true)
                return null
            }
            props.onClose()
            return null
        })
    }

    const isSubmitDisabled = () => {
        return state.searchName === '' || (!props.editSearch && props.saveSearch === '') || isNameConflict
    }

    return (
        <Fragment>
            <AcmModal
                variant={ModalVariant.small}
                isOpen={props.editSearch !== undefined || props.saveSearch !== undefined}
                title={t('Save search')}
                onClose={props.onClose}
                actions={[
                    <AcmButton
                        isDisabled={isSubmitDisabled()}
                        key="confirm"
                        variant={ButtonVariant.primary}
                        onClick={SaveSearch}
                    >
                        {t('Save')}
                    </AcmButton>,
                    <AcmButton key="cancel" variant={ButtonVariant.link} onClick={props.onClose}>
                        {t('Cancel')}
                    </AcmButton>,
                ]}
            >
                {
                    <p className={classes.prompt}>
                        {t('Name your search and provide a description so that you can access it in the future.')}
                    </p>
                }
                {props.saveSearch === '' && !props.editSearch && (
                    <AcmAlert
                        noClose
                        variant={'danger'}
                        isInline={true}
                        title={t('Error')}
                        subtitle={t('Enter search text')}
                    />
                )}
                {isError && <AcmAlert noClose variant={'danger'} title={error!.message} />}
                {isNameConflict && (
                    <AcmAlert
                        isInline
                        noClose
                        variant={'warning'}
                        title={t(
                            // TODO - Handle interpolation
                            'A saved search query is already using the name {{searchName}}. Please choose a different name.',
                            { searchName }
                        )}
                    />
                )}
                <AcmForm>
                    <AcmTextInput
                        id="add-query-name"
                        name="searchName"
                        label={t('Search name (50 character limit)')}
                        value={searchName}
                        onChange={onChange}
                        maxLength={50}
                        placeholder={t('Enter a name for this search query')}
                        isRequired={true}
                    />
                    <AcmTextArea
                        id="add-query-desc"
                        name="searchDesc"
                        label={t('Description (120 character limit)')}
                        value={searchDesc}
                        onChange={onChange}
                        required
                        maxLength={120}
                        placeholder={t('Optional: Enter a description for this search query')}
                    />
                </AcmForm>
            </AcmModal>
        </Fragment>
    )
}
