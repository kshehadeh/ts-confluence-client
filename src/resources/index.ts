import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { ConfConnectionInfo } from '..';
import { AtlassianCollection, AtlassianError, isAtlassianError, ResponseOrError } from './types';

const FormData = require('form-data');

export enum HttpAction {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export enum HttpContentType {
    Json = 'application/json',
    FormData = 'multipart/form-data'
}

export type GetAllOptions = {
    id?: string,
    params?: object,
    expand?: any[]
}

export type GetPageOptions = {
    start: number,
    limit?: number,
    id?: string,
    params?: any,
    expand?: string[]
}

export type CreateUpdateOptions<T> = {
    data: T,
    id?: string,
    params?: T,
    contentType?: HttpContentType,
    additionalHeaders?: object
}

export type RemoveOptions = {
    id: string,
    data?: object,
    params?: object
}

export type HttpRequestParameters<T> = {
    url: string,
    action: HttpAction,
    data?: T,
    params?: T,
    contentType?: HttpContentType,
    additionalHeaders?: object
}


export abstract class Resource {
    pageSize: number = 50;
    connection: ConfConnectionInfo;
    axiosInstance: AxiosInstance;

    constructor(connection: ConfConnectionInfo, axiosInstance?: AxiosInstance, pageSize: number = 50) {
        this.connection = connection;
        this.axiosInstance = axiosInstance || axios;
        this.pageSize = pageSize;
    }


    /**
     * Converts an axios response into one that tries to pull more information out of the Atlassian
     * response when it's available.
     * @param err The error that was caught.
     * @returns {AtlassianError} The new error response that can be thrown.
     */
    protected buildError(err: AxiosError): AtlassianError {
        if (err.response && err.response.data) {
            return {
                statusCode: err.code ? err.code : err.response.data.statusCode,
                data: err.response.data.data ? err.response.data.data : {},
                message: err.response.data.message ? err.response.data.message : err.message
            } as AtlassianError;
        }
        else {
            return {
                statusCode: 0,
                data: {},
                message: err.message
            }
        }
    };

    protected async makeRequest<T>(params: HttpRequestParameters<T>) {

        if (!params.additionalHeaders) {
            params.additionalHeaders = {}
        }

        const cfg = {
            data: null,
            headers: {
                ...params.additionalHeaders,
                'accept': 'application/json',
                'content-type': params.contentType ? params.contentType : HttpContentType.Json
            },
            method: params.action,
            url: params.url,
            params: params.params,
            auth: undefined
        };
        
        if (this.connection.accessToken) {
            cfg["Authorization"] = `Bearer ${this.connection.accessToken}`;
        } else if (this.connection.username && this.connection.apiToken) {
            cfg.auth = {
                username: this.connection.username,
                password: this.connection.apiToken
            };
        }

        // Axios does not support multipart form data out of the box
        //  so we need to build the body using the FormData object
        //  which will handle separating content with a boundary and
        //  determining the right headers to use.
        if (params.contentType == HttpContentType.FormData) {
            const formDataOb = new FormData();
            Object.keys(params.data).reduce(
                (fd: FormData,k: string)=>{
                    fd.append(k,params.data[k]);return fd;}, formDataOb
            );

            cfg.data = formDataOb;

            // change the content type to include the boundary
            cfg.headers = {
                ...cfg.headers,
                ...formDataOb.getHeaders()
            }
        }
        else {
            cfg.data = params.data
        }
        return this.axiosInstance(cfg as AxiosRequestConfig);
    }

