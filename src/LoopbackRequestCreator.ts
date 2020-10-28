import Axios from 'axios';

export interface LoopbackFilter {
  where?: any;
  order?: string;
  include?: string | string[];
  limit?: number;
  skip?: number;
}

export type GetAllRequest<T> = (filter?: LoopbackFilter) => Promise<T[]>;
export type CountRequest = (filter?: LoopbackFilter) => Promise<CountResponse>;
export type GetByIdRequest<T> = (id: string | number, filter?: LoopbackFilter) => Promise<T>;
export type CreateRequest<T> = (body: T) => Promise<T>;
export type UpdateRequest<T> = (id: string | number, body: Partial<T>) => Promise<T>;
export type DeleteRequest = (id: string | number) => Promise<DeleteResponse>;

export interface RequestsObject<T> {
  getAll: GetAllRequest<T>;
  count: CountRequest;
  getById: GetByIdRequest<T>;
  create: CreateRequest<T>;
  update: UpdateRequest<T>;
  delete: DeleteRequest;
}

export type CleanBody<T> = (data: Partial<T>) => Partial<T>;

export type CountResponse = { count: number };
export type DeleteResponse = { id: string | number };

const defaultCleanBody = (data: any) => {
  delete data.id; // eslint-disable-line no-param-reassign
  return data;
};

export const loopbackCleanBody = defaultCleanBody;

export const loopbackRequestCreator = <T extends {}>(
  url: string,
  cleanBody: CleanBody<T> = defaultCleanBody
): RequestsObject<T> => ({
  // Get all records
  getAll: (filter?: LoopbackFilter) =>
    Axios.get<T[]>(url, { params: { filter } }).then((r) => Promise.resolve(r.data)),

  // Count
  count: (filter?: LoopbackFilter) =>
    Axios.get<CountResponse>(
      `${url}/count`,
      filter && filter.where ? { params: { where: filter.where } } : undefined
    ).then((r) => Promise.resolve(r.data)),

  // Get record by id
  getById: (id: string | number, filter?: LoopbackFilter) =>
    Axios.get<T>(`${url}/${id}`, { params: { filter } }).then((r) => Promise.resolve(r.data)),

  // Delete record by id
  delete: (id: string | number) =>
    Axios.delete<string | number>(`${url}/${id}`).then(() => Promise.resolve({ id })),

  // create record by id
  create: (body: T) => Axios.post<T>(url, cleanBody(body)).then((r) => Promise.resolve(r.data)),

  // update record by id
  update: (id: string | number, body: Partial<T>) =>
    Axios.patch<T>(`${url}/${id}`, cleanBody(body)).then((r) => Promise.resolve(r.data)),
});
