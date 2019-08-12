import Axios, { AxiosResponse, AxiosPromise } from 'axios';

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

const defaultCleanRequestBody = (data: any) => {
  delete data.id;
  return data;
};

class RequestRestObjectCreator<T>{
  url: string;
  cleanRequestBody: (data: T) => T

  constructor(url: string, cleanRequestBody?: (data: T) => T) {
    this.url = url;
    this.cleanRequestBody = cleanRequestBody || defaultCleanRequestBody;
  }

  private response<R>(data: R): Promise<R> {
    return Promise.resolve(data);
  }

  private handleArrayResponse(r: AxiosResponse): Promise<T[]> {
    return this.response<T[]>(r.data);
  }

  private handleResponse(r: AxiosResponse): Promise<T> {
    return this.response<T>(r.data);
  }

  private getUrlWithEnd(end: string | number): string {
    return `${this.url}/${end}`;
  }

  private getRequest(url: string, filter?: LoopbackFilter, key: string = 'filter'): AxiosPromise {
    return Axios.get(url, { params: { [key]: filter } });
  }

  getAll(filter?: LoopbackFilter): Promise<T[]> {
    return this.getRequest(this.url, filter)
      .then(this.handleArrayResponse.bind(this));
  }

  getById(id: string | number, filter?: LoopbackFilter): Promise<T> {
    return this.getRequest(this.getUrlWithEnd(id), filter)
      .then(this.handleResponse.bind(this));
  }

  delete(id: string | number): Promise<T> {
    return Axios.delete(this.getUrlWithEnd(id))
      .then(this.handleResponse.bind(this));
  }

  create(body: T): Promise<T> {
    return Axios.post(this.url, this.cleanRequestBody(body))
      .then(this.handleResponse.bind(this));
  }

  update(id: string | number, body: T): Promise<T> {
    return Axios.patch(this.getUrlWithEnd(id), this.cleanRequestBody(body))
      .then(this.handleResponse.bind(this));
  }

  count(filter?: LoopbackFilter): Promise<{ count: number }> {
    return this.getRequest(this.getUrlWithEnd('count'), filter, 'where')
      .then((r: AxiosResponse) => this.response<{ count: number }>(r.data));
  }

  getRequests(): RequestRestObjectCreatorRequests<T> {
    return {
      getAll: (filter?: LoopbackFilter) => this.getAll(filter),
      getById: (id: string | number, filter?: LoopbackFilter) => this.getById(id, filter),
      create: (body: T) => this.create(body),
      count: (filter?: any) => this.count(filter),
      update: (id: string | number, body: T) => this.update(id, body),
      delete: (id: string | number) => this.delete(id),
    };
  }
}

export default RequestRestObjectCreator;
