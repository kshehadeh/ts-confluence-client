import {AtlassianError, AtlassianGroup, AtlassianUser} from "../src/resources/types";
import {getTestConfluence} from "./lib/init";

describe('Confluence: Groups', () => {

    const confluence = getTestConfluence();

    it('will retrieve all groups', async () => {
        await confluence.groups.getAll<AtlassianGroup>({})
            .then((groups: AtlassianGroup[]) => {
                expect(groups.length).toBeGreaterThan(0);
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve all group members', async () => {
        await confluence.groups.getGroupMembers("site-admins")
            .then((members: AtlassianUser[]) => {
                expect(members.length).toBeGreaterThan(0);
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will get one group', async () => {
        await confluence.groups.getOne<AtlassianGroup>("site-admins")
            .then((group: AtlassianGroup) => {
                expect(group.name).toEqual("site-admins");
            })
            .catch((err: AtlassianError) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
