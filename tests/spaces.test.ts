import {IErrorResponse} from "../src/resources";
import {confluenceTestSpace, confluenceTestSpaceUpdate} from "./data/space";
import {getTestConfluence} from "./lib/init";

describe ('Confluence: Spaces', () => {

    type SpaceConfig = {
        firstSpaceKey?: string,
        createdSpace?: any,
    }
    const cfg:SpaceConfig = {};

    const confluence = getTestConfluence();

    it('will retrieve the total number of spaces', async () => {
        await confluence.space.getTotal()
            .then((count: number) => {
                expect(count > 0)
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve all spaces', async () => {
        await confluence.space.getAll({})
            .then((spaces: []) => {
                expect(spaces.length > 0);
                // @ts-ignore
                cfg.firstSpaceKey = spaces[0].key;

            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will get one space', async () => {
        await confluence.space.getOne(cfg.firstSpaceKey)
            .then((space: object) => {
                expect(space).toEqual(expect.objectContaining({
                    "key": expect.any(String)
                }));
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will create a space', async () => {
        await confluence.space.create(confluenceTestSpace)
            .then((space: object) => {
                expect(space).toEqual(expect.objectContaining({
                    "key": expect.any(String)
                }));
                cfg.createdSpace = space;
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will update a space', async () => {
        await confluence.space.update(cfg.createdSpace.key,confluenceTestSpaceUpdate)
            .then((space: object) => {
                expect(space).toEqual(expect.objectContaining({
                    "key": expect.any(String)
                }));
                cfg.createdSpace = space;
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will delete a space', async () => {
        await confluence.space.remove(cfg.createdSpace.key)
            .then((deleted: boolean) => {
                expect(deleted)
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
