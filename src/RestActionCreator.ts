import { AbstractRestActionCreator } from "./AbstractRestActionCreator";
import {
  RestActionCreatorRequest,
  RestActionCreatorResponse,
  UpdateOptions
} from "./interfaces";

export class RestActionCreator<T, F> extends AbstractRestActionCreator<
  RestActionCreatorRequest<T, F>
> {
  private getCountAction(): (
    filter?: F
  ) => (
    dispatch: Function
  ) => Promise<RestActionCreatorResponse<{ count: number }>> {
    return (filter?: F & { where?: any }) => (dispatch: Function) => {
      const actionType = "COUNT";
      return this.wrapRequestWithPromiseResolvers<{ count: number }>(
        this.requestObject.count(
          filter && filter.where ? filter.where : undefined
        ),
        dispatch,
        actionType
      );
    };
  }

  public getListAction(): (
    filter?: F
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T[]>> {
    return (filter?: F) => (dispatch: Function) => {
      const actionType = "LIST";
      return this.wrapRequestWithPromiseResolvers<T[]>(
        this.requestObject.getAll(filter),
        dispatch,
        actionType
      );
    };
  }

  public getListAndCountAction(): (
    filter?: F
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T[]>> {
    return (filter?: F) => (dispatch: Function) => {
      dispatch(this.getCountAction()(filter));
      return dispatch(this.getListAction()(filter));
    };
  }

  private getCreateActionMethod(
    body: T,
    dispatch: Function,
    redirectURL?: string,
    skipRedirect?: boolean
  ): Promise<RestActionCreatorResponse<T>> {
    const actionType = "CREATE";
    return this.wrapRequestWithPromiseResolvers<T>(
      this.requestObject.create(body),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect
    );
  }

  private getFetchActionMethod(
    id: string | number,
    dispatch: Function,
    filter?: F
  ): Promise<RestActionCreatorResponse<T>> {
    const actionType = "FETCH";
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.getById(id, filter),
      dispatch,
      actionType
    );
  }

  private getUpdateActionMethod(
    id: string | number,
    body: T,
    dispatch: Function,
    redirectURL?: string,
    skipRedirect?: boolean
  ): Promise<RestActionCreatorResponse<T>> {
    const actionType = "UPDATE";
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.update(id, body),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect
    );
  }

  private getDeleteActionMethod(
    id: string | number,
    dispatch: Function,
    question: string,
    redirectURL?: string,
    skipRedirect?: boolean
  ): Promise<RestActionCreatorResponse<T>> {
    // eslint-disable-next-line
    if (!confirm(question)) {
      return Promise.resolve({
        error: new Error("User didn't confirm request")
      });
    }
    const actionType = "DELETE";
    return this.wrapRequestWithPromiseResolvers(
      this.requestObject.delete(id),
      dispatch,
      actionType,
      redirectURL,
      skipRedirect
    );
  }

  getCreateAction(
    redirectURL?: string
  ): (
    body: T,
    redirect?: string,
    skipRedirect?: boolean
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T>> {
    return (body: T, redirect?: string, skipRedirect?: boolean) => (
      dispatch: Function
    ) =>
      this.getCreateActionMethod(
        body,
        dispatch,
        redirect || redirectURL,
        skipRedirect
      );
  }

  getFetchAction(): (
    id: string | number,
    filter?: F
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T>> {
    return (id: string | number, filter?: F) => (dispatch: Function) =>
      this.getFetchActionMethod(id, dispatch, filter);
  }

  getUpdateAction(
    redirectURL?: string
  ): (
    id: string | number,
    body: T,
    options?: UpdateOptions
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T>> {
    return (id: string | number, body: T, options: UpdateOptions = {}) => (
      dispatch: Function
    ) =>
      this.getUpdateActionMethod(
        id,
        body,
        dispatch,
        options.redirect || redirectURL,
        options.skipRedirect
      );
  }

  getDeleteAction(
    question: string,
    redirectURL?: string
  ): (
    id: string | number,
    filter?: F,
    redirect?: string,
    skipRedirect?: boolean
  ) => (dispatch: Function) => Promise<RestActionCreatorResponse<T[]>> {
    return (
      id: string | number,
      filter?: F,
      redirect?: string,
      skipRedirect?: boolean
    ) => (dispatch: Function) =>
      this.getDeleteActionMethod(
        id,
        dispatch,
        question,
        redirect || redirectURL,
        skipRedirect
      ).then(() => this.getListAndCountAction()(filter)(dispatch));
  }

  getClearAction() {
    return () => ({
      type: `${this.contexts}:CLEAR`
    });
  }
}
