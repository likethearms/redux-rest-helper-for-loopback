import { AxiosError } from 'axios';

export enum RestActionEventTypes {
  REQUEST = 'REQUEST',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

export interface RestActionCreatorResponse<T = undefined> {
  data?: T;
  error?: Error;
}

export interface UpdateOptions {
  redirect?: string;
  skipRedirect?: boolean;
}

abstract class AbstractRestActionCreator<RequestObject> {
  context: string;
  requestObject: RequestObject;
  errorHandler?: (e: Error) => void;
  redirectHandler?: (url: string) => void;
  onSuccess?: (actionType: string, dispatch: Function) => void

  constructor(
    context: string,
    requestObject: RequestObject,
    errorHandler?: (e: Error) => void,
    redirectHandler?: (url: string) => void,
    onSuccess?: (actionType: string, dispatch: Function) => void) {
    this.context = context;
    this.requestObject = requestObject;
    this.errorHandler = errorHandler;
    this.redirectHandler = redirectHandler;
    this.onSuccess = onSuccess;
  }

  protected getActionType(action: string, event: RestActionEventTypes): string {
    return `@${this.context}:${action}_${event}`;
  }

  private handleSuccessRequest<F>(
    dispatch: Function,
    actionType: string,
    redirectURL?: string,
    skipRedirect?: boolean): (r: F) => Promise<RestActionCreatorResponse<F>> {
    return (payload: F) => {
      dispatch({
        payload,
        type: this.getActionType(actionType, RestActionEventTypes.SUCCESS),
      });
      if (!skipRedirect && redirectURL && this.redirectHandler) dispatch(this.redirectHandler(redirectURL));
      if (this.onSuccess) this.onSuccess(actionType, dispatch);
      return Promise.resolve({ data: payload });
    };
  }

  private handleFailRequest<F>(
    dispatch: Function,
    actionType: string): (error: AxiosError) => Promise<RestActionCreatorResponse<F>> {
    return (error: AxiosError) => {
      dispatch({ type: this.getActionType(actionType, RestActionEventTypes.FAIL) });
      if (this.errorHandler) dispatch(this.errorHandler(error));
      return Promise.resolve({ error });
    };
  }

  protected wrapRequestWithPromiseResolvers<F>(
    request: Promise<F>,
    dispatch: Function,
    actionType: string,
    redirectURL?: string,
    skipRedirect?: boolean): Promise<RestActionCreatorResponse<F>> {
    dispatch({ type: this.getActionType(actionType, RestActionEventTypes.REQUEST) });
    return request
      .then(this.handleSuccessRequest<F>(dispatch, actionType, redirectURL, skipRedirect))
      .catch(this.handleFailRequest<F>(dispatch, actionType));
  }
}

export interface RestActionCreatorRequest<T, F> {
  getAll: (filter?: F) => Promise<T[]>;
  count: (filter?: { where: any }) => Promise<{ count: number }>;
  getById: (id: string | number, filter?: F) => Promise<T>;
  create: (body: T) => Promise<T>;
  update: (id: string | number, body: T) => Promise<T>;
  delete: (id: string | number) => Promise<T>;
}

class RestActionCreator<T, F>
  extends AbstractRestActionCreator<RestActionCreatorRequest<T, F>> {
  private getCountAction(): (filter?: F)
    => (dispatch: Function) => Promise<RestActionCreatorResponse<{ count: number }>> {
    return (filter?: F & { where?: any }) => (dispatch: Function) => {
      const actionType = 'COUNT';
      return this.wrapRequestWithPromiseResolvers<{ count: number }>(
        this.requestObject.count(filter && filter.where ? filter.where : undefined),
        dispatch,
        actionType);
    };
  }

  public getListAction():
    (filter?: F) =>
      (dispatch: Function) =>
        Promise<RestActionCreatorResponse<T[]>> {
    return (filter?: F) =>
      (dispatch: Function) => {
        const actionType = 'LIST';
        return this.wrapRequestWithPromiseResolvers<T[]>(
          this.requestObject.getAll(filter),
          dispatch,
          actionType);
      };
  }

  public getListAndCountAction():
    (filter?: F) =>
      (dispatch: Function) =>
        Promise<RestActionCreatorResponse<T[]>> {
    return (filter?: F) =>
      (dispatch: Function) => {
        dispatch(this.getCountAction()(filter));
        return dispatch(this.getListAction()(filter));
      };
  }

  private getCreateActionMethod(
    body: T,
    dispatch: Function,
    redirectURL?: string,
    skipRedirect?: boolean): Promise<RestActionCreatorResponse<T>> {
    const actionType = 'CREATE';
    return this.wrapRequestWithPromiseResolvers<T>(
      this.requestObject.create(body),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect);
  }

  private getFetchActionMethod(
    id: string | number,
    dispatch: Function,
    filter?: F): Promise<RestActionCreatorResponse<T>> {
    const actionType = 'FETCH';
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.getById(id, filter),
      dispatch,
      actionType);
  }

  private getUpdateActionMethod(id: string | number, body: T, dispatch: Function, redirectURL?: string, skipRedirect?: boolean):
    Promise<RestActionCreatorResponse<T>> {
    const actionType = 'UPDATE';
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.update(id, body),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect);
  }

  private getDeleteActionMethod(
    id: string | number,
    dispatch: Function,
    question: string,
    redirectURL?: string,
    skipRedirect?: boolean): Promise<RestActionCreatorResponse<T>> {
    if (!confirm(question)) {
      return Promise.resolve({ error: new Error('User didn\'t confirm request') });
    }
    const actionType = 'DELETE';
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.delete(id),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect);
  }

  getCreateAction(redirectURL?: string):
    (body: T, redirect?: string, skipRedirect?: boolean) =>
      (dispatch: Function) =>
        Promise<RestActionCreatorResponse<T>> {
    return (body: T, redirect?: string, skipRedirect?: boolean) =>
      (dispatch: Function) =>
        this.getCreateActionMethod(body, dispatch, redirect || redirectURL, skipRedirect);
  }

  getFetchAction(): (id: string | number, filter?: F) => (dispatch: Function) => Promise<RestActionCreatorResponse<T>> {
    return (id: string | number, filter?: F) => (dispatch: Function) => this.getFetchActionMethod(id, dispatch, filter);
  }

  getUpdateAction(redirectURL?: string):
    (id: string | number, body: T, options?: UpdateOptions) =>
      (dispatch: Function) =>
        Promise<RestActionCreatorResponse<T>> {
    return (id: string | number, body: T, options: UpdateOptions = {}) =>
      (dispatch: Function) =>
        this.getUpdateActionMethod(id, body, dispatch, options.redirect || redirectURL, options.skipRedirect)
  }

  getDeleteAction(question: string, redirectURL?: string):
    (id: string | number, filter?: F, redirect?: string, skipRedirect?: boolean) =>
      (dispatch: Function) =>
        Promise<RestActionCreatorResponse<T[]>> {
    return (id: string | number, filter?: F, redirect?: string, skipRedirect?: boolean) =>
      (dispatch: Function) =>
        this.getDeleteActionMethod(id, dispatch, question, redirect || redirectURL, skipRedirect)
          .then(() => this.getListAndCountAction()(filter)(dispatch));
  }
}

export default RestActionCreator;
