/* Copyright Contributors to the Open Cluster Management project */
import * as React from "react";

export const TestColumn: React.FC<{ resource?: any }> = ({ resource }) => {
  return <p>Application: {resource?.metadata?.name}</p>;
};
