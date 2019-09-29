import {Confluence} from '../src';
import {IErrorResponse} from "../src/resources";
import {config} from "dotenv";
import {confluenceTestSpace,confluenceTestSpaceUpdate} from "./data/space"

describe('confluence resources', () => {
    const cfg = config();

    const conn = {
        host: process.env.CONFLUENCE_HOST,
        username: process.env.CONFLUENCE_USERNAME,
        apiToken: process.env.CONFLUENCE_API_KEY
    };

    const confluence = new Confluence(conn);

    it('retrieved configuration information correctly', () => {
        expect(conn.host === cfg.CONFLUENCE_HOST);
        expect(conn.username === cfg.CONFLUENCE_USERNAME);
        expect(conn.apiToken === cfg.CONFLUENCE_API_KEY);
    });

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
        await confluence.space.getAll()
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
