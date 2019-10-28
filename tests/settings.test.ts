import {AtlassianError, LookAndFeel, LookAndFeelSettings, SystemInfo} from "../src/resources/types";
import {getTestConfluence} from "./lib/init";

describe('Confluence: SettingsApi', () => {

    const confluence = getTestConfluence();

    type SettingsConfig = {
        currentLookAndFeel?: LookAndFeel,
        defaultTestColor: string
    }
    const cfg:SettingsConfig = {
        defaultTestColor: '#FFF'
    };

    it('will retrieve look and feel settings', async () => {
        await confluence.settings.getOne<LookAndFeelSettings>('lookandfeel')
            .then((settings: LookAndFeelSettings) => {
                expect(settings).toEqual(expect.objectContaining({'global':expect.any(Object)}));
                // @ts-ignore
                cfg.currentLookAndFeel = settings.global;

            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('update look and feel settings', async () => {
        let newLfSettings = cfg.currentLookAndFeel;

        // @ts-ignore
        newLfSettings.headings.color = cfg.defaultTestColor;
        await confluence.settings.create<LookAndFeel, LookAndFeel>({data: newLfSettings, id: 'lookandfeel/custom'})
            .then((LfSettings: LookAndFeel) => {
                expect(LfSettings).toEqual(
                    expect.objectContaining({'headings': { 'color': cfg.defaultTestColor}}));

            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('reset look and feel settings', async () => {
        await confluence.settings.remove({id: 'lookandfeel/custom'})
            .then((deleted: boolean) => {
                expect(deleted).toEqual(true);
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve system info', async () => {
        await confluence.settings.getOne<SystemInfo>('systemInfo')
            .then((settings: SystemInfo) => {
                expect(settings).toEqual(expect.objectContaining({'cloudId':expect.any(String)}));
            })
            .catch((err: AtlassianError) => {
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
            .catch((err: AtlassianError) => {
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
            console.warn("Skipping specific theme test because there are no themes in the test instance");
            expect(true);
            return;
        }

        await confluence.themes.getTheme(cfg.themeKey)
            .then((theme: object) => {
                expect(theme).toEqual(expect.objectContaining({'themeKey':expect.any(String)}));
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve all themes', async () => {
        await confluence.themes.getAll({id: ""})
            .then(() => {
                expect(true);
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
