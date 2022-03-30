// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import LegendView from "./LegendView";
import { render, screen } from '@testing-library/react'
import { waitForText } from '../../../../../lib/test-util'

const t = (string) => {
  return string
}

describe("LegendView", () => {
  beforeEach(async () => {
    render(
      <LegendView
        t={t}
      />
    )

    await waitForText('The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.')
  })

  test("renders as expected", async () => {
    expect(screen.getByText('Status icon legend')).toBeTruthy()
  });
});
