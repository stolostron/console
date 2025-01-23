/* Copyright Contributors to the Open Cluster Management project */
import {
  EmptyStateHeader,
  EmptyStateIcon,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  EmptyState,
} from '@patternfly/react-core'
import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { AcmEmptyState, AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { relatedResourceKyvernoColumns } from './KyvernoTable'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { uniq } from 'lodash'

const kyvernoPolicyTypes = ['validate', 'generate', 'mutate', 'verifyImages'] as const
type kyvernoPolicyTypeTypes = (typeof kyvernoPolicyTypes)[number]

type kyvernoPolicyType = {
  [pt in kyvernoPolicyTypeTypes]?: any
}

type classifiedRelatedItemType = { [policyType: string]: any[] }

interface IkyvernoRule extends kyvernoPolicyType {
  name: string
}

type ruleNamePolicyTypeMapType = {
  [ruleName: string]: string
}

interface IPolicyReport {
  rules: string // Example: 'create-configmap-in-ns; rule2; ',
}

export interface IRuleMessage {
  ruleName: string
  message: string
}

export interface IRelatedObjMessages {
  [relatedItemUid: string]: IRuleMessage[]
}

interface IKyvernoRelatedResources {
  name: string
  namespace: string | undefined
  template: any | undefined
  relatedObjects: any[] | undefined
  violationColumn: IAcmTableColumn<any> | undefined
}

export const KyvernoRelatedResources: FunctionComponent<IKyvernoRelatedResources> = (
  props: IKyvernoRelatedResources
) => {
  const { name, namespace, template, relatedObjects, violationColumn } = props
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')
  const kyvernoPolicyMenuLabels: Record<string, string> = {
    validate: t('Validate'),
    generate: t('Generate'),
    generateMatch: t('Generate match resources'),
    mutate: t('Mutate'),
    verifyImages: t('Verify images'),
  }

  const relatedObjectsMessages: IRelatedObjMessages = {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemClick = (event: any, _isSelected: boolean) => {
    const id = event.currentTarget.id
    setSelectedId(id)
  }

  const classifiedRelatedObjects = useMemo<classifiedRelatedItemType>(
    () => classifyRelatedObjects(template, relatedObjects),
    [template, relatedObjects]
  )

  useEffect(() => {
    // Init selected table
    const policyTypeIds = Object.keys(classifiedRelatedObjects).sort((a: string, b: string) => {
      const order = Object.keys(kyvernoPolicyMenuLabels)
      return order.indexOf(a) - order.indexOf(b)
    })
    if (selectedId === '' && policyTypeIds.length > 0) {
      setSelectedId(policyTypeIds[0])
    }
    // kyvernoPolicyMenuLabels key is static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classifiedRelatedObjects, selectedId])

  if (!name || !template || !relatedObjects || !violationColumn)
    return (
      <EmptyState>
        <EmptyStateHeader icon={<EmptyStateIcon icon={Spinner} />} />
      </EmptyState>
    )

  return (
    <>
      <AcmTable
        extraToolbarControls={
          <ToggleGroup aria-label="choose kyverno resource panel">
            {Object.keys(classifiedRelatedObjects)
              .sort((a: string, b: string) => {
                const order = Object.keys(kyvernoPolicyMenuLabels)
                return order.indexOf(a) - order.indexOf(b)
              })
              .filter((policyTypeId: string) => kyvernoPolicyMenuLabels[policyTypeId])
              .map((policyTypeId: string) => (
                <ToggleGroupItem
                  key={policyTypeId}
                  text={kyvernoPolicyMenuLabels[policyTypeId]}
                  buttonId={policyTypeId}
                  isSelected={selectedId === policyTypeId}
                  onChange={handleItemClick}
                />
              ))}
          </ToggleGroup>
        }
        items={classifiedRelatedObjects[selectedId] ?? []}
        emptyState={
          <AcmEmptyState
            title={t('No parameter resources')}
            message={`${t('There are no related resources for this')} ${template?.kind}`}
          />
        }
        columns={relatedResourceKyvernoColumns(t, violationColumn, name, namespace || '', relatedObjectsMessages)}
        keyFn={(item: any) => `${item.kind}.${item.name}`}
        initialSort={{
          index: 0,
          direction: 'asc',
        }}
        perPageOptions={[]}
      />
    </>
  )
}

const getPolicyTypeRuleMap = (template: any) => {
  const ruleNamePolicyTypeMap: ruleNamePolicyTypeMapType = {}

  const rules = template?.spec?.rules as IkyvernoRule[]

  for (const rule of rules) {
    for (const policyType of kyvernoPolicyTypes) {
      // There can be only one PolicyType per rule.
      if (rule[policyType] !== undefined) {
        ruleNamePolicyTypeMap[rule.name] = policyType
        break
      }
    }
  }

  return ruleNamePolicyTypeMap
}

const classifyRelatedObjects = (template: any, relatedObjects: any[] | undefined): classifiedRelatedItemType => {
  if (!template || !relatedObjects) return {}

  const ruleNamePolicyTypeMap = getPolicyTypeRuleMap(template)
  const classifiedRelatedObjects: classifiedRelatedItemType = {}

  for (const relatedItem of relatedObjects) {
    if (relatedItem.generatedByKyverno) {
      addToClassifiedRelatedObjects(classifiedRelatedObjects, 'generate', relatedItem)

      continue
    }

    for (const ruleName of Object.keys(ruleNamePolicyTypeMap)) {
      const ruleNamesFromPolicyReport = (relatedItem.policyReport as IPolicyReport).rules.split('; ')
      if (ruleNamesFromPolicyReport.indexOf(ruleName) < 0) continue

      const policyType = ruleNamePolicyTypeMap[ruleName]
      // If policyType is "generate," this related item is a match resource in the generate rule
      if (policyType === 'generate') {
        addToClassifiedRelatedObjects(classifiedRelatedObjects, 'generateMatch', relatedItem)
      } else {
        addToClassifiedRelatedObjects(classifiedRelatedObjects, policyType, relatedItem)
      }
    }
  }

  return classifiedRelatedObjects
}

const addToClassifiedRelatedObjects = (
  classifiedRelatedObjects: classifiedRelatedItemType,
  policyType: string,
  relatedItem: any
) => {
  // If policyType does not exist, this rule is included in the kyverno policy
  if (!policyType) return

  if (!classifiedRelatedObjects[policyType]) {
    classifiedRelatedObjects[policyType] = []
  }
  classifiedRelatedObjects[policyType].push(relatedItem)
  // Remove duplicate resources applied to multiple rules.
  // Only one resource is displayed in the table, with multiple messages shown for each resource.
  classifiedRelatedObjects[policyType] = uniq(classifiedRelatedObjects[policyType])
}
