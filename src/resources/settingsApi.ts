import {Resource} from "./index";

export class SettingsApi extends Resource {

    protected getRoot() {
        return "/rest/api/settings";
    }
}

export class ThemeApi extends Resource {
    protected getRoot() {
        return "/rest/api/settings/theme";
    }

    public getGlobalTheme() {
        return this.getOne<object>("selected");
    }

    public getTheme(themeKey: string): Promise<object> {
        return this.getAll<object>({id: themeKey}).then((themes: []) => {
            if (themes.length > 0) {
                return themes.pop();
            }
            else {
                return null;
            }
        });
    }

}
