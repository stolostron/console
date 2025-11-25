import { useContext, useState } from 'react'
import {
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  SelectList,
  TextInput,
  ToolbarItem,
} from '@patternfly/react-core'
import { observer } from '@patternfly/react-topology'
import { TopologyContext } from './TopologyContext'

// const channelChanger = (
//   <Split>
//     <SplitItem>
//       {channelControl?.allChannels?.length > 1 && (
//         <ChannelControl channelControl={channelControl} t={t} setDrawerContent={setDrawerContent} />
//       )}
//     </SplitItem>
//   </Split>
// )

// const viewToolbar = (
//   <>
//     <ToolbarItem>{channelChanger}</ToolbarItem>
//     {isSearchDisabled && (
//       <Alert
//         variant="warning"
//         title={t(
//           'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
//         )}
//       >
//         <Button
//           variant="link"
//           className={'abc'}
//           style={{ padding: '0' }}
//           onClick={() =>
//             window.open(
//               `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!${hubClusterName}"}`,
//               '_blank'
//             )
//           }
//         >
//           {t('View clusters with search add-on disabled.')}
//         </Button>
//       </Alert>
//     )}

//     <div style={{ position: 'absolute', right: '30px' }}>
//       <ToolbarItem style={{ marginLeft: 'auto', marginRight: 0 }}>
//         <div className="diagram-title">
//           <span
//             className="how-to-read-text"
//             tabIndex={0}
//             onClick={() => {
//               setDrawerContent(t('How to read topology'), false, false, false, false, <LegendView t={t} />, false)
//             }}
//             onKeyPress={noop}
//             role="button"
//           >
//             {t('How to read topology')}
//             <svg className="how-to-read-icon">
//               <use href={'#drawerShapes__sidecar'} />
//             </svg>
//           </span>
//         </div>
//       </ToolbarItem>
//     </div>
//   </>
// )

