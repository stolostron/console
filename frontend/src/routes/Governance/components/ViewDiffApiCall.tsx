/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useRef, useState } from 'react'
import { fireManagedClusterView } from '../../../resources'
import { ResultsTableData } from '../policies/policy-details/PolicyDetailsResults'
import { useTranslation } from '../../../lib/acm-i18next'
import { Alert, Button, Divider, Skeleton, Title } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { Grid } from '@mui/material'
import { TemplateDetailTitle } from './TemplateDetailTitle'
import { CodeBlock } from './CodeBlock'

export function ViewDiffApiCall({ item }: Readonly<{ item: ResultsTableData }>) {
  const { templateName, apiVersion, kind, cluster } = item
  const [templateErr, setTemplateErr] = useState<string | undefined>()
  const [isFetching, setIsFetching] = useState<boolean>(true)
  const [relatedObjs, setRelatedObjs] = useState<any[]>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const hasInitialFetch = useRef<boolean>(false)

  const { t } = useTranslation()
  const handleModalToggle = () => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen)
  }
  useEffect(() => {
    let ignore = false

    if (isModalOpen || !hasInitialFetch.current) {
      setIsFetching(true)
      setTemplateErr(undefined)

      fireManagedClusterView(cluster, kind, apiVersion, templateName, cluster)
        .then((viewResponse) => {
          if (ignore) {
            return
          }

          if (viewResponse?.message) {
            setTemplateErr(viewResponse.message)
          } else {
            setRelatedObjs(viewResponse.result.status?.relatedObjects)
          }
          hasInitialFetch.current = true
        })
        .catch((err) => {
          if (ignore) {
            return
          }

          console.error('Error getting resource: ', err)
          setTemplateErr(err)
        })
        .finally(() => {
          if (ignore) {
            return
          }

          setIsFetching(false)
        })
    }

    return () => {
      ignore = true
    }
  }, [isModalOpen, kind, apiVersion, templateName, cluster, t])

  const isAllDiffEmpty = relatedObjs?.every((obj: any) => !obj.properties?.diff)
  const diffVisibility = isAllDiffEmpty ? 'hidden' : 'visible'
  const separatorVisibility = isAllDiffEmpty || isFetching ? 'hidden' : 'visible'
  const buttonWidth = '4em'

  return (
    <>
      <span style={{ visibility: separatorVisibility }}> {'-'} </span>
      <div style={{ display: 'inline-block' }}>
        {isFetching ? (
          <Skeleton width={buttonWidth} height="0.8em" screenreaderText={t('Loading diff')} />
        ) : (
          <Button
            variant="link"
            isInline
            onClick={handleModalToggle}
            style={{ visibility: diffVisibility, width: buttonWidth }}
          >
            {t('View diff')}
          </Button>
        )}
      </div>

      <Modal
        bodyAriaLabel="policy difference modal"
        tabIndex={0}
        header={
          <>
            <Title headingLevel="h1">
              <TemplateDetailTitle policyKind={item.kind} templateName={item.templateName} compliant="NonCompliant" />
            </Title>
            <Divider style={{ marginTop: '10px' }} />
            <Divider />
          </>
        }
        variant={ModalVariant.large}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="Cancel" variant="primary" onClick={handleModalToggle}>
            {t('Close')}
          </Button>,
        ]}
      >
        {isFetching && (
          <div style={{ height: '300px', overflowY: 'hidden', marginTop: '30px', flexFlow: 'column', display: 'flex' }}>
            <Skeleton
              style={{
                borderRadius: '6px',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d0d7de',
                flex: 1,
              }}
              screenreaderText={t('Loading Template diff')}
            />
          </div>
        )}
        {!isFetching && templateErr && <Alert variant="danger" title={templateErr} ouiaId="templateErrAlert" />}
        {!isFetching && relatedObjs && !templateErr && (
          <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>
            {relatedObjs?.map((rOjb: any) =>
              rOjb.properties?.diff ? (
                <Grid item key={rOjb.object?.kind + rOjb.object?.metadata.name}>
                  <Title
                    headingLevel="h2"
                    style={{ marginBottom: 10 }}
                  >{`${t('Difference for the')} ${rOjb.object?.kind} ${
                    rOjb.object?.metadata?.namespace ? rOjb.object?.metadata?.namespace + '/' : ''
                  }${rOjb.object?.metadata?.name}`}</Title>
                  <CodeBlock>{rOjb.properties?.diff}</CodeBlock>
                </Grid>
              ) : (
                <></>
              )
            )}
          </Grid>
        )}
      </Modal>
    </>
  )
}
