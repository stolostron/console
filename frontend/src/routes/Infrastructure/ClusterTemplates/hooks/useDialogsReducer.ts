/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';

type DialogsState<DialogIds extends string> = {
  [key in DialogIds]: boolean;
};
type DialogsAction<DialogIds extends string> = {
  type: 'open' | 'close';
  payload: DialogIds;
};

function reducer<DialogIds extends string>(
  state: DialogsState<DialogIds>,
  action: DialogsAction<DialogIds>,
): DialogsState<DialogIds> {
  switch (action.type) {
    case 'open':
      return { ...state, [action.payload]: true };
    case 'close':
      return { ...state, [action.payload]: false };
  }
}

export const useDialogsReducer = <DialogIds extends string>(dialogIds: DialogIds[]) => {
  const initialState = dialogIds.reduce(
    (res, id) => ({ ...res, [id]: false }),
    {} as DialogsState<DialogIds>,
  );
  const [state, dispatch]: [
    state: DialogsState<DialogIds>,
    dispatch: React.Dispatch<DialogsAction<DialogIds>>,
  ] = React.useReducer(reducer, initialState);
  const openDialog = (dialogId: DialogIds) => dispatch({ type: 'open', payload: dialogId });
  const closeDialog = (dialogId: DialogIds) => dispatch({ type: 'close', payload: dialogId });
  const isDialogOpen = (dialogId: DialogIds) => state[dialogId];
  return { openDialog, closeDialog, isDialogOpen };
};

export default useDialogsReducer;
