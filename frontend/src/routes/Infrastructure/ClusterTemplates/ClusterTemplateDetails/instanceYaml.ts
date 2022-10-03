/* Copyright Contributors to the Open Cluster Management project */
/*This module generates a ClusterTemplateInstance YAML 
  The spec.values section containing the values for the instance parameters contains default values, or placeholders
  The description and type are provided as comments
  The implementation is:
  creating a ClusterTemplateInstance object with fake keys and values for the comments, 
  dumping it to a yaml
  replacing the lines with the fake keys and values with the suitable comments
*/
import { clusterTemplateInstanceGVK } from '../constants';
import { ClusterTemplate, ClusterTemplateInstance, ClusterTemplateProperty } from '../types';
import { dump } from 'js-yaml';

const valuePlaceholder = '<value>';

const getPropertyTypeKey = (property: ClusterTemplateProperty) => `${property.name}Type`;
const getPropertyDescriptionKey = (property: ClusterTemplateProperty) =>
  `${property.name}Description`;
const getPropertySecretKey = (property: ClusterTemplateProperty) => `${property.name}Secret`;

const getValuesObject = (templateProperties: ClusterTemplateProperty[]) => {
  const values: { [key: string]: any } = {};
  for (const property of templateProperties) {
    if (!property.overwritable) {
      continue;
    }
    //add description, type and secret keys that will be turned to comments
    values[getPropertyTypeKey(property)] = property.type;
    values[getPropertyDescriptionKey(property)] = property.description;
    if (property.secretRef) {
      values[getPropertySecretKey(property)] = `A default value is defined in a secret`;
    }
    values[property.name] = property.defaultValue ?? valuePlaceholder;
  }
  return values;
};

const getInstanceObject = (clusterTemplate: ClusterTemplate): ClusterTemplateInstance => ({
  apiVersion: `${clusterTemplateInstanceGVK.group}/${clusterTemplateInstanceGVK.version}`,
  kind: clusterTemplateInstanceGVK.kind,
  metadata: {
    namespace: valuePlaceholder,
    name: valuePlaceholder,
  },
  spec: {
    clusterTemplateRef: clusterTemplate.metadata?.name || valuePlaceholder,
    values: getValuesObject(clusterTemplate.spec.properties),
  },
});

const YAML_COMMENT_PREFIX = '#';

const getYamlComment = (comment: string) => `${YAML_COMMENT_PREFIX} ${comment}`;

const addPropertyDescriptionsAsComments = (
  yaml: string,
  properties: ClusterTemplateProperty[],
): string => {
  let ret = yaml;
  for (const property of properties) {
    if (!property.overwritable) {
      continue;
    }
    ret = ret.replace(getPropertyTypeKey(property), getYamlComment('type'));
    ret = ret.replace(getPropertyDescriptionKey(property), getYamlComment('description'));
    if (property.secretRef) {
      ret = ret.replace(`${getPropertySecretKey(property)}: `, getYamlComment(''));
    }
  }
  return ret;
};

const generateInstanceYaml = (clusterTemplate: ClusterTemplate): string => {
  const object = getInstanceObject(clusterTemplate);
  const yaml = dump(object);
  return addPropertyDescriptionsAsComments(yaml, clusterTemplate.spec.properties);
};

export default generateInstanceYaml;
