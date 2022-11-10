/* Copyright Contributors to the Open Cluster Management project */
import generateInstanceYaml from './instanceYaml';

import clusterTemplate from '../mocks/clusterTemplateExample.json';
import { readFileSync } from 'fs';
import path from 'path';
import * as _ from 'lodash';
import { ClusterTemplate } from '../types';

describe('Download Instance yaml', () => {
  const expected = readFileSync(path.join(__dirname, '../mocks/downloadYamlResult.yaml'), {
    encoding: 'utf-8',
  });
  it('should generate correct instance yaml', () => {
    const text = generateInstanceYaml(clusterTemplate);
    expect(text).toEqual(expected);
  });

  it('should not contain values section if there are no properties in the template', () => {
    const clusterTemplateNoProperties = _.cloneDeep(clusterTemplate) as ClusterTemplate;
    clusterTemplateNoProperties.spec.clusterSetup = undefined;
    clusterTemplateNoProperties.spec.clusterDefinition.propertyDetails = undefined;
    const text = generateInstanceYaml(clusterTemplateNoProperties);
    expect(text.indexOf('values:')).toEqual(-1);
  });
});
