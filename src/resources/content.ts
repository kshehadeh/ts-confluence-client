import {AxiosError, AxiosResponse} from "axios";
import * as fs from "fs";
import {HttpAction, HttpContentType, IErrorResponse, IResourceResponse, Resource} from "./index";

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

export type ContentProperty = {
    id: string,
    key: string,
    value: any,
    version: any,
    content: any,
    _links: any
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
    true = "true",
    false = "false"
}

export type AttachmentProperties = {
    file: string,
    comment: string,
    minorEdit: StringBoolean,
}

export type GetAttachmentProperties = {
    mediaType?: string,
    filename?: string
}

export type ContentChildrenResponse = {
    attachment?: IResourceResponse,
    page?: IResourceResponse,
    comment?: IResourceResponse,
    _expandable: any,
    _links: any
}

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

export type ContentVersion = {
    by: AtlassianUser,
    when: string,
    friendlyWhen: string,
    message: string,
    number: number,
    minorEdit: boolean,
    content: any,
    collaborators: {
        users: AtlassianUser[],
        userKeys: string[]
    }
    _expandable: any
    _links: any
}

export type ContentHistoryResponse = {
    id: string,
    space: any,
    title: string,
    status: ContentStatus,
    version: ContentVersion,
    history: ContentHistory
    type: ContentType,
    _expandable: any,
    _links: any
}

export type ContentHistory = {
    latest: boolean
    createdBy: AtlassianUser
    createdDate: string,
    lastUpdated: ContentVersion
    previousVersion: ContentVersion
    contributors: any
    nextVersion: ContentVersion,
    _expandable: any,
    _links: any
}

export enum ContentHistoryExpansions {
    lastUpdated = "lastUpdated",
    previousVersion = "previousVersion",
    contributors = "contributors",
    nextVersion = "nextVersion"
}

export type ContentLabel = {
    prefix: string,
    name: string,
    id?: string,
    label?: string
}

export enum ContentLabelPrefixes {
    global= "global",
    my= "my",
    team= "team"
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
            ancestors: props.parentId ? [{id: props.parentId}] : null,
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

    public async getContentProperty(id: string, propKey: string) {
        return this.getOne(`${id}/property/${propKey}`)
            .then((prop: ContentProperty) => {
                return prop;
            });
    }

    public async createContentProperty(id: string, propKey: string, propValue: object) {
        return this.create({
            id: `${id}/property`,
            data: {
                key: propKey,
                value: propValue
            }
        }).then((prop: ContentProperty) => {
            return prop;
        });
    }

    public async updateContentProperty(id: string, propKey: string, propValue: object, minorEdit: boolean = true) {
        return this.getContentProperty(id, propKey)
            .then((prop: ContentProperty) => {
                return prop.version.number;
            })
            .then((versionNum: number) => {
                return this.update({
                    id: `${id}/property/${propKey}`,
                    data: {
                        value: propValue,
                        version: {
                            number: versionNum + 1,
                            minorEdit: minorEdit
                        }
                    }
                });
            })
            .then((updatedProp: ContentProperty) => {
                return updatedProp;
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

        return this.getAll({
            id: 'search', params: {
                cql: cql,
                context: ctx,
                expand: props && props.expand ? props.expand : null
            }
        });
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
    public getContentChildren(id: string, childTypes: ContentType[]) {
        if (childTypes.indexOf(ContentType.blogpost) > -1) {
            throw ("Blog posts cannot be children of any other content");
        }

        return this.makeRequest({
            action: HttpAction.GET,
            url: this.getRequestUrl(`${id}/child`),
            params: {
                expand: childTypes.join(','),
            }
        })
            .then((response: AxiosResponse<IErrorResponse | ContentChildrenResponse>) => {
                if (response.status != 200) {
                    throw response.data as IErrorResponse;
                } else {
                    return response.data as ContentChildrenResponse;
                }
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    public getAttachments(id: string, props?: GetAttachmentProperties) {
        return this.getAll({
            id: `${id}/child/attachment`,
            expand: [],
            params: props
        });
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
        }).then((attachmentResult: any) => {
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
        });
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

    public getContentHistory(id: string, expand: ContentHistoryExpansions[]) {
        return this.getOne(id, {
            expand: expand.join(',')
        })
            .then((history: ContentHistoryResponse) => {
                return history;
            });
    }

    public addContentLabel(id:string, label: ContentLabel) {
        return this.create({
            id: `${id}/label`,
            data: label
        }).then((res: IResourceResponse)=>{
            return res.results
        })
    }

    public getContentLabels(id:string, prefixFilter: ContentLabelPrefixes) {
        return this.getAll({
            id: `${id}/label`,
            params: {
                prefix: prefixFilter
            }
        }).then((labels: ContentLabel[])=>{
            return labels
        })
    }
}
