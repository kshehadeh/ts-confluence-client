import {Resource} from "./index";
import {AtlassianUser} from "./types";

export class GroupApi extends Resource {

    protected getRoot() {
        return "/rest/api/group";
    }

    public getGroupMembers(groupName: string) {
        return this.getAll<AtlassianUser>({
            id: `${groupName}/member`
        });
    }
}
