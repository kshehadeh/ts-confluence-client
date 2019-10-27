import {Resource} from "./index";

export type AtlassianGroup = {
    type: string,
    name: string,
    _links: any
}

export class Group extends Resource {

    protected getRoot() {
        return "/rest/api/group";
    }

    public getGroupMembers(groupName: string) {
        return this.getAll({
            id: `${groupName}/member`
        });
    }
}
