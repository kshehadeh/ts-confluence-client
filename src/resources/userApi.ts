import {Resource} from "./index";
import {AtlassianUser, AtlassianGroup} from "./types";

export class UserApi extends Resource {

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
        return this.remove({
            id: `watch/content/${contentId}`,
            params: {
                accountId: accountId
            }
        });
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

    public removeLabelWatcherForUser(accountId: string, labelName: string) {
        return this.remove({
            id: `watch/label/${labelName}`,
            params: {
                accountId: accountId
            }
        });
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
        return this.remove({
            id: `watch/space/${spaceKey}`,
            params: {
                accountId: accountId
            }
        });
    }

}
