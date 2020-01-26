import debugModule from 'debug';

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
  list: GenericInitList<T>;
}

const request = <T extends {}>(
  state: GenericInitState<T>,
  _: any,
  initState: GenericInitState<T>
) => ({
  ...state,
  model: { ...initState.model, isLoading: true },
});

const updateRequest = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  model: { ...state.model, isLoading: true },
});

const success = <T extends {}>(
  state: GenericInitState<T>,
  action: any,
  initState: GenericInitState<T>
) => ({
  ...state,
  model: { ...initState.model, data: action.payload, isLoading: false },
});

const deleteSuccess = <T extends {}>(
  state: GenericInitState<T>,
  _: any,
  initState: GenericInitState<T>
) => ({
  ...state,
  model: { ...initState.model, isLoading: false },
});

const fail = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  model: { ...state.model, isLoading: false },
});

const listRequest = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  list: { ...state.list, isFetchLoading: true },
});

const listSuccess = <T extends {}>(state: GenericInitState<T>, action: any) => ({
  ...state,
  list: { ...state.list, data: action.payload, isFetchLoading: false },
});

const listFail = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  list: { ...state.list, isFetchLoading: false },
});

const countRequest = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  list: { ...state.list, isCountLoading: true },
});

const countSuccess = <T extends {}>(state: GenericInitState<T>, action: any) => ({
  ...state,
  list: { ...state.list, ...action.payload, isCountLoading: false },
});

const countFail = <T extends {}>(state: GenericInitState<T>) => ({
  ...state,
  list: { ...state.list, isCountLoading: false },
});

const clean = <T extends {}>(_: any, __: any, initState: GenericInitState<T>) => initState;

export const createReducer = <Values extends AnyValues = AnyValues>(
  handlers: any,
  initialState: Values
) => (state: Values = initialState, action: any): Values => {
  const debug = debugModule('createReducer');
  const handler = handlers[action.type];
  if (!handler) return state;
  const nextState = handler(state, action, initialState);
  debug(`${action.type} nextState`, nextState);
  return { ...state, ...nextState };
};

export interface AnyValues {
  [field: string]: any;
}

export const createInitState = <Values extends AnyValues = AnyValues>(
  data: Values
): GenericInitState<Values> => ({
  list: {
    isFetchLoading: false,
    isCountLoading: false,
    count: 0,
    data: [],
  },
  model: {
    data,
    isLoading: false,
  },
});

export const reducerCreator = (name: string, initialState?: any) => {
  const handlers = {
    [`@${name}:CREATE_REQUEST`]: request,
    [`@${name}:FETCH_REQUEST`]: request,
    [`@${name}:DELETE_REQUEST`]: request,

    [`@${name}:UPDATE_REQUEST`]: updateRequest,

    [`@${name}:CREATE_SUCCESS`]: success,
    [`@${name}:FETCH_SUCCESS`]: success,
    [`@${name}:UPDATE_SUCCESS`]: success,

    [`@${name}:DELETE_SUCCESS`]: deleteSuccess,

    [`@${name}:CREATE_FAIL`]: fail,
    [`@${name}:FETCH_FAIL`]: fail,
    [`@${name}:DELETE_FAIL`]: fail,
    [`@${name}:UPDATE_FAIL`]: fail,

    [`@${name}:LIST_REQUEST`]: listRequest,
    [`@${name}:LIST_SUCCESS`]: listSuccess,
    [`@${name}:LIST_FAIL`]: listFail,

    [`@${name}:COUNT_REQUEST`]: countRequest,
    [`@${name}:COUNT_SUCCESS`]: countSuccess,
    [`@${name}:COUNT_FAIL`]: countFail,

    [`@${name}:CLEAN`]: clean,
  };

  return {
    getReducer: () => createReducer(handlers, createInitState(initialState)),
    getHandlers: () => handlers,
  };
};
