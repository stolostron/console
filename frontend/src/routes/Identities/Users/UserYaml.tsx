/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useQuery } from '../../../lib/useQuery'
import { listUsers } from '../../../resources/rbac'
import { useMemo, useState, useEffect } from 'react'
import { dump } from 'js-yaml'
import YamlEditor from '../../../components/YamlEditor'
import { AcmLoadingPage } from '../../../ui-components'

const UserYaml = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading } = useQuery(listUsers)
  const [editorHeight, setEditorHeight] = useState<number>(500)

  const user = useMemo(() => {
    if (!users || !id) return undefined
    return users.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [users, id])

  useEffect(() => {
    function handleResize() {
      let editorHeight = window.innerHeight - 260
      const globalHeader = document.getElementsByClassName('co-global-notification')
      if (globalHeader.length > 0) {
        editorHeight = editorHeight - globalHeader.length * 33
      }

      setEditorHeight(editorHeight)
    }
    handleResize()

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show loading spinner while data is being fetched
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
      <YamlEditor resourceYAML={dump(user, { indent: 2 })} readOnly={true} height={editorHeight} />
    </PageSection>
  )
}

export { UserYaml }
