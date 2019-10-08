import * as fs from "fs";
import {HttpContentType, Resource} from "./index";

interface IContentRequest {
    type: string,
    spaceKey: string,
    status?: string[],
    expand?: string[]
}

interface IPageRequest extends IContentRequest {
    title?: string,
}

interface IBlogRequest extends IContentRequest {
    postingDay?: string
}

export enum ContentType {
    page = 'page',
    blogpost = 'blogpost',
    comment = 'comment',
    attachment = 'attachment'
}

export enum ContentFormat {
    storage = 'storage',
    styled_view = 'styled_view',
    view = 'view',
    export_view = 'export_view'
}

export type CreatePageProperties = {
    title: string,
    space: string,
    type: ContentType,
    body: string,
    format: ContentFormat,
    parentId?: string
}

export type UpdatePageProperties = {
    title: string,
    version: number,
    type: ContentType,
    body: string,
    format: ContentFormat,
    parentId?: string
}

export enum ContentStatus {
    current = "current",
    trashed = "trashed",
    historical = "historical",
    draft = "draft"
}

export type CqlContextProperties = {
    spaceKey?: string,
    contentId?: string,
    contentStatuses?: ContentStatus[]
}

export type SearchContentProperties = {
    context?: CqlContextProperties,
    expand: string[]
}

export enum StringBoolean {
    true =  "true",
    false = "false"
}
export type AttachmentProperties = {
    file: string,
    comment: string,
    minorEdit: StringBoolean,
}

export class Content extends Resource {

    availableExpansions: object = {
        "childTypes.all": "returns whether the content has attachments, comments, or child pages. Use this if you only need to check whether the content has children of a particular type.",
        "childTypes.attachment": "returns whether the content has attachments.",
        "childTypes.comment": "returns whether the content has comments.",
        "childTypes.page": "returns whether the content has child pages.",
        "container": "returns the space that the content is in. This is the same as the information returned by Get space.",
        "metadata.currentuser": "returns information about the current user in relation to the content, including when they last viewed it, modified it, contributed to it, or added it as a favourite.",
        "metadata.properties": "returns content properties that have been set via the Confluence REST API.",
        "metadata.labels": "returns the labels that have been added to the content.",
        "metadata.frontend": "(this property is only used by Atlassian)",
        "operations": "returns the operations for the content, which are used when setting permissions.",
        "children.page": "returns pages that are descendants at the level immediately below the content.",
        "children.attachment": "returns all attachments for the content.",
        "children.comment": "returns all comments on the content.",
        "restrictions.read.restrictions.user": "returns the users that have permission to read the content.",
        "restrictions.read.restrictions.group": "returns the groups that have permission to read the content. Note that this may return deleted groups, because deleting a group doesn't remove associated restrictions.",
        "restrictions.update.restrictions.user": "returns the users that have permission to update the content.",
        "restrictions.update.restrictions.group": "returns the groups that have permission to update the content. Note that this may return deleted groups, because deleting a group doesn't remove associated restrictions.",
        "history": "returns the history of the content, including the date it was created.",
        "history.lastUpdated": "returns information about the most recent update of the content, including who updated it and when it was updated.",
        "history.previousVersion": "returns information about the update prior to the current content update.",
        "history.contributors": "returns all of the users who have contributed to the content.",
        "history.nextVersion": "returns information about the update after to the current content update.",
        "ancestors": "returns the parent page, if the content is a page.",
        "body": "returns the body of the content in different formats, including the editor format, view format, and export format.",
        "version": "returns information about the most recent update of the content, including who updated it and when it was updated.",
        "descendants.page": "returns pages that are descendants at any level below the content.",
        "descendants.attachment": "returns all attachments for the content, same as children.attachment.",
        "descendants.comment": "returns all comments on the content, same as children.comment.",
        "space": "returns the space that the content is in. This is the same as the information returned by Get space.",
    };

    defaultExpansions: string[] = ["space", "history", "version"];

    protected getRoot() {
        return "/rest/api/content";
    }

    /**
     * Convenience function that wraps base class create to correctly
     * pull in the right properties to help make sure the create method is
     * called correctly
     * @param props
     */
    public createContent(props: CreatePageProperties) {
        let params = {
            title: props.title,
            type: props.type ? props.type : ContentType.page,
            status: ContentStatus.current,
            space: {key: props.space},
            ancestors: props.parentId ? {id: props.parentId} : null,
            body: {},
        };

        params.body[props.type] = {
            "value": props.body,
            "representation": "view"
        };
        return this.create({
            data: params
        });
    }

