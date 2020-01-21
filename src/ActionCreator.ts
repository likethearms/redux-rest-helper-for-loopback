import { LoopbackFilter, RequestsObject } from './RequestCreator';

export interface ActionOptions {
  redirect?: string;
}

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
  redirect?: string
) => (body: T, options?: ActionOptions) => (dispatch: Function) => Promise<T>;

export type UpdateAction<T> = (
  redirect?: string
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
  getListAndCountAction: ListAndCountAction<T>;
  getFetchAction: FetchAction<T>;
  getCreateAction: CreateAction<T>;
  getUpdateAction: UpdateAction<T>;
  getDeleteAction: DeleteAction;
  getCleanAction(): () => { type: string };
}

export const actionCreator = <T extends { id: string | number }>(
  reduxContext: string,
  requests: RequestsObject<T>,
  onRedirect?: (url: string) => void,
  errorHandler?: (e: Error, dispatch: Function) => void
): ActionObject<T> => {
  /**
   * Type creator
   */
  const typeCreator = (action: string) => ({
    request: `@${reduxContext}:${action}_REQUEST`,
    success: `@${reduxContext}:${action}_SUCCESS`,
    fail: `@${reduxContext}:${action}_FAIL`,
  });

  /**
   * Handle Request error
   */
  const handleError = (dispatch: Function, reject: (e: Error) => void, type: string) => (
    e: Error
  ) => {
    dispatch({ type });
    if (errorHandler) errorHandler(e, dispatch);
    return reject(e);
  };

  /**
   * Handle Request error
   */
  const handleRedirectSuccess = (
    dispatch: Function,
    resolve: (data: T) => void,
    type: string,
    redirect?: string,
    options?: ActionOptions
  ) => (data: T) => {
    dispatch({ type, payload: data });
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
    getCreateAction: (redirect?: string) => (body: T, options?: ActionOptions) => (
      dispatch: Function
    ) => {
      const tc = typeCreator('CREATE');
      dispatch({ type: tc.request });
      return new Promise((resolve, reject) => {
        requests
          .create(body)
          .then(handleRedirectSuccess(dispatch, resolve, tc.success, redirect, options))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * Update Action
     */
    getUpdateAction: (redirect?: string) => (
      id: string | number,
      body: Partial<T>,
      options?: ActionOptions
    ) => (dispatch: Function) => {
      const tc = typeCreator('UPDATE');
      dispatch({ type: tc.request });
      return new Promise((resolve, reject) => {
        requests
          .update(id, body)
          .then(handleRedirectSuccess(dispatch, resolve, tc.success, redirect, options))
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
          .then(handleRedirectSuccess(dispatch, resolve, tc.success, redirect, options))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * Fetch Action
     */
    getFetchAction: () => (id: string | number, filter?: LoopbackFilter) => (
      dispatch: Function
    ) => {
      const tc = typeCreator('FETCH');
      dispatch({ type: tc.request });
      return new Promise((resolve, reject) => {
        requests
          .getById(id, filter)
          .then(handleRedirectSuccess(dispatch, resolve, tc.success))
          .catch(handleError(dispatch, reject, tc.fail));
      });
    },

    /**
     * List And Count Action
     */
    getListAndCountAction: () => (filter?: LoopbackFilter) => (dispatch: Function) => {
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
