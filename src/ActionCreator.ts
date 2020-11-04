import { DeleteResponse, LoopbackFilter, RequestsObject } from './LoopbackRequestCreator';

export interface ActionOptions {
  redirect?: string;
}

type CreateMiddleware<T> = (body: T, dispatch: any) => Promise<T>;
type UpdateMiddleware<T> = CreateMiddleware<Partial<T>>;

export type ActionType = 'COUNT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'FETCH' | 'LIST';

export type ListAndCountAction<T> = () => (
  filter?: LoopbackFilter,
  options?: ActionOptions
) => (dispatch: Function) => Promise<T[]>;

export type FetchAction<T> = () => (
  id: string | number,
  filter?: LoopbackFilter,
  options?: ActionOptions
) => (dispatch: Function) => Promise<T>;

export type CreateAction<T> = (
  redirect?: string,
  middleware?: CreateMiddleware<T>,
  handleMiddlewarePreLoading?: boolean
) => (body: T, options?: ActionOptions) => (dispatch: Function) => Promise<T>;

export type UpdateAction<T> = (
  redirect?: string,
  middleware?: UpdateMiddleware<T>,
  handleMiddlewarePreLoading?: boolean
) => (
  id: string | number,
  body: Partial<T>,
  options?: ActionOptions
) => (dispatch: Function) => Promise<T>;

export type DeleteAction = (
  redirect?: string,
  question?: string
) => (id: string | number, options?: ActionOptions) => (dispatch: Function) => Promise<any>;

export interface ActionObject<T> {
  getFindAndCountAction: ListAndCountAction<T>;
  getFindByIdAction: FetchAction<T>;
  getCreateAction: CreateAction<T>;
  getUpdateAction: UpdateAction<T>;
  getDeleteAction: DeleteAction;
  getCleanAction(): () => { type: string };
}

