import {IErrorResponse} from "../src/resources";
import {AtlassianUser} from "../src/resources/user";
import {AtlassianGroup} from "../src/resources/group";
import {getTestConfluence} from "./lib/init";

describe('Confluence: Groups', () => {

    const confluence = getTestConfluence();

    it('will retrieve all groups', async () => {
        await confluence.groups.getAll({})
            .then((groups: AtlassianGroup[]) => {
                expect(groups.length).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve all group members', async () => {
        await confluence.groups.getGroupMembers("site-admins")
            .then((members: AtlassianUser[]) => {
                expect(members.length).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will get one group', async () => {
        await confluence.groups.getOne("site-admins")
            .then((group: AtlassianGroup) => {
                expect(group.name).toEqual("site-admins");
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
