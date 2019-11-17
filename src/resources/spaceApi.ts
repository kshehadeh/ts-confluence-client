import {Resource} from "./index";
import { Space } from './types';

export enum ExpandableSpaceKey {
    settings = "settings",
    metadata = "metadata",
    operations = "operations",
    lookAndFeel = "lookAndFeel",
    permissions = "permissions",
    icon = "icon",
    description_plain = "description.plain",
    description_view = "description.view",
    theme = "theme",
    homepage = "homepage"
}

export enum SpaceType {
    global= "global",
    personal= "personal"
}

export enum SpaceStatus {
    current= "current",
    archived= "archived"
}

export interface IGetAllSpaceOptions {
    keys?: string[],
    type?: SpaceType,
    status?: SpaceStatus,
    labels?: string[],
    favourite?: boolean,
    favouriteUserKey?: string,
    expand?: ExpandableSpaceKey[]
}

export class SpaceApi extends Resource {

    protected getRoot() {
        return "/rest/api/space";
    }

    public getSpaceByKey(key: string, expand?:ExpandableSpaceKey[]): Promise<Space> {
        return this.getOne<Space>(key,{
            expand: expand
        });
    }

    public getAllSpaces(options?: IGetAllSpaceOptions): Promise<Space[]> {
        if (!options) {
            options = {}
        }

        return this.getAll<Space>({
            params: {
                spaceKey:options.keys ? options.keys.join(",") : null,
                type:options.type,
                status: options.status,
                labels:options.labels ? options.labels.join(",") : null,
                favourite: options.favourite,
                favouriteUserKey: options.favouriteUserKey
            },
            expand: options.expand
        })
    }
}
