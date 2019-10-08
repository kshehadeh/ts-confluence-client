import {Resource} from "./index";

export  class Settings extends Resource {

    protected getRoot() {
        return "/rest/api/settings";
    }
}

export class Theme extends Resource {
    protected getRoot() {
        return "/rest/api/settings/theme";
    }

    public getGlobalTheme() {
        return this.getOne("selected");
    }

    public getTheme(themeKey: string): Promise<object> {
        return this.getAll({id:themeKey}).then((themes: []) => {
            if (themes.length > 0) {
                return themes.pop();
            }
            else {
                return null;
            }
        });
    }

}
