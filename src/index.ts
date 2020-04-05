import {ContentApi} from "./resources/contentApi";
import {GroupApi} from "./resources/groupApi";
import {SettingsApi, ThemeApi} from "./resources/settingsApi";
import {SpaceApi} from "./resources/spaceApi";
import {config} from "dotenv";
import {UserApi} from "./resources/userApi";
import { SearchApi } from './resources/searchApi';
import { AxiosInstance } from 'axios';

config();

export type ConfConnectionInfo = {
    host: string,
    username?: string,
    apiToken?: string,
    accessToken?: string
}

/**
 * The Confluence API manager.  Instantiate this to interact with the API.
 */
export class Confluence {
    protected _connection: ConfConnectionInfo;
    public space: SpaceApi;
    public settings: SettingsApi;
    public themes: ThemeApi;
    public content: ContentApi;
    public groups: GroupApi;
    public users: UserApi;
    public search: SearchApi;

    public constructor(connection: ConfConnectionInfo, axiosInstance?: AxiosInstance) {
        this._connection = connection;
        this.space = new SpaceApi(this._connection, axiosInstance);
        this.settings = new SettingsApi(this._connection, axiosInstance);
        this.themes = new ThemeApi(this._connection, axiosInstance);
        this.content = new ContentApi(this._connection, axiosInstance);
        this.groups = new GroupApi(this._connection, axiosInstance);
        this.users = new UserApi(this._connection, axiosInstance);
        this.search = new SearchApi(this._connection, axiosInstance);
    }

    get connection(): ConfConnectionInfo {
        return this._connection;
    }
}

