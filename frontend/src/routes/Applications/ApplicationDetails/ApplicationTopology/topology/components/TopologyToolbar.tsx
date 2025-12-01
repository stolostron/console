import { Flex, FlexItem, TextInput } from '@patternfly/react-core'
//import { observer } from '@patternfly/react-topology'
import '../css/topology-toolbar.css'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import LegendView from '../../components/LegendView'
import noop from 'lodash/noop'
import ChannelControl from '../../components/ChannelControl'

interface TopologyToolbarProps {
  setDrawerContent: (
    title: string,
    isInline: boolean,
    isResizable: boolean,
    disableDrawerHead: boolean,
    drawerPanelBodyHasNoPadding: boolean,
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => void
  channelControl: {
    allChannels: string[]
    activeChannel: string | undefined
    setActiveChannel: (channel: string) => void
  }
}

const TopologyToolbar: React.FC<TopologyToolbarProps> = ({ setDrawerContent, channelControl }) => {
  const { t } = useTranslation()

  return (
    <Flex style={{ width: '100%' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem style={{ marginLeft: '10px', visibility: 'hidden' }}>
        <TextInput
          aria-label="nodes"
          type="number"
          value={''}
          placeholder="Search"
          // onChange={(_event, val: string) =>
          //   val ? updateValue(parseInt(val), 0, 9999, setNumNodes) : setNumNodes(0)
          // }
        />
      </FlexItem>
      <FlexItem>
        {channelControl?.allChannels?.length > 1 && (
          <ChannelControl channelControl={channelControl} t={t} setDrawerContent={setDrawerContent} />
        )}
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }} />
      <FlexItem style={{ position: 'absolute', right: '30px' }}>
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
