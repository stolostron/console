/* Copyright Contributors to the Open Cluster Management project */
import generateInstanceYaml from './instanceYaml';

import clusterTemplate from '../mocks/clusterTemplateExample.json';
import { readFileSync } from 'fs';
import path from 'path';
describe('Download Instance yaml', () => {
  it('should generate correct instance yaml', () => {
    const expected = readFileSync(path.join(__dirname, '../mocks/downloadYamlResult.yaml'), {
      encoding: 'utf-8',
    });
    const text = generateInstanceYaml(clusterTemplate);
    expect(text).toEqual(expected);
  });
});
