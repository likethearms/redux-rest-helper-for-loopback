# redux-rest-helper-for-loopback
Redux rest helper help you to create rest Actions and Reducers
## Usage example
### Action & ActionTypes
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
### Reducer
```ts
import Device from "../interfaces/Device";
import { GenericInitState, genericRestReducer } from "../utils/redux-rest-creator/generic-rest-reducer";
import { deviceFormInitValues } from "../forms/DeviceForm";
import { deviceFormInitValues } from "../forms/DeviceForm";

export interface DeviceRedux extends GenericInitState<Device> { }
const deviceInitState: DeviceRedux = getInitState(deviceFormInitValues);
const deviceReducer = genericRestReducer<Device>('DEVICE_ENTRY', deviceInitState);

export default combineReducers({
  deviceEntry: deviceReducer,
  ...
});
```
