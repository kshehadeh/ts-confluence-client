import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {ConfConnectionInfo} from "..";

const GET = 'get';
const POST = 'post';
const PUT = 'put';
const DELETE = 'delete';

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

export abstract class Resource {
    pageSize: number = 50;
    connection: ConfConnectionInfo;

    constructor(connection: ConfConnectionInfo, pageSize: number = 50) {
        this.connection = connection;
        this.pageSize = pageSize;
    }

    /**
     * Makes a request using an http client library.  If the action is GET then
     * the data is interpreted to be parameters and appended to the URL.  Otherwise,
     * it will be used as the json body of the request.
     * @param action
     * @param url
     * @param data
     */
    protected async makeRequest(action: string, url: string, data: object = {}) {
        const cfg = {
            method: action,
            url: url,
            data: action === GET ? null : data,
            params: action === GET ? data : null,
            auth: {
                username: this.connection.username,
                password: this.connection.apiToken
            }
        };
        console.log(cfg);
        return axios(cfg as AxiosRequestConfig);
    }

    public async create(data: object): Promise<object> {
        return this.makeRequest(POST, this.getRequestUrl(), data)
            .then((response: AxiosResponse<object>) => {
                return response.data;
            });
    }

    public async update(id: string, data: object): Promise<object> {
        return this.makeRequest(PUT, this.getRequestUrl(id), data)
            .then((response: AxiosResponse<object>) => {
                return response.data;
            });
    }

    public async remove(id: string): Promise<boolean> {
        return this.makeRequest(DELETE, this.getRequestUrl(id))
            .then((response: AxiosResponse<object>) => {
                return (response.status >= 200 && response.status < 300);
            });
    }

    /**
     * Call to get a single item in a collection.  This assumes that a standard CRUD interface
     * exists for the call as in api/<resource>/<id>
     * @param id
     */
    public async getOne(id: string): Promise<object> {
        return this.makeRequest(GET, this.getRequestUrl(id))
            .then((response: AxiosResponse<object>) => {
                return response.data;
            });
    }

    /**
     * This  will get a single page of results.  To get all pages, use getAll
     * @param start The starting index
     * @param limit The total number of items to return (defaults to this.pageSize)
     */
    public async getPage(start: number, limit?: number): Promise<IResourceResponse> {
        limit = limit ? limit : this.pageSize;

        return this.makeRequest(GET, this.getRequestUrl(), {
            start,
            limit
        })
            .then((response: AxiosResponse<IResourceResponse | IErrorResponse>) => {
                if (response.status != 200) {
                    throw response.data as IErrorResponse;
                } else {
                    return response.data as IResourceResponse;
                }
            });
    }

    /**
     * This will make a request for the resources with a count of 0 just
     * to get the total.  It returns a promise.
     */
    public async getTotal(): Promise<number> {
        return this.getPage(0, 0).then(
            (response: IResourceResponse) => {
                return response.size;
            });
    }

    /**
     * Will get all results from the server.  It does this by checking the total available then
     * paging through the results on your  behalf and returning a single array.  If there could
     * be *a lot* of results (thousands) then you should stop doing what you're doing and use a different
     * approach.
     */
    public async getAll(): Promise<any> {
        const total = await this.getTotal();

        // What's happening:
        //  + We're calculating the total number of times we need to page the results (it is a total/batchsize + 1 if
        //  there's a remainder.
        //  + Then we are iterating over each 'batch' and waiting for the response from the server before
        //  getting the next.  Opting to do this rather than running concurrently to avoid bashing the  server.

        const remainder = (total % this.pageSize);
        const pageCount = total / this.pageSize + (remainder > 0 ? 1 : 0);
        let results: [] = [];
        for (let i = 0; i < pageCount; i++) {
            let start = i * this.pageSize;
            const response: IResourceResponse = await this.getPage(start, this.pageSize);
            results.push(...response.results);
        }

        return results;
    }

    /**
     * Builds the URL using the host config for confluence, the resource root for the resource
     * and the ID, if given.
     * @param id The ID to get (optional)
     */
    protected getRequestUrl(id?: string): string {
        const root = `${this.connection.host}${this.getRoot()}/`;
        if (id) {
            return `${root}${id}`;
        }
        return root;
    }

    protected abstract getRoot();
}
