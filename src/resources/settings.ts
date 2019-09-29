import {Resource} from "./index";

export  class Settings extends Resource {

    protected getRoot() {
        return "/rest/api/settings";
    }
}
