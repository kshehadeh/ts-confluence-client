import {AtlassianGroup} from "./group";
import {Resource} from "./index";

export type AtlassianUser = {
    type: string, //known, unknown, anonymous, user
    username: string,
    accountId: string,
    accountType: string,
    email: string,
    publicName: string,
    profilePicture: any,
    displayName: string,
    operations: {
        operation: string,
        targetType: string
    }[]
    details: {
        business?: any,
        personal?: any
    },
    personalSpace: any
    _expandable: any
    _links: any
}

export class User extends Resource {

    protected getRoot() {
        return "/rest/api/user";
    }

    public getCurrentUser(expand: string[] = []) {
        return this.getOne('current', {
            expand: expand.join(",")
        }).then((user: AtlassianUser) => {
            return user;
        });
    }

    public getUser(accountId: string, expand: string[] = []) {
        // note that this does not put the id in the path but adds a query parameter instead.
        return this.getOne("", {
            accountId: accountId,
            expand: expand.join(",")
        })
            .then((user: AtlassianUser) => {
                return user;
            });
    }

    public getGroupsForUser(accountId: string) {
        return this.getAll({
            id: 'memberof',
            params: {
                accountId: accountId
            }
        })
            .then((groups: AtlassianGroup[]) => {
                return groups;
            });
    }

    public getContentWatchStatusForUser(accountId: string, contentId: string) {
        return this.getOne(`watch/content/${contentId}`, {
            params: {
                accountId: accountId
            }
        }).then((data: { watching: boolean }) => {
            return data.watching;
        });
    }

    public addContentWatcherForUser(accountId: string, contentId: string) {
        return this.create({
            id: `watch/content/${contentId}`,
            data: {
                accountId: accountId
            }
        });
    }

    public removeContentWatcherForUser(accountId: string, contentId: string) {
        return this.remove(
            `watch/content/${contentId}`,
            null,
            {
                accountId: accountId
            }
        );
    }

    public addLabelWatchStatusForUser(accountId: string, labelName: string) {
        return this.create({
            id: `watch/label/${labelName}`,
            data: {},
            params: {
                accountId: accountId
            }
        });
    }

    public removeLabelWatcherForUser(accountId: string, contentId: string) {
        return this.remove(
            `watch/space/${contentId}`,
            null,
            {
                accountId: accountId
            }
        );
    }

    public getSpaceWatchStatusForUser(accountId: string, spaceKey: string) {
        return this.getOne(`watch/space/${spaceKey}`, {
            params: {
                accountId: accountId
            }
        }).then((data: { watching: boolean }) => {
            return data.watching;
        });
    }

    public addSpaceWatcherForUser(accountId: string, spaceKey: string) {
        return this.create({
            id: `watch/space/${spaceKey}`,
            data: {
                accountId: accountId
            }
        });
    }

    public removeSpaceWatcherForUser(accountId: string, spaceKey: string) {
        return this.remove(
            `watch/space/${spaceKey}`,
            null,
            {
                accountId: accountId
            }
        );
    }

}
