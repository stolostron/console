/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { makeStyles } from '@mui/styles'
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { Fragment, useEffect, useReducer, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  createUserPreference,
  patchUserPreference,
  SavedSearch,
  UserPreference,
} from '../../../../../resources/userpreference'
import { AcmAlert, AcmButton, AcmForm, AcmModal, AcmTextArea, AcmTextInput } from '../../../../../ui-components'
import { useSuggestedQueryTemplates } from '../SuggestedQueryTemplates'

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

export const SaveAndEditSearchModal = (props: {
  savedSearch: SavedSearch | undefined
  onClose: () => void
  setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
  savedSearchQueries: SavedSearch[]
  userPreference?: UserPreference
  setUserPreference: React.Dispatch<React.SetStateAction<UserPreference | undefined>>
}) => {
  const { savedSearch, onClose, setSelectedSearch, savedSearchQueries, userPreference, setUserPreference } = props
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(reducer, initState)
  const { searchName, searchDesc } = state
  const [updateError, setUpdateError] = useState<string | undefined>()
  const [isNameConflict, setIsNameConflict] = useState<boolean>(false)
  const classes = useStyles()

  useEffect(() => {
    dispatch({ field: 'searchName', value: savedSearch?.name ?? '' })
    dispatch({ field: 'searchDesc', value: savedSearch?.description ?? '' })
    return () => {
      setIsNameConflict(false)
    }
  }, [savedSearch])

  function reducer(state: IState, { field, value }: ActionType) {
    return {
      ...state,
      [field]: value,
    }
  }

  const suggestedQueryTemplates = useSuggestedQueryTemplates().templates ?? ([] as SavedSearch[])

  function onChange(value: string, e: React.FormEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) {
    const allSavedQueryNames = [...suggestedQueryTemplates, ...savedSearchQueries].map(
      (savedQuery: SavedSearch) => savedQuery.name?.toLowerCase() || ''
    )
    if (allSavedQueryNames.includes(value.toLowerCase()) && savedSearch?.name.toLowerCase() !== value.toLowerCase()) {
      setIsNameConflict(true)
    } else if (isNameConflict) {
      setIsNameConflict(false)
    }
    dispatch({ field: e.currentTarget.name, value: value })
  }

  function setRequestError(err: any) {
    if (err && err.message) {
      setUpdateError(err.message)
    } else {
      setUpdateError('There was an error while performing the delete request.')
    }
  }

  function savedSearchSuccess() {
    props.onClose()
    if (window.location.search !== '') {
      // only update the current saved search if the search has been run
      setSelectedSearch(searchName)
    }
  }

  function CreateUpdateSavedSearch() {
    const id = savedSearch && savedSearch.id ? savedSearch.id : Date.now().toString()
    const searchText = (savedSearch && savedSearch.searchText) ?? ''
    setUpdateError(undefined)
    if (!userPreference) {
      createUserPreference([
        {
          id: id,
          name: searchName,
          description: searchDesc,
          searchText: searchText,
        },
      ])
        .then((res) => {
          setUserPreference(res)
          savedSearchSuccess()
        })
        .catch((err: any) => {
          setRequestError(err)
        })
    } else {
      patchUserPreference(userPreference, 'replace', {
        id: id,
        name: searchName,
        description: searchDesc,
        searchText: searchText,
      })
        .then((res) => {
          setUserPreference(res)
          savedSearchSuccess()
        })
        .catch((err: any) => {
          setRequestError(err)
        })
    }
  }

  const isSubmitDisabled = () => {
    return state.searchName === '' || !savedSearch || isNameConflict
  }

  return (
    <Fragment>
      <AcmModal
        variant={ModalVariant.small}
        isOpen={savedSearch !== undefined}
        title={t('Save search')}
        onClose={() => {
          onClose()
          setUpdateError(undefined)
        }}
        actions={[
          <AcmButton
            isDisabled={isSubmitDisabled()}
            key="confirm"
            variant={ButtonVariant.primary}
            onClick={CreateUpdateSavedSearch}
          >
            {t('Save')}
          </AcmButton>,
          <AcmButton
            key="cancel"
            variant={ButtonVariant.link}
            onClick={() => {
              onClose()
              setUpdateError(undefined)
            }}
          >
            {t('Cancel')}
          </AcmButton>,
        ]}
      >
        {
          <p className={classes.prompt}>
            {t('Name your search and provide a description so that you can access it in the future.')}
          </p>
        }
        {!savedSearch && (
          <AcmAlert noClose variant={'danger'} isInline={true} title={t('Error')} subtitle={t('Enter search text')} />
        )}
        {updateError && (
          <AcmAlert data-testid={'edit-saved-search-error'} noClose variant={'danger'} title={updateError} />
        )}
        {isNameConflict && (
          <AcmAlert
            isInline
            noClose
            variant={'warning'}
            title={t('A saved search query is already using the name {{searchName}}. Please choose a different name.', {
              searchName,
            })}
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
