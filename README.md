# redux-rest-helper-for-loopback
Redux rest helper help you to create rest Actions and Reducers
```ts
import RestActionCreator from "../../utils/redux-rest-creator/RestActionCreator";
import { notifError } from "./notify.actions";
import RequestRestObjectCreator, { LoopbackFilter } from "../../utils/redux-rest-creator/RequestRestObjectCreator";
import { push, goBack } from "react-router-redux";
import URL from "../../URL";
import Device from "../../interfaces/Device";

const roc = new RequestRestObjectCreator<Device>(URL.DeviceAPI);
const redirect = '/devices';
const deleteQuestion = 'Do you want remove record?';
const onSuccess = (actionType: string, dispatch: Function) => {
  if (actionType === 'UPDATE') return dispatch(goBack());
}

const rc = new RestActionCreator<Device, LoopbackFilter>('DEVICE_ENTRY', roc.getRequests(), notifError, push, onSuccess);

export const createDeviceAction = rc.getCreateAction(redirect);
export const updateDeviceAction = rc.getUpdateAction();
export const fetchDeviceAction = rc.getFetchAction();
export const deleteDeviceAction = rc.getDeleteAction(deleteQuestion, redirect);
export const listDeviceAction = rc.getListAndCountAction();
```
