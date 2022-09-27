/* Copyright Contributors to the Open Cluster Management project */
import * as React from "react";
import { Modal } from "@patternfly/react-core";

export const TestModal: React.FC<TestModalProps> = ({
  isOpen,
  resource,
  close,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Testing Modal"
      variant="small"
    >
      This modal is for application: {resource?.metadata?.name}
    </Modal>
  );
};

type TestModalProps = {
  isOpen: boolean;
  resource?: any;
  close?: () => void;
};
