import {Content} from "./resources/content";
import {Group} from "./resources/group";
import {Settings, Theme} from "./resources/settings";
import {Space} from "./resources/space";
import {config} from "dotenv";
import {User} from "./resources/user";

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
    public groups: Group;
    public users: User;

    public constructor(connection: ConfConnectionInfo) {
        this._connection = connection;
        this.space = new Space(this._connection);
        this.settings = new Settings(this._connection);
        this.themes = new Theme(this._connection);
        this.content = new Content(this._connection);
        this.groups = new Group(this._connection);
        this.users = new User(this._connection);
    }

    get connection(): ConfConnectionInfo {
        return this._connection;
    }
}

