import {Resource} from "./index";

export class SpaceApi extends Resource {

    protected getRoot() {
        return "/rest/api/space";
    }
}
