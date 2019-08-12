export interface GenericInitList<T> {
  isFetchLoading: boolean;
  isCountLoading: boolean;
  count: number;
  data: T[];
}

export interface GenericInitModel<T> {
  isLoading: boolean;
  data: T;
}

export interface GenericInitState<T> {
  model: GenericInitModel<T>;
  list: GenericInitList<T>
}

export function genericRestReducer<T>(
  name: string,
  initState: GenericInitState<T>): (state: T & GenericInitState<T> | undefined, action: any) => any {
  return (
    state: GenericInitState<T> = initState,
    action: any): any => {
    switch (action.type) {
      case `@${name}:CREATE_REQUEST`:
      case `@${name}:UPDATE_REQUEST`:
      case `@${name}:FETCH_REQUEST`:
      case `@${name}:DELETE_REQUEST`:
        return { ...state, model: { ...initState.model, isLoading: true } };

      case `@${name}:CREATE_SUCCESS`:
      case `@${name}:FETCH_SUCCESS`:
      case `@${name}:UPDATE_SUCCESS`:
        return { ...state, model: { ...initState.model, data: action.payload, isLoading: false } };

      case `@${name}:DELETE_SUCCESS`:
        return { ...state, model: { ...initState.model, isLoading: false } };

      case `@${name}:CREATE_FAIL`:
      case `@${name}:UPDATE_FAIL`:
      case `@${name}:FETCH_FAIL`:
      case `@${name}:DELETE_FAIL`:
        return { ...state, model: { ...state.model, isLoading: false } };

      case `@${name}:LIST_REQUEST`:
        return { ...state, list: { ...state.list, isFetchLoading: true } };
      case `@${name}:LIST_SUCCESS`:
        return { ...state, list: { ...state.list, data: action.payload, isFetchLoading: false } };
      case `@${name}:LIST_FAIL`:
        return { ...state, list: { ...state.list, isFetchLoading: false } };
      case `@${name}:COUNT_REQUEST`:
        return { ...state, list: { ...state.list, isCountLoading: true } };
      case `@${name}:COUNT_SUCCESS`:
        return { ...state, list: { ...state.list, ...action.payload, isCountLoading: false } };
      case `@${name}:COUNT_FAIL`:
        return { ...state, list: { ...state.list, isCountLoading: false } };
      default:
        return state;
    }
  };
}
