import { AxiosError } from "axios";
import { RestActionEventTypes, RestActionCreatorResponse } from "./interfaces";

export abstract class AbstractRestActionCreator<RequestObject> {
  contexts: string;

  requestObject: RequestObject;

  errorHandler?: (e: Error) => void;

  redirectHandler?: (url: string) => void;

  onSuccess?: (actionType: string, dispatch: Function) => void;

  constructor(
    context: string,
    requestObject: RequestObject,
    errorHandler?: (e: Error) => void,
    redirectHandler?: (url: string) => void,
    onSuccess?: (actionType: string, dispatch: Function) => void
  ) {
    this.contexts = context;
    this.requestObject = requestObject;
    this.errorHandler = errorHandler;
    this.redirectHandler = redirectHandler;
    this.onSuccess = onSuccess;
  }

  protected getActionType(action: string, event: RestActionEventTypes): string {
    return `@${this.contexts}:${action}_${event}`;
  }

  private handleSuccessRequest<F>(
    dispatch: Function,
    actionType: string,
    redirectURL?: string,
    skipRedirect?: boolean
  ): (r: F) => Promise<RestActionCreatorResponse<F>> {
    return (payload: F) => {
      dispatch({
        payload,
        type: this.getActionType(actionType, RestActionEventTypes.SUCCESS)
      });
      if (!skipRedirect && redirectURL && this.redirectHandler) {
        dispatch(this.redirectHandler(redirectURL));
      }
      if (this.onSuccess) this.onSuccess(actionType, dispatch);
      return Promise.resolve({ data: payload });
    };
  }

  private handleFailRequest<F>(
    dispatch: Function,
    actionType: string
  ): (error: AxiosError) => Promise<RestActionCreatorResponse<F>> {
    return (error: AxiosError) => {
      dispatch({
        type: this.getActionType(actionType, RestActionEventTypes.FAIL)
      });
      if (this.errorHandler) dispatch(this.errorHandler(error));
      return Promise.resolve({ error });
    };
  }

  protected wrapRequestWithPromiseResolvers<F>(
    request: Promise<F>,
    dispatch: Function,
    actionType: string,
    redirectURL?: string,
    skipRedirect?: boolean
  ): Promise<RestActionCreatorResponse<F>> {
    dispatch({
      type: this.getActionType(actionType, RestActionEventTypes.REQUEST)
    });
    return request
      .then(
        this.handleSuccessRequest<F>(
          dispatch,
          actionType,
          redirectURL,
          skipRedirect
        )
      )
      .catch(this.handleFailRequest<F>(dispatch, actionType));
  }
}
