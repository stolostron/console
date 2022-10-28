/* Copyright Contributors to the Open Cluster Management project */
/*This module generates a ClusterTemplateInstance YAML 
  The spec.values section containing the values for the instance parameters contains default values, or placeholders
  The description and type are provided as comments
  The implementation is:
  creating a ClusterTemplateInstance object with fake keys and values for the comments, 
  dumping it to a yaml
  replacing the lines with the fake keys and values with the suitable comments
*/
import * as _ from 'lodash';
import { clusterTemplateInstanceGVK } from '../constants';
import {
  ClusterTemplate,
  ClusterTemplateInstance,
  ClusterTemplateInstancePropertyValue,
  ClusterTemplateProperty,
} from '../types';
import { dump } from 'js-yaml';

const valuePlaceholder = '<value>';

const getPropertyTypeKey = (property: ClusterTemplateProperty, clusterSetup = '') => {
  return `${clusterSetup}_${property.name}Type`;
};
const getPropertyDescriptionKey = (property: ClusterTemplateProperty, clusterSetup = '') =>
  `${clusterSetup}_${property.name}Description`;
const getPropertySecretKey = (property: ClusterTemplateProperty, clusterSetup = '') =>
  `${clusterSetup}_${property.name}Secret`;

const getValueItem = (
  property: ClusterTemplateProperty,
  clusterSetup?: string,
): ClusterTemplateInstancePropertyValue => {
  return {
    name: property.name,
    value: property.defaultValue ?? valuePlaceholder,
    clusterSetup,
    [getPropertyTypeKey(property, clusterSetup)]: property.type,
    [getPropertyDescriptionKey(property, clusterSetup)]: property.description,
    [getPropertySecretKey(property, clusterSetup)]: property.secretRef
      ? `A default value is defined in a secret`
      : undefined,
  };
};

const getOverwritableProperties = (properties?: ClusterTemplateProperty[]) =>
  _.filter(properties, (property) => property.overwritable);

const getValues = (clusterTemplate: ClusterTemplate): ClusterTemplateInstancePropertyValue[] => {
  let values: ClusterTemplateInstancePropertyValue[] = getOverwritableProperties(
    clusterTemplate.spec.clusterDefinition.propertyDetails,
  ).map((property) => getValueItem(property));
  for (const clusterSetup of clusterTemplate.spec.clusterSetup || []) {
    const clusterSetupValues = getOverwritableProperties(clusterSetup.propertyDetails).map(
      (property) => getValueItem(property, clusterSetup.name),
    );
    values = [...values, ...clusterSetupValues];
  }
  return values;
};

const getInstanceObject = (clusterTemplate: ClusterTemplate): ClusterTemplateInstance => {
  const values = getValues(clusterTemplate);
  return {
    apiVersion: `${clusterTemplateInstanceGVK.group}/${clusterTemplateInstanceGVK.version}`,
    kind: clusterTemplateInstanceGVK.kind,
    metadata: {
      namespace: valuePlaceholder,
      name: valuePlaceholder,
    },
    spec: {
      clusterTemplateRef: clusterTemplate.metadata?.name || valuePlaceholder,
      values: values.length ? values : undefined,
    },
  };
};

const YAML_COMMENT_PREFIX = '#';

const getYamlComment = (comment: string) => `${YAML_COMMENT_PREFIX} ${comment}`;

const addPropertyComments = (
  yaml: string,
  property: ClusterTemplateProperty,
  clusterSetup?: string,
): string => {
  let ret = yaml.replace(getPropertyTypeKey(property, clusterSetup), getYamlComment('type'));
  ret = ret.replace(
    getPropertyDescriptionKey(property, clusterSetup),
    getYamlComment('description'),
  );
  if (property.secretRef) {
    ret = ret.replace(`${getPropertySecretKey(property, clusterSetup)}: `, getYamlComment(''));
  }
  return ret;
};

const addPropertyDescriptionsAsComments = (
  yaml: string,
  clusterTemplate: ClusterTemplate,
): string => {
  let ret = yaml;
  for (const property of getOverwritableProperties(
    clusterTemplate.spec.clusterDefinition.propertyDetails,
  )) {
    ret = addPropertyComments(ret, property);
  }
  for (const clusterSetup of clusterTemplate.spec.clusterSetup || []) {
    for (const property of getOverwritableProperties(clusterSetup.propertyDetails)) {
      ret = addPropertyComments(ret, property, clusterSetup.name);
    }
  }
  return ret;
};

const generateInstanceYaml = (clusterTemplate: ClusterTemplate): string => {
  const object = getInstanceObject(clusterTemplate);
  const yaml = dump(object);
  return addPropertyDescriptionsAsComments(yaml, clusterTemplate);
};

export default generateInstanceYaml;
