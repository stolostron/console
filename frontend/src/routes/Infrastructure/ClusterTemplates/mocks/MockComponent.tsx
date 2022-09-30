/* Copyright Contributors to the Open Cluster Management project */

const MockComponent = jest
  .fn()
  .mockImplementation((props: any) => <div id={props['data-testid']}>{props.children}</div>);

export default MockComponent;
