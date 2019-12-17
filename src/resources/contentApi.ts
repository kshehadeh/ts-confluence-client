import { AxiosError, AxiosResponse } from 'axios';
import * as fs from 'fs';
import { HttpAction, HttpContentType, Resource } from './index';

import {
    AtlassianCollection,
    AtlassianError,
    Content,
    ContentChildren,
    ContentFormat,
    ContentHistory,
    ContentHistoryExpansions,
    ContentLabel,
    ContentLabelPrefixes,
    ContentProperty,
    ContentStatus,
    ContentType,
    ContentVersion, ContentView,
    StringBoolean,
} from './types';
import { getNestedVal } from '../lib';

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

export type CreatePageProperties = {
    title: string,
    space: string,
    type: ContentType,
    body: string,
    format: ContentFormat,
    parentId?: string
}

export type UpdatePageProperties = {
    body: string,
    format?: ContentFormat,
    type?: ContentType,
    title?: string,
    version?: number,
    parentId?: string
}

export type CqlContextProperties = {
    spaceKey?: string,
    contentId?: string,
    contentStatuses?: ContentStatus[]
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

export class ContentApi extends Resource {

    defaultExpansions: string[] = ['space', 'history', 'version'];

    protected getRoot() {
        return '/rest/api/content';
    }

    static CONTENT_VIEW(contentPage: Content, preferredStorageMechanism: ContentFormat): { format: ContentFormat, view: ContentView } {
        if (contentPage.body) {
            if (contentPage.body.hasOwnProperty(preferredStorageMechanism)) {
                // the value preferred is available so return that one.
                return {
                    format: preferredStorageMechanism,
                    view: contentPage.body[preferredStorageMechanism],
                };
            } else {
                // these views are listed in the preferred order.
                const views = [
                    ContentFormat.storage,
                    ContentFormat.view,
                    ContentFormat.styled_view,
                    ContentFormat.export_view];

                for (let i = 0; i < views.length; i++) {
                    if (contentPage.body.hasOwnProperty(views[i]) && contentPage.body[views[i]].value) {
                        return {
                            format: views[i],
                            view: contentPage.body[views[i]],
                        };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Use this to quickly extract the preferred body content from a page
     * object.
     * @param contentPage The page object pulled from the API
     * @param preferredStorageMechanism The preferred storage mechanism can be
     *              one of the ContentFormats available.
     * @return Returns the body as a string if found or null if not found.
     */
    static CONTENT_BODY(contentPage: Content, preferredStorageMechanism: ContentFormat): string | null {
        const viewInfo = this.CONTENT_VIEW(contentPage, preferredStorageMechanism);
        if (viewInfo) {
            return viewInfo.view.value;
        } else {
            return null;
        }
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
            space: { key: props.space },
            ancestors: props.parentId ? [{ id: props.parentId }] : null,
            body: {},
        };

        const format = props.format || 'storage';
        params.body[format] = {
            value: props.body,
            representation: format,
        };

        return this.create<Content, Content>({
            data: params,
        });
    }

    /**
     * Gets a custom property associated with the given page.
     * @param id
     * @param propKey The property key to retrieve the value for
     */
    public async getContentProperty(id: string, propKey: string) {
        return this.getOne<ContentProperty>(`${id}/property/${propKey}`)
            .then((prop: ContentProperty) => {
                return prop;
            });
    }

    /**
     * To save some time for the client, this call will either create or update the property
     * depending on whether the property has already been added at least once to the content object (calling
     * create on a content object that already has the property will fail)
     * @param content This can be the ID of the content or the object itself.  If ID is given then it will retrieve
     *                  the content object first to determine if the object has had the property set before.
     * @param propKey
     * @param propValue
     * @param minorEdit
     */
    public async upsertContentProperty(content: string | Content,
                                       propKey: string,
                                       propValue: Record<string, any>,
                                       minorEdit: boolean = true) {


        let contentOb: Content = null;

        if (typeof content === 'string') {
            contentOb = await this.getContentById(content, [`metadata.properties.${propKey}`]);
        } else {
            const metaDataExpanded = getNestedVal(content, 'metadata') !== undefined;
            if (!metaDataExpanded) {
                contentOb = await this.getContentById(content.id, [`metadata.properties.${propKey}`]);
            } else {
                contentOb = content;
            }
        }

        if (!contentOb) {
            throw new Error('The content given could not be found');
        }

        let propExists = getNestedVal(contentOb, 'metadata.properties.' + propKey) !== undefined;
        if (!propExists) {
            // now just check if it's there but not expanded.  We would check this only  but when it's
            //  expanded it doesn't  show  up in the "_expandable" list  so we have to check both.
            propExists = getNestedVal(contentOb, 'metadata.properties._expandable' + propKey) !== undefined;
        }
        if (!propExists) {
            return await this.createContentProperty(contentOb.id, propKey, propValue);
        } else {
            return await this.updateContentProperty(contentOb.id, propKey, propValue, minorEdit);
        }
    }

    /**
     * Create a new custom content property
     * @param id
     * @param propKey The name of the property
     * @param propValue The value of the property.  This must be a javascript object.
     */
    public async createContentProperty(id: string, propKey: string, propValue: Record<string, any>) {
        return this.create<ContentProperty, ContentProperty>({
            id: `${id}/property`,
            data: {
                key: propKey,
                value: propValue,
            },
        }).then((prop: ContentProperty) => {
            return prop;
        });
    }

    /**
     * Update the value and associated metadata for a given content property
     * @param id
     * @param propKey The prop name to update
     * @param propValue The value of the property
     * @param minorEdit (optional) If true, this change will  not show as a separate item in  the page's history audit
     */
    public async updateContentProperty(id: string,
                                       propKey: string,
                                       propValue: Record<string, any>,
                                       minorEdit: boolean = true) {

        return this.getContentProperty(id, propKey)
            .then((prop: ContentProperty) => {
                return prop.version.number;
            })
            .then((versionNum: number) => {
                return this.update<ContentProperty>({
                    id: `${id}/property/${propKey}`,
                    data: {
                        // The key is not strictly necessary since it is part of the path but resolves
                        // type issues when excluded
                        key: propKey,
                        value: propValue,
                        version: {
                            number: versionNum + 1,
                            minorEdit: minorEdit,
                        },
                    },
                });
            })
            .then((updatedProp: ContentProperty) => {
                return updatedProp;
            });
    }

    /**
     * This will do a CQL search and page all the results returning all of them at once.
     * @param cql The search query
     * @param context
     */
    public async searchContent(cql: string, context?: CqlContextProperties) {
        const ctx = context ? {
            space: context.spaceKey ? context.spaceKey : null,
            contentId: context.contentId ? context.contentId : null,
            contentStatuses: context.contentStatuses ? context.contentStatuses.join(',') : null,
        } : null;

        return this.getAll({
            id: 'search', params: {
                cql: cql,
                context: ctx,
                expand: null,
            },
        });
    }

    /**
     * Updates a content item.  If version is not given it will do the work
     * of pulling the current page, grabbing the version, incrementing it
     * and passing it into the  update call.
     * @param id The ID of the page to update.
     * @param props
     */
    public async updateContent(id: string, props: UpdatePageProperties): Promise<Content> {
        const existingPage = await this.getContentById(id, [
          "body","body.storage","body.view", "version","ancestors"
        ]);
        if (!existingPage) {
            throw 'Unable to find page with id ' + id;
        }

        if (!props.version) {
            // get the version and automatically increment for them.
            props.version = existingPage.version.number + 1;
        }

        if (!props.title) {
            props.title = existingPage.title;
        }

        if (!props.type) {
            props.type = existingPage.type;
        }

        if (!props.format || props.format != existingPage.body) {
            props.format = ContentFormat.storage;
        }

        const viewInfo = ContentApi.CONTENT_VIEW(existingPage, ContentFormat.storage);
        if (!viewInfo) {
            // this should not happen.  it probably means that we did not expand "body"
            //  when making the request for the existing page.
            throw new Error("Body information could not be found for existing page");
        }
        viewInfo.view.value = props.body;

        let params: Content = {
            title: props.title,
            version: { number: props.version },
            type: props.type ? props.type : ContentType.page,
            status: ContentStatus.current,
            ancestors: props.parentId ? [{ id: props.parentId }] : null,
            body: {}
        };

        params.body[viewInfo.format] = {
            value: props.body,
            representation: viewInfo.format,
        };
        return this.update<Content>({ id, data: params });
    }

    /**
     * _Permanently_  deletes a content item even if it's not in  the trash already.
     * If it's not in the trash, it will first call remove to set the status to
     * trashed then will call again to permanently delete it.
     * @param id
     */
    public async permanentlyDelete(id: string) {
        const page = await this.getOne<Content>(id, { status: ContentStatus.trashed });
        if (page) {
            // we can only permanently delete if the item is already in the trash.
            if (page.status === ContentStatus.trashed) {
                return this.remove({
                    id: id,
                    data: {
                        status: ContentStatus.trashed,
                    },
                });
            } else {
                return this.remove({ id }).then((deleted: boolean) => {
                    if (deleted) {
                        return this.permanentlyDelete(id);
                    } else {
                        throw 'Unable to move this content item to the trash before permanently deleting.';
                    }
                });
            }
        } else {
            throw `Unable to find a page with the given ID ${id} and the status "trashed"`;
        }
    }

    /**
     * This will specifically return child _pages_ for a given page.  This
     * is separate from getContentChildren because this call will  allow you
     * to expand individual content entities, whereas the other will noot.
     * @param id The id of the parent
     * @param expand
     */
    public getChildPages(id: string, expand: string[]) {

        return this.makeRequest({
            action: HttpAction.GET,
            url: this.getRequestUrl(`${id}/descendant/page`),
            params: {
                expand: expand.join(','),
            },
        })
            .then((response: AxiosResponse<AtlassianError | AtlassianCollection<Content>>) => {
                if (response.status != 200) {
                    throw response.data as AtlassianError;
                } else {
                    return response.data as AtlassianCollection<Content>;
                }
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });


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
            throw ('Blog posts cannot be children of any other content');
        }

        return this.makeRequest({
            action: HttpAction.GET,
            url: this.getRequestUrl(`${id}/child`),
            params: {
                expand: childTypes.join(','),
            },
        })
            .then((response: AxiosResponse<AtlassianError | ContentChildren>) => {
                if (response.status != 200) {
                    throw response.data as AtlassianError;
                } else {
                    return response.data as ContentChildren;
                }
            })
            .catch((err: AxiosError) => {
                throw this.buildError(err);
            });

    }

    /**
     * Get all the  attachments associated with the  given content
     * @param id
     * @param props Properties to filter the results to only certain media  types or filenames (or both)
     */
    public getAttachments(id: string, props?: GetAttachmentProperties) {
        return this.getAll({
            id: `${id}/child/attachment`,
            expand: [],
            params: props,
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
                minorEdit: attach.minorEdit,
            },
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
     * Returns detailed information about a content item.
     * @param contentId The ID of the content to find children for
     * @param contentId The id of the content to load
     * @param expansion Which data to expand within the results.
     */
    public getContentById(contentId: string, expansion?: string[]) {
        return this.getOne<Content>(`${contentId}`, {
            'expand': expansion ? expansion.join(',') : null,
        });
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
                'expand': expansion.join(','),
            },
        });
    }

    /**
     * Convenience function to get all pages in a single space.
     * @param spaceKey
     */
    public getPagesInSpace(spaceKey: string) {
        return this.getContentCollection({
            type: 'page',
            spaceKey: spaceKey,
        });
    }

    /**
     * Retrieves all content filtered by the  parameters given in IContentRequest
     * @param request The requested information
     */
    public getContentCollection(request: IPageRequest | IBlogRequest) {
        return this.getAll({
            params: request,
        });
    }

    /**
     * Returns a history object for the  given content
     * @param id
     * @param expand
     */
    public getContentHistory(id: string, expand: ContentHistoryExpansions[]) {
        return this.getOne(`${id}/history`, {
            expand: expand.join(','),
        })
            .then((history: ContentHistory) => {
                return history;
            });
    }

    /**
     * Adds a new label to the given content
     * @param id
     * @param labelName
     */
    public addContentLabel(id: string, labelName: string) {
        return this.create<ContentLabel, AtlassianCollection<ContentLabel>>({
            id: `${id}/label`,
            data: {
                prefix: 'global',
                name: labelName,
            },
        }).then((res: AtlassianCollection<ContentLabel>) => {
            return res.results;
        });
    }

    /**
     * Adds a new label to the given content
     * @param id
     * @param label The text for the label
     */
    public removeContentLabel(id: string, label: ContentLabel) {
        return this.remove(
            {
                id: `${id}/label`,
                data: label,
            })
            .then(() => {
                return true;
            });
    }

    /**
     * Gets all labels  associated with the given  content
     * @param id
     * @param prefixFilter Only returns labels that have the given prefix (defaults to global)
     */
    public getContentLabels(id: string, prefixFilter: ContentLabelPrefixes = ContentLabelPrefixes.global) {
        return this.getAll({
            id: `${id}/label`,
            params: {
                prefix: prefixFilter,
            },
        }).then((labels: ContentLabel[]) => {
            return labels;
        });
    }

    public getContentVersions(id: string) {
        return this.getAll({
            id: `${id}/version`,
        })
            .then((versions: ContentVersion[]) => {
                return versions;
            });
    }

    public getContentVersion(id: string, version: number, expand?: string[]) {
        return this.getOne(`${id}/version/${version}`, {
                expand: expand ? expand.join(',') : null,
            },
        )
            .then((version: ContentVersion) => {
                return version;
            });
    }

    /**
     * NOTE: This currently does not work - i submitted a question on Atlassian's dev community.
     *
     * @param id
     * @param version
     * @param message
     */
    public restoreContentVersion(id: string, version: number, message: string) {
        return this.create({
            id: `${id}/version/`,
            data: {
                operationKey: 'RESTORE',
                params: {
                    versionNumber: version,
                    message: message,
                },
            },
        })
            .then((version: ContentVersion) => {
                return version;
            });
    }
}
