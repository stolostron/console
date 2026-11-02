/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Icon,
  Label,
  LabelGroup,
  List,
  ListItem,
  MenuToggle,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core'
import { EllipsisVIcon, ExternalLinkAltIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useTranslation } from '~/lib/acm-i18next'
import { AcmScrollable } from '../AcmScrollable/AcmScrollable'
import { CatalogCardItemType, CatalogItemAction, ICatalogCard, ICatalogCardListItem } from './catalogTypes'

function CardList({ items, icon }: { items: ICatalogCardListItem[]; icon?: React.ReactNode }) {
  return (
    <List isPlain>
      {items.map((item, index) => (
        <ListItem key={index} icon={item.icon ?? icon} style={{ opacity: 0.85 }}>
          {item.text}
          {item.help && (
            <Popover headerContent={item.helpTitle} bodyContent={item.help}>
              <Button
                icon={<OutlinedQuestionCircleIcon />}
                variant="link"
                onClick={(event) => event.stopPropagation()}
                style={{ padding: 0, marginLeft: 'var(--pf-t--global--spacer--sm)', verticalAlign: 'middle' }}
              />
            </Popover>
          )}
          {item.subTitles?.map((subTitle) => (
            <p key={subTitle} style={{ margin: 0, lineHeight: 2, paddingLeft: 'var(--pf-t--global--spacer--md)' }}>
              - {subTitle}
            </p>
          ))}
        </ListItem>
      ))}
    </List>
  )
}

export function AcmCatalogCard({
  card,
  itemActions,
  showSelect = false,
  selected = false,
  onSelect,
}: {
  card: ICatalogCard
  itemActions?: CatalogItemAction[]
  showSelect?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const disabled = !card.onClick
  const showDropdown = !!itemActions?.length
  const fadedStyle = { opacity: disabled ? 0.5 : undefined }

  return (
    <Card id={card.id} isLarge onClick={card.onClick} style={{ cursor: disabled ? undefined : 'pointer' }}>
      <CardHeader
        actions={
          showSelect || showDropdown
            ? {
                actions: (
                  <>
                    {showDropdown && (
                      <Dropdown
                        isOpen={isOpen}
                        onOpenChange={setIsOpen}
                        popperProps={{ position: 'right' }}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            isExpanded={isOpen}
                            onClick={(event) => {
                              event.stopPropagation()
                              setIsOpen(!isOpen)
                            }}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                      >
                        <DropdownList>
                          {itemActions?.map((action, index) =>
                            'isSeparator' in action ? (
                              <Divider key={index} component="li" />
                            ) : (
                              <DropdownItem
                                key={action.label}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  action.onClick(card)
                                  setIsOpen(false)
                                }}
                              >
                                {action.label}
                              </DropdownItem>
                            )
                          )}
                        </DropdownList>
                      </Dropdown>
                    )}
                    {showSelect && (
                      <Checkbox
                        id={`select-${card.id}`}
                        aria-label={card.title}
                        isChecked={selected}
                        onChange={onSelect}
                      />
                    )}
                  </>
                ),
                hasNoOffset: true,
              }
            : undefined
        }
        style={fadedStyle}
      >
        <Split hasGutter style={{ width: '100%' }}>
          <SplitItem isFilled>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {card.icon && (
                <div
                  style={{
                    display: 'flex',
                    height: 40,
                    width: 40,
                    marginTop: -20,
                    marginBottom: -20,
                    marginRight: 'var(--pf-t--global--spacer--md)',
                    alignItems: 'center',
                  }}
                >
                  <Icon size="xl" className="pf-v6-u-font-size-2xl">
                    {card.icon}
                  </Icon>
                </div>
              )}
              <CardTitle>{card.title}</CardTitle>
            </div>
          </SplitItem>
          {card.badgeList
            ? card.badgeList.map(({ badge, badgeColor }, index) => (
                <SplitItem key={index}>
                  <Label color={badgeColor}>{badge}</Label>
                </SplitItem>
              ))
            : card.badge && (
                <SplitItem>
                  {card.badgeTooltip ? (
                    <Popover headerContent={card.badgeTooltipTitle} bodyContent={card.badgeTooltip}>
                      <button type="button" onClick={(event) => event.stopPropagation()} style={{ all: 'unset' }}>
                        <Label color={card.badgeColor}>{card.badge}</Label>
                      </button>
                    </Popover>
                  ) : (
                    <Label color={card.badgeColor}>{card.badge}</Label>
                  )}
                </SplitItem>
              )}
        </Split>
      </CardHeader>
      {card.items && (
        <AcmScrollable>
          <CardBody style={{ paddingTop: 0, ...fadedStyle }}>
            <DescriptionList>
              {card.items.map((item, index) =>
                item.type === CatalogCardItemType.Description ? (
                  <DescriptionList key={index}>
                    <DescriptionListGroup>
                      <span style={{ opacity: 0.9 }}>{item.description}</span>
                    </DescriptionListGroup>
                  </DescriptionList>
                ) : (
                  <DescriptionList key={index} orientation={item.horizontal ? { sm: 'horizontal' } : undefined}>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{item.title}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <CardList icon={item.icon} items={item.items} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                )
              )}
            </DescriptionList>
          </CardBody>
        </AcmScrollable>
      )}
      {(card.labels || card.learnMore) && (
        <CardFooter>
          <div style={{ display: 'flex', alignItems: 'end', gap: 'var(--pf-t--global--spacer--md)' }}>
            <div style={{ flexGrow: 1, ...fadedStyle }}>
              {card.labels && (
                <LabelGroup>
                  {card.labels.map(({ label, color }) => (
                    <Label color={color} key={label}>
                      <span style={{ display: 'inline-grid', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {label}
                      </span>
                    </Label>
                  ))}
                </LabelGroup>
              )}
            </div>
            {card.learnMore && (
              <Button
                variant="link"
                icon={<ExternalLinkAltIcon />}
                isInline
                onClick={(event) => {
                  event.stopPropagation()
                  window.open(card.learnMore, '_blank')
                }}
              >
                {t('Learn more')}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
      {card.alertTitle && (
        <Alert title={card.alertTitle} isInline variant={card.alertVariant}>
          {card.alertContent}
        </Alert>
      )}
    </Card>
  )
}
