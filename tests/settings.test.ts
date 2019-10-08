import {IErrorResponse} from "../src/resources";
import {getTestConfluence} from "./lib/init";

describe ('Confluence: Settings', () => {

    const confluence = getTestConfluence();

    type SettingsConfig = {
        currentLookAndFeelSettings?: object,
        defaultTestColor: string
    }
    const cfg:SettingsConfig = {
        defaultTestColor: '#FFF'
    };

    it('will retrieve look and feel settings', async () => {
        await confluence.settings.getOne('lookandfeel')
            .then((settings: object) => {
                expect(settings).toEqual(expect.objectContaining({'global':expect.any(Object)}));
                // @ts-ignore
                cfg.currentLookAndFeelSettings = settings.global;

            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('update look and feel settings', async () => {
        let newLfSettings = cfg.currentLookAndFeelSettings;

        // @ts-ignore
        newLfSettings.headings.color = cfg.defaultTestColor;
        await confluence.settings.create(newLfSettings,'lookandfeel/custom')
            .then((LfSettings: object) => {
                expect(LfSettings).toEqual(
                    expect.objectContaining({'headings': { 'color': cfg.defaultTestColor}}));

            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('reset look and feel settings', async () => {
        await confluence.settings.remove('lookandfeel/custom')
            .then((deleted: boolean) => {
                expect(deleted).toEqual(true);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve system info', async () => {
        await confluence.settings.getOne('systemInfo')
            .then((settings: object) => {
                expect(settings).toEqual(expect.objectContaining({'cloudId':expect.any(String)}));
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve system info', async () => {
        await confluence.settings.getOne('systemInfo')
            .then((settings: object) => {
                expect(settings).toEqual(expect.objectContaining({'cloudId':expect.any(String)}));
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});

describe ('Confluence: Themes', () => {

    type ThemeConfig = {
        themeKey?: string,
    }
    const cfg:ThemeConfig = {};

    const confluence = getTestConfluence();

    it('will retrieve global theme', async () => {
        await confluence.themes.getGlobalTheme()
            .then((theme: object) => {
                expect(theme).toEqual(expect.objectContaining({'themeKey':expect.any(String)}));
                // @ts-ignore
                cfg.themeKey = theme.themeKey;
            })
            .catch((err: IErrorResponse) => {
                if (err.statusCode === 404) {
                    // this is expected when there is no global theme assigned.
                    expect(true);
                }
                else {
                    throw new Error(`Error occurred: ${err.message}`);
                }
            });
    }, 30000);

    it('will retrieve specific theme', async () => {
        if (!cfg.themeKey) {
            console.warn("Skipping specific theme test because there are no themes in the test instance")
            expect(true);
            return;
        }

        await confluence.themes.getTheme(cfg.themeKey)
            .then((theme: object) => {
                expect(theme).toEqual(expect.objectContaining({'themeKey':expect.any(String)}));
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve all themes', async () => {
        await confluence.themes.getAll({})
            .then((themes: []) => {
                expect(themes.length).toBeGreaterThanOrEqual(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
