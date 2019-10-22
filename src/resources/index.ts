import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios';

const FormData = require('form-data');

import {ConfConnectionInfo} from "..";

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

export interface IResourceResponse {
    results: [],
    start: number,
    limit: number,
    size: number,
    totalSize: number,
    _links: object
}

export interface Error {
    message: {
        translation: string,
        args: []
    }
}

export type IErrorResponse = {
    statusCode: number,
    data: {
        authorized?: boolean,
        valid?: boolean,
        errors?: [Error],
        successful?: boolean
    },
    message?: string
}

export type GetAllParameters = {
    id?: string,
    params?: object,
    expand?: any[]
}

export type CreateUpdateParameters = {
    data: object,
    id?: string,
    contentType?: HttpContentType,
    additionalHeaders?: object
}

export type HttpRequestParameters = {
    url: string,
    action: HttpAction,
    data?: object,
    params?: object,
    contentType?: HttpContentType,
    additionalHeaders?: object
}


export abstract class Resource {
    pageSize: number = 50;
    connection: ConfConnectionInfo;

    constructor(connection: ConfConnectionInfo, pageSize: number = 50) {
        this.connection = connection;
        this.pageSize = pageSize;
    }


    /**
     * Converts an axios response into one that tries to pull more information out of the Atlassian
     * response when it's available.
     * @param err The error that was caught.
     * @returns {IErrorResponse} The new error response that can be thrown.
     */
    protected buildError (err: AxiosError): IErrorResponse {
        if (err.response && err.response.data) {
            return {
                statusCode: err.code ? err.code : err.response.data.statusCode,
                data: err.response.data.data ? err.response.data.data : {},
                message: err.response.data.message ? err.response.data.message : err.message
            } as IErrorResponse;
        }
        else {
            return {
                statusCode: 0,
                data: {},
                message: err.message
            }
        }
    };

    protected async makeRequest(params: HttpRequestParameters) {

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
            auth: {
                username: this.connection.username,
                password: this.connection.apiToken
            }
        };

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

        return axios(cfg as AxiosRequestConfig);
    }

    public async create(params: CreateUpdateParameters): Promise<object> {
        return this.makeRequest({
                action: HttpAction.POST,
                url: this.getRequestUrl(params.id),
                data: params.data,
                contentType: params.contentType ? params.contentType : HttpContentType.Json,
                additionalHeaders: params.additionalHeaders
            }
        )
            .then((response: AxiosResponse<object>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                //throw buildError(err);
                throw this.buildError(err);
            });

    }

    public async update(params: CreateUpdateParameters): Promise<object> {
        return this.makeRequest({
                action: HttpAction.PUT,
                url: this.getRequestUrl(params.id),
                data: params.data,
                contentType: params.contentType ? params.contentType : HttpContentType.Json,
                additionalHeaders: params.additionalHeaders
            }
        )
            .then((response: AxiosResponse<object>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    public async remove(id: string, data?: object, params?: object): Promise<boolean> {
        return this.makeRequest({
            action: HttpAction.DELETE,
            url: this.getRequestUrl(id),
            data: data,
            params: params
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
    public async getOne(id: string, params?:  object): Promise<any> {
        return this.makeRequest({
            action: HttpAction.GET,
            url: this.getRequestUrl(id),
            params: params
        })
            .then((response: AxiosResponse<object>) => {
                return response.data;
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });
    }

    /**
     * This  will get a single page of results.  To get all pages, use getAll
     * @param start The starting index
     * @param limit The total number of items to return (defaults to this.pageSize)
     * @param id (Optional) In some cases, the ID needs to be used to get specific collections of resources.
     * @param params
     * @param expand
     */
    public async getPage(start: number, limit?: number, id?: string, params?: object, expand?: string[]): Promise<IResourceResponse> {
        limit = limit ? limit : this.pageSize;

        const requestUrl = this.getRequestUrl(id,{
            expand: expand ? expand.join(',') : ''
        });

        return this.makeRequest({
            action: HttpAction.GET,
            url: requestUrl,
            params: {
                ...params,
                start,
                limit
            }
        })
            .then((response: AxiosResponse<IResourceResponse | IErrorResponse>) => {
                if (response.status != 200) {
                    throw response.data as IErrorResponse;
                } else {
                    return response.data as IResourceResponse;
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
     * @param id (Optional) In some cases, the ID needs to be used to get specific collections of resources.
     * @param params
     * @param expand
     */
    public async getAll({id, params, expand}: GetAllParameters): Promise<any> {

        // get the total number of items.
        const total = await this.getPage(0, 1, id, params, expand).then(
            (response: IResourceResponse) => {
                return response.size;
            });

        if (!total) {
            return [];
        }

        // What's happening:
        //  + We're calculating the total number of times we need to page the results (it is a total/batchsize + 1 if
        //  there's a remainder.
        //  + Then we are iterating over each 'batch' and waiting for the response from the server before
        //  getting the next.  Opting to do this rather than running concurrently to avoid bashing the  server.

        const remainder = (this.pageSize % total);
        const pageCount = total / this.pageSize + (remainder > 0 ? 1 : 0);
        let results: [] = [];
        for (let i = 0; i < pageCount; i++) {
            let start = i * this.pageSize;
            const response: IResourceResponse = await this.getPage(start, this.pageSize, id, params,expand);
            results.push(...response.results);
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