    /**
     * The create method is a template that takes takes two types:
     *  T: This is the type that is being sent into the create function as the data parameter
     *  P: This is the value that is returned in the promise when the call is successful.
     *
     *  For create functions, it is not always the case that the type that is passed as input is the
     *  same type that is received as output.
     * @param params
     */
    public async create<T, P>(params: CreateUpdateOptions<T>): Promise<P> {
        return this.makeRequest<T>({
                action: HttpAction.POST,
                url: this.getRequestUrl(params.id),
                data: params.data,
            params: params.params,
                contentType: params.contentType ? params.contentType : HttpContentType.Json,
                additionalHeaders: params.additionalHeaders
            }
        )
            .then((response: AxiosResponse<P>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    public async update<T>(params: CreateUpdateOptions<T>): Promise<T> {
        return this.makeRequest({
                action: HttpAction.PUT,
                url: this.getRequestUrl(params.id),
                data: params.data,
            params: params.params,
                contentType: params.contentType ? params.contentType : HttpContentType.Json,
                additionalHeaders: params.additionalHeaders
            }
        )
            .then((response: AxiosResponse<T>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    public async remove(opts: RemoveOptions): Promise<boolean> {
        return this.makeRequest({
            action: HttpAction.DELETE,
            url: this.getRequestUrl(opts.id),
            data: opts.data,
            params: opts.params
        })
            .then((response: AxiosResponse<object>) => {
                return (response.status >= 200 && response.status < 300);
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    /**
     * Call to get a single item in a collection.  This assumes that a standard CRUD interface
     * exists for the call as in api/<resource>/<id>
     * @param id
     * @param params
     */
    public async getOne<T>(id: string, params?: any): Promise<T> {
        return this.makeRequest({
            action: HttpAction.GET,
            url: this.getRequestUrl(id),
            params: params
        })
            .then((response: AxiosResponse<T>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });
    }

    /**
     * This  will get a single page of results.  To get all pages, use getAll
     * @param opts
     */
    public async getPage<T>(opts: GetPageOptions): Promise<AtlassianCollection<T> | AtlassianError> {
        opts.limit = opts.limit ? opts.limit : this.pageSize;

        const requestUrl = this.getRequestUrl(opts.id, {
            expand: opts.expand ? opts.expand.join(',') : ''
        });

        return this.makeRequest({
            action: HttpAction.GET,
            url: requestUrl,
            params: {
                ...opts.params,
                start: opts.start,
                limit: opts.limit
            }
        })
            .then((response: AxiosResponse<AtlassianCollection<T> | AtlassianError>) => {
                if (response.status != 200) {
                    throw response.data as AtlassianError;
                } else {
                    return response.data as AtlassianCollection<T>;
                }
            })
            .catch((err: AxiosError) => {
                throw this.buildError (err);
            });
    }

    /**
     * Will get all results from the server.  It does this by checking the total available then
     * paging through the results on your  behalf and returning a single array.  If there could
     * be *a lot* of results (thousands) then you should stop doing what you're doing and use a different
     * approach.
     * @param opts
     */
    public async getAll<T>(opts: GetAllOptions): Promise<T[]> {
        const BATCH_SIZE = 100;
        let results: T[] = [];
        let resultSize = BATCH_SIZE;
        let page = 0;
        let start = 0;
        while (resultSize >= BATCH_SIZE){
            const response: ResponseOrError<AtlassianCollection<T>> = await
                this.getPage({
                    start: start,
                    limit: resultSize,
                    id: opts.id,
                    params: opts.params,
                    expand: opts.expand
                });

            if (isAtlassianError<AtlassianCollection<T>>(response)) {
                return null;
            } else {
                const coll = response as AtlassianCollection<T>;
                results = results.concat(coll.results);
                resultSize = coll.size;
            }
            page += 1;
            start = (page * resultSize)+1;

            // we can assume that if the result size is not equal to the limit
        }

        return results;
    }

    /**
     * Builds the URL using the host config for confluence, the resource root for the resource
     * and the ID, if given.
     * @param id The ID to get (optional)
     * @param queryParams The query parameters to append to the URL
     */
    protected getRequestUrl(id?: string, queryParams?: object): string {
        const root = `${this.connection.host}${this.getRoot()}/`;

        let qsString = "";
        if (queryParams) {
            qsString += encodeURI(Object.keys(queryParams).reduce((paramsSoFar:string,key:string)=>{
                return paramsSoFar + `&${key}=${queryParams[key]}`
            },"?"));
        }

        if (id) {
            return `${root}${id}${qsString}`;
        }
        return `${root}${qsString}`;
    }

    protected abstract getRoot();
}