const OptionsContextBar: React.FC = observer(() => {
  const options = useContext(TopologyContext)
  const [nodeOptionsOpen, setNodeOptionsOpen] = useState<boolean>(false)
  const [edgeOptionsOpen, setEdgeOptionsOpen] = useState<boolean>(false)

  const renderNodeOptionsDropdown = () => {
    const nodeOptionsToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
      <MenuToggle
        ref={toggleRef}
        onClick={() => setNodeOptionsOpen((prev) => !prev)}
        isExpanded={nodeOptionsOpen}
        style={
          {
            width: '180px',
          } as React.CSSProperties
        }
      >
        Node options
      </MenuToggle>
    )

    return (
      <Select
        onOpenChange={(isOpen) => setNodeOptionsOpen(isOpen)}
        onSelect={() => {}}
        isOpen={nodeOptionsOpen}
        toggle={nodeOptionsToggle}
      >
        <SelectList>
          <SelectOption
            hasCheckbox
            value="Labels"
            isSelected={options.nodeOptions.labels}
            onClick={() => options.setNodeOptions({ ...options.nodeOptions, labels: !options.nodeOptions.labels })}
          >
            Labels
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Secondary Labels"
            isSelected={options.nodeOptions.secondaryLabels}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, secondaryLabels: !options.nodeOptions.secondaryLabels })
            }
          >
            Secondary Labels
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Status"
            isSelected={options.nodeOptions.showStatus}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, showStatus: !options.nodeOptions.showStatus })
            }
          >
            Status
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Decorators"
            isSelected={options.nodeOptions.showDecorators}
            onClick={() =>
              options.setNodeOptions({
                ...options.nodeOptions,
                showDecorators: !options.nodeOptions.showDecorators,
              })
            }
          >
            Decorators
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Badges"
            isSelected={options.nodeOptions.badges}
            onClick={() => options.setNodeOptions({ ...options.nodeOptions, badges: !options.nodeOptions.badges })}
          >
            Badges
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Icons"
            isSelected={options.nodeOptions.icons}
            onClick={() => options.setNodeOptions({ ...options.nodeOptions, icons: !options.nodeOptions.icons })}
          >
            Icons
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Shapes"
            isSelected={options.nodeOptions.showShapes}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, showShapes: !options.nodeOptions.showShapes })
            }
          >
            Shapes
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Context Menus"
            isSelected={options.nodeOptions.contextMenus}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, contextMenus: !options.nodeOptions.contextMenus })
            }
          >
            Context Menus
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Hide context kebab menu"
            isSelected={options.nodeOptions.hideKebabMenu}
            isDisabled={!options.nodeOptions.contextMenus}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, hideKebabMenu: !options.nodeOptions.hideKebabMenu })
            }
          >
            Hide kebab for context menu
          </SelectOption>
          <SelectOption
            hasCheckbox
            value="Rectangle Groups"
            isSelected={!options.nodeOptions.hulledOutline}
            onClick={() =>
              options.setNodeOptions({ ...options.nodeOptions, hulledOutline: !options.nodeOptions.hulledOutline })
            }
          >
            Rectangle Groups
          </SelectOption>
        </SelectList>
      </Select>
    )
  }

  const renderEdgeOptionsDropdown = () => {
    const selectContent = (
      <SelectList>
        <SelectOption
          value="Status"
          hasCheckbox
          isSelected={options.edgeOptions.showStatus}
          onClick={() =>
            options.setEdgeOptions({ ...options.edgeOptions, showStatus: !options.edgeOptions.showStatus })
          }
        >
          Status
        </SelectOption>
        <SelectOption
          value="Styles"
          hasCheckbox
          isSelected={options.edgeOptions.showStyles}
          onClick={() =>
            options.setEdgeOptions({ ...options.edgeOptions, showStyles: !options.edgeOptions.showStyles })
          }
        >
          Styles
        </SelectOption>
        <SelectOption
          value="Animations"
          hasCheckbox
          isSelected={options.edgeOptions.showAnimations}
          onClick={() =>
            options.setEdgeOptions({ ...options.edgeOptions, showAnimations: !options.edgeOptions.showAnimations })
          }
        >
          Animations
        </SelectOption>
        <SelectOption
          value="Terminal types"
          hasCheckbox
          isSelected={options.edgeOptions.terminalTypes}
          onClick={() =>
            options.setEdgeOptions({ ...options.edgeOptions, terminalTypes: !options.edgeOptions.terminalTypes })
          }
        >
          Terminal type
        </SelectOption>
        <SelectOption
          value="Tags"
          hasCheckbox
          isSelected={options.edgeOptions.showTags}
          onClick={() => options.setEdgeOptions({ ...options.edgeOptions, showTags: !options.edgeOptions.showTags })}
        >
          Tags
        </SelectOption>
      </SelectList>
    )
    const edgeOptionsToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
      <MenuToggle
        ref={toggleRef}
        onClick={() => setEdgeOptionsOpen((prev) => !prev)}
        isExpanded={edgeOptionsOpen}
        style={
          {
            width: '180px',
          } as React.CSSProperties
        }
      >
        Edge options
      </MenuToggle>
    )

    return (
      <Select
        onOpenChange={(isOpen) => setEdgeOptionsOpen(isOpen)}
        onSelect={() => {}}
        isOpen={edgeOptionsOpen}
        toggle={edgeOptionsToggle}
      >
        {selectContent}
      </Select>
    )
  }

  return (
    <Flex style={{ padding: '10px' }}>
      <ToolbarItem>
        <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Flex flexWrap={{ default: 'nowrap' }} gap={{ default: 'gapXs' }}>
              <TextInput
                aria-label="nodes"
                type="number"
                value={''}
                placeholder="Search"
                // onChange={(_event, val: string) =>
                //   val ? updateValue(parseInt(val), 0, 9999, setNumNodes) : setNumNodes(0)
                // }
              />
            </Flex>
          </FlexItem>
        </Flex>
      </ToolbarItem>
      <ToolbarItem>
        <Flex gap={{ default: 'gapMd' }}>
          {renderNodeOptionsDropdown()}
          {renderEdgeOptionsDropdown()}
        </Flex>
      </ToolbarItem>
    </Flex>
  )
})

export default OptionsContextBar
