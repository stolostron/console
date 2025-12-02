import { Alert, Button, Flex, FlexItem } from '@patternfly/react-core'
import '../css/topology-toolbar.css'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import LegendView from '../../components/LegendView'
import noop from 'lodash/noop'
import ChannelControl from '../../components/ChannelControl'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useEffect, useState } from 'react'
import { TopologyProps } from '../Topology'
import { useQuerySearchDisabledManagedClusters } from '../../../../../../lib/search'
import { useQuery } from '../../../../../../lib/useQuery'

const TopologyToolbar: React.FC<TopologyProps> = (topologyProps) => {
  const { t } = useTranslation()
  const { channelControl, setDrawerContent, elements, hubClusterName } = topologyProps
  const [isSearchDisabled, setIsSearchDisabled] = useState<boolean>(false)
  const clusterNodes = elements.nodes.filter((node) => node.type === 'cluster')
  const clusterNames = clusterNodes.map((clusterNode) => clusterNode.name)
  const queryDisabled = useQuerySearchDisabledManagedClusters()
  const { data, startPolling } = useQuery(queryDisabled)

  useEffect(startPolling, [startPolling])

  useEffect(() => {
    const clustersWithSearchDisabled = data?.[0]?.data?.searchResult?.[0]?.items || []
    const clusterWithDisabledSearch = new Set(clustersWithSearchDisabled.map((item: { name: string }) => item.name))
    const found = clusterNames.some((r) => clusterWithDisabledSearch.has(r))
    if (found) {
      setIsSearchDisabled(true)
    }
  }, [data, clusterNames])
  return (
    <Flex style={{ width: '100%' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        {channelControl?.allChannels?.length > 1 && (
          <ChannelControl channelControl={channelControl} t={t} setDrawerContent={setDrawerContent} />
        )}
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }} />
      {isSearchDisabled && (
        <Alert
          variant="warning"
          title={t(
            'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
          )}
        >
          <Button
            variant="link"
            className={'abc'}
            style={{ padding: '0' }}
            onClick={() =>
              window.open(
                `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!${hubClusterName}"}`,
                '_blank'
              )
            }
          >
            {t('View clusters with search add-on disabled.')}
          </Button>
        </Alert>
      )}

      <FlexItem>
        <div className="diagram-title">
          <span
            className="how-to-read-text"
            tabIndex={0}
            onClick={() => {
              if (typeof setDrawerContent === 'function') {
                setDrawerContent(t('How to read topology'), false, false, false, false, <LegendView t={t} />, false)
              }
            }}
            onKeyDown={noop}
            role="button"
          >
            {t('How to read topology')}
            <svg className="how-to-read-icon">
              <use href={'#drawerShapes__sidecar'} />
            </svg>
          </span>
        </div>
      </FlexItem>
    </Flex>
  )
}

export default TopologyToolbar
