import {Settings} from "./resources/settings";
import {Space} from "./resources/space";
import {config} from "dotenv";

config();

export type ConfConnectionInfo = {
    host: string,
    username: string,
    apiToken: string
}

export class Confluence {
    protected connection: ConfConnectionInfo;

    public space: Space;
    public settings: Settings;

    public constructor(connection: ConfConnectionInfo) {
        this.connection = connection;
        this.space = new Space(this.connection);
        this.settings = new Settings(this.connection);
    }
}

