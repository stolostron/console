/* Copyright Contributors to the Open Cluster Management project */

import { Grid } from '@mui/material'
import {
  Alert,
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Skeleton,
  Title,
} from '@patternfly/react-core'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { fleetResourceRequest } from '../../../resources/utils/fleet-resource-request'
import { ResultsTableData } from '../policies/policy-details/PolicyDetailsResults'
import { CodeBlock } from './CodeBlock'
import { TemplateDetailTitle } from './TemplateDetailTitle'

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

      fleetResourceRequest('GET', cluster, {
        apiVersion,
        kind,
        name: templateName,
      })
        .then((res: any) => {
          if (ignore) {
            return
          }
          if ('errorMessage' in res) {
            setTemplateErr(res.errorMessage)
          } else {
            setRelatedObjs(res.status?.relatedObjects)
          }
          hasInitialFetch.current = true
          setIsFetching(false)
        })
        .catch((err) => {
          if (ignore) {
            return
          }
          console.error('Error getting resource: ', err)
          setTemplateErr(err)
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

      <Modal variant={ModalVariant.large} isOpen={isModalOpen} onClose={handleModalToggle}>
        <ModalHeader>
          <Content>
            <Title headingLevel="h1">
              <TemplateDetailTitle policyKind={item.kind} templateName={item.templateName} compliant="NonCompliant" />
            </Title>
          </Content>
        </ModalHeader>
        <ModalBody tabIndex={0} aria-label={t('scrollable policy differences')}>
          {isFetching && (
            <div
              style={{ height: '300px', overflowY: 'hidden', marginTop: '30px', flexFlow: 'column', display: 'flex' }}
            >
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
                    <Title headingLevel="h2" style={{ marginBottom: 10 }}>
                      {t('Difference for the {{kind}} {{resource}}', {
                        kind: rOjb.object?.kind,
                        resource: `${
                          rOjb.object?.metadata?.namespace ? rOjb.object?.metadata?.namespace + '/' : ''
                        }${rOjb.object?.metadata?.name}`,
                      })}
                    </Title>
                    <CodeBlock>{rOjb.properties?.diff}</CodeBlock>
                  </Grid>
                ) : (
                  <></>
                )
              )}
            </Grid>
          )}
        </ModalBody>
        <ModalFooter>
          <Button key="Cancel" variant="primary" onClick={handleModalToggle}>
            {t('Close')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