export const actionCreator = <T extends { id: string | number }>(
  reduxContext: string,
  requests: RequestsObject<T>,
  onRedirect?: (url: string) => void,
  errorHandler?: (e: Error, dispatch: Function) => void,
  onSuccess?: (event: ActionType, dispatch: Function, data: T | DeleteResponse) => any,
  suppressReject: boolean = false
): ActionObject<T> => {
  /**
   * Type creator
   */
  const typeCreator = (action: ActionType) => ({
    TYPE: action,
    request: `@${reduxContext}:${action}_REQUEST`,
    success: `@${reduxContext}:${action}_SUCCESS`,
    fail: `@${reduxContext}:${action}_FAIL`,
  });

  type TypeCreator = ReturnType<typeof typeCreator>;

  /**
   * Handle Request error
   */
  const handleError = (dispatch: Function, reject: (e: Error) => void, type: string) => (
    e: Error
  ) => {
    dispatch({ type });
    if (errorHandler) errorHandler(e, dispatch);
    if (!suppressReject) return reject(e);
  };

  /**
   * Handle Request error
   */
  const handleRedirectSuccess = (
    dispatch: Function,
    resolve: (data: T) => void,
    type: TypeCreator,
    redirect?: string,
    options?: ActionOptions
  ) => (data: T) => {
    dispatch({ type: type.success, payload: data });
    if (onSuccess) onSuccess(type.TYPE, dispatch, data);
    if (onRedirect) {
      if (options && options.redirect)
        dispatch(onRedirect(options.redirect.replace(':id', `${data.id}`)));
      else if (redirect) dispatch(onRedirect(redirect.replace(':id', `${data.id}`)));
    }
    return resolve(data);
  };

  /**
   * Handle Request error
   */
  const handleDeleteRedirectSuccess = (
    dispatch: Function,
    resolve: (data: DeleteResponse) => void,
    type: TypeCreator,
    redirect?: string,
    options?: ActionOptions
  ) => (data: DeleteResponse) => {
    dispatch({ type: type.success, payload: data });
    if (onSuccess) onSuccess(type.TYPE, dispatch, data);
    if (onRedirect) {
      if (options && options.redirect)
        dispatch(onRedirect(options.redirect.replace(':id', `${data.id}`)));
      else if (redirect) dispatch(onRedirect(redirect.replace(':id', `${data.id}`)));
    }
    return resolve(data);
  };

  /**
   * Count action
   */
  const countRequest = (dispatch: Function, filter?: LoopbackFilter) => {
    const tc = typeCreator('COUNT');
    dispatch({ type: tc.request });
    return new Promise((resolve, reject) => {
      requests
        .count(filter)
        .then((data) => {
          dispatch({ type: tc.success, payload: data });
          resolve();
        })
        .catch(handleError(dispatch, reject, tc.fail));
    });
  };

  return {
    /**
     * Create Action
     */
    getCreateAction: (
      redirect?: string,
      middleware?: CreateMiddleware<T>,
      handleMiddlewarePreLoading: boolean = false
    ) => (body: T, options?: ActionOptions) => (dispatch: Function) => {
      const tc = typeCreator('CREATE');
      if (!handleMiddlewarePreLoading) dispatch({ type: tc.request });
      return new Promise((resolve, reject) => {
        let mid = (b: T, _: any) => Promise.resolve(b);

        if (middleware) mid = middleware;

        mid(body, dispatch)
          .then((b) => {
            if (handleMiddlewarePreLoading) dispatch({ type: tc.request });
            return requests.create(b);
          })
          .then(handleRedirectSuccess(dispatch, resolve, tc, redirect, options))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * Update Action
     */
    getUpdateAction: (
      redirect?: string,
      middleware?: UpdateMiddleware<T>,
      handleMiddlewarePreLoading: boolean = false
    ) => (id: string | number, body: Partial<T>, options?: ActionOptions) => (
      dispatch: Function
    ) => {
      const tc = typeCreator('UPDATE');
      if (!handleMiddlewarePreLoading) dispatch({ type: tc.request });

      return new Promise((resolve, reject) => {
        let mid = (b: Partial<T>, _: any) => Promise.resolve(b);

        if (middleware) mid = middleware;

        mid(body, dispatch)
          .then((b) => {
            if (handleMiddlewarePreLoading) dispatch({ type: tc.request });
            return requests.update(id, b);
          })
          .then(handleRedirectSuccess(dispatch, resolve, tc, redirect, options))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * Delete Action
     */
    getDeleteAction: (redirect?: string, question?: string) => (
      id: string | number,
      options?: ActionOptions
    ) => (dispatch: Function) => {
      const tc = typeCreator('DELETE');
      dispatch({ type: tc.request });
      if (question) {
        if (!confirm(question)) return Promise.reject();
      }
      return new Promise((resolve, reject) => {
        requests
          .delete(id)
          .then(handleDeleteRedirectSuccess(dispatch, resolve, tc, redirect, options))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * Fetch Action
     */
    getFindByIdAction: () => (id: string | number, filter?: LoopbackFilter) => (
      dispatch: Function
    ) => {
      const tc = typeCreator('FETCH');
      dispatch({ type: tc.request });
      return new Promise((resolve, reject) => {
        requests
          .getById(id, filter)
          .then(handleRedirectSuccess(dispatch, resolve, tc))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * List And Count Action
     */
    getFindAndCountAction: () => (filter?: LoopbackFilter) => (dispatch: Function) => {
      const tl = typeCreator('LIST');
      dispatch({ type: tl.request });
      countRequest(dispatch, filter);
      return new Promise((resolve, reject) => {
        requests
          .getAll(filter)
          .then((data) => {
            dispatch({ type: tl.success, payload: data });
            resolve(data);
          })
          .catch(handleError(dispatch, reject, tl.fail));
      });
    },

    /**
     * Clean
     */
    getCleanAction: () => () => ({
      type: `@${reduxContext}:CLEAN`,
    }),
  };
};
