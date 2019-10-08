import {Content} from "./resources/content";
import {Settings, Theme} from "./resources/settings";
import {Space} from "./resources/space";
import {config} from "dotenv";

config();

export type ConfConnectionInfo = {
    host: string,
    username: string,
    apiToken: string
}

export class Confluence {
    protected _connection: ConfConnectionInfo;
    public space: Space;
    public settings: Settings;
    public themes: Theme;
    public content: Content;

    public constructor(connection: ConfConnectionInfo) {
        this._connection = connection;
        this.space = new Space(this._connection);
        this.settings = new Settings(this._connection);
        this.themes = new Theme(this._connection);
        this.content = new Content(this._connection);
    }

    get connection(): ConfConnectionInfo {
        return this._connection;
    }
}

