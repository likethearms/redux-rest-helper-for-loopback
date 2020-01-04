# redux-rest-helper-for-loopback

Redux rest helper help you to create rest Actions and Reducers

## Install

```sh
npx install-peerdeps redux-rest-helper-for-loopback
```

## Usage

```javascript
const actions = actionCreator('TEST', requestCreator('/'), push, notifError);

const red = reducerCreator('TEST', { name: '' });
export default red.getReducer();
```
