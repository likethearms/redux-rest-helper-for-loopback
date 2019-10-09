export enum RestActionEventTypes {
  REQUEST = "REQUEST",
  SUCCESS = "SUCCESS",
  FAIL = "FAIL"
}

export interface RestActionCreatorResponse<T = undefined> {
  data?: T;
  error?: Error;
}

export interface UpdateOptions {
  redirect?: string;
  skipRedirect?: boolean;
}

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

export interface LoopbackFilter {
  where?: any;
  order?: string;
  include?: string | string[];
  limit?: number;
  skip?: number;
}

export interface RequestRestObjectCreatorRequests<T> {
  getAll: (filter?: LoopbackFilter) => Promise<T[]>;
  count: (filter?: any) => Promise<{ count: number }>;
  getById: (id: string | number) => Promise<T>;
  create: (body: T) => Promise<T>;
  update: (id: string | number, body: T) => Promise<T>;
  delete: (id: string | number) => Promise<T>;
}

export interface RestActionCreatorRequest<T, F> {
  getAll: (filter?: F) => Promise<T[]>;
  count: (filter?: { where: any }) => Promise<{ count: number }>;
  getById: (id: string | number, filter?: F) => Promise<T>;
  create: (body: T) => Promise<T>;
  update: (id: string | number, body: T) => Promise<T>;
  delete: (id: string | number) => Promise<T>;
}