    /**
     * This will do a CQL search and page all the results returning all of them at once.
     * @param cql The search query
     * @param props
     */
    public async searchContent(cql: string, props?: SearchContentProperties) {
        const ctx = props && props.context ? {
            space: props.context.spaceKey ? props.context.spaceKey : null,
            contentId: props.context.contentId ? props.context.contentId : null,
            contentStatuses: props.context.contentStatuses ? props.context.contentStatuses.join(',') : null
        } : null;

        return this.getAll({id: 'search', params: {
            cql: cql,
            context: ctx,
            expand: props && props.expand ? props.expand : null
        }});
    }

    /**
     * Updates a content item.  If version is not given it will do the work
     * of pulling the current page, grabbing the version, incrementing it
     * and passing it into the  update call.
     * @param id The ID of the page to update.
     * @param props
     */
    public async updateContent(id: string, props: UpdatePageProperties) {
        if (!props.version) {
            // get the version and automatically increment for them.
            const existingPage = await this.getOne(id);
            if (!existingPage) {
                throw "Unable to find page with id " + id;
            } else {
                props.version = parseInt(existingPage.version.number) + 1;
            }
        }
        let params = {
            title: props.title,
            version: {"number": props.version},
            type: props.type ? props.type : ContentType.page,
            status: ContentStatus.current,
            ancestors: props.parentId ? {id: props.parentId} : null,
            body: {},
        };

        params.body[props.type] = {
            "value": props.body,
            "representation": "view"
        };
        return this.update({id, data: params});
    }

    /**
     * _Permanently_  deletes a content item even if it's not in  the trash already.
     * If it's not in the trash, it will first call remove to set the status to
     * trashed then will call again to permanently delete it.
     * @param id
     */
    public async permanentlyDelete(id: string) {
        const page = await this.getOne(id, {status: ContentStatus.trashed});
        if (page) {
            // we can only permanently delete if the item is already in the trash.
            if (page.status === ContentStatus.trashed) {
                return this.remove(id, {status: ContentStatus.trashed});
            } else {
                return this.remove(id).then((deleted: boolean) => {
                    if (deleted) {
                        return this.permanentlyDelete(id);
                    } else {
                        throw "Unable to move this content item to the trash before permanently deleting.";
                    }
                });
            }
        } else {
            throw `Unable to find a page with the given ID ${id} and the status "trashed"`;
        }
    }

    /**
     * Returns all the children of the content of the given types - in an unexpanded form.  To get details about
     * children, you can use one of the specific children calls such as getAttachments.
     * @param id
     * @param childTypes See https://developer.atlassian.com/cloud/confluence/rest/#api-content-id-child-get for the
     *          options that are available here.
     */
    public getContentChildren(id:string, childTypes: ContentType[]) {
        if (childTypes.indexOf(ContentType.blogpost) > -1) {
            throw ("Blogposts cannot be children of any other content")
        }

        return this.getAll({
            id: `/content/${id}/child`,
            params: {
                expand: childTypes.join(',')
            }});
    }

    public getAttachments(id:string, expansions: string[]) {
        return this.getAll({
            id: `/content/${id}/child/attachment`,
            params: {
                expand: expansions.join(',')
            }
        })
    }

    /**
     * Updates an existing attachment (but will also create it if the filename doesn't already exist)
     * @param contentId The ID of the page to add the attachment to.
     * @param attach
     */
    public updateAttachment(contentId: string, attach: AttachmentProperties) {
        return this.update({
            id: `${contentId}/child/attachment`,
            contentType: HttpContentType.FormData,
            data: {
                // tslint:disable-next-line:non-literal-fs-path
                file: fs.createReadStream(attach.file),
                comment: attach.comment,
                minorEdit: attach.minorEdit
            }
        }).then((attachmentResult: any)=>{
            // the attachment result returns a result similar to a get multiple resources
            //  request.  So we are going to pull out the results here
            return attachmentResult.results;
        });
    }

    /**
     * Create a new attachment (but will also update it if the filename already exists)
     * @param contentId The ID of the page to update the attachment in.
     * @param attach
     */
    public addAttachment(contentId: string, attach: AttachmentProperties) {
        return this.updateAttachment(contentId, attach);
    }

    /**
     * Returns detailed information about one type of child
     * @param contentId The ID of the content to find children for
     * @param type The type of child to return.  Note that 'blogpost' is not valid here.
     * @param expansion Which data to expand within the results.
     */
    public getContentChildrenByType(contentId: string, type: ContentType, expansion: string[]) {
        return this.getAll({
            id: `${contentId}/child/${type}`,
            params: {
                'expand': expansion.join(',')
            }
        })
    }

    /**
     * Convenience function to get all pages in a single space.
     * @param spaceKey
     */
    public getPagesInSpace(spaceKey: string) {
        return this.getContentCollection({
            type: 'page',
            spaceKey: spaceKey
        });
    }

    public getContentCollection(request: IPageRequest | IBlogRequest) {
        return this.getAll({
            params: request
        });
    }

}
