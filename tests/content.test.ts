import {v4 as uuid} from 'uuid';
import {IErrorResponse} from "../src/resources";
import {
    ContentChildrenResponse,
    ContentFormat,
    ContentHistoryExpansions,
    ContentHistoryResponse,
    ContentLabel,
    ContentLabelPrefixes,
    ContentProperty,
    ContentType,
    ContentVersion,
    StringBoolean
} from "../src/resources/content";
import {getTestConfluence} from "./lib/init";

describe ('Confluence: Content', () => {

    const testRunId = uuid();

    type ContentConfig = {
        initialTitle: string,
        updatedTitle: string,
        childPageTitle: string,
        demoSpace?: any,
        demoPage?: any,
        demoChildPage?: any,
        demoVersion?: ContentVersion,
        createdSpace?: any,
    }
    const cfg:ContentConfig = {
        initialTitle: 'Test Page - ' + testRunId,
        updatedTitle: `Test Page - ${testRunId} (Updated)`,
        childPageTitle: `Test Child Page - ${testRunId}`
    };

    const confluence = getTestConfluence();

    function sleep(ms:number) {
        return new Promise((resolve:any) => setTimeout(resolve, ms));
    }

    beforeAll(async ()=>{
        // get the first space and use it for testing.
        const spaces = await confluence.space.getPage(0,1);
        if (spaces.results.length > 0) {
            cfg.demoSpace = spaces.results.pop();
        }
    });


    it('will retrieve all pages in space', async () => {

        // @ts-ignore
        await confluence.content.getPagesInSpace(cfg.demoSpace.key)
            .then((pages: object[]) => {
                expect(pages.length >= 0);
                if (pages.length > 0) {
                    cfg.demoPage = pages[0]
                }
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will create a page', async ()=> {
        if (!cfg.demoSpace) {
            console.warn('Specific space to use could not be found in previous steps');
            expect(true);
        }

        await confluence.content.createContent({
            title: "Test Page",
            space: cfg.demoSpace.key,
            body: "This is my test content",
            format: ContentFormat.storage,
            type: ContentType.page
        })
            .then((page: object) => {
                expect(page).toEqual(expect.objectContaining({'id': expect.any(String)}));
                cfg.demoPage = page;
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });

    });

    it('will retrieve a specific page in the space', async () => {
        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }
        await confluence.content.getOne(cfg.demoPage.id)
            .then((page: object) => {
                expect(page).toEqual(expect.objectContaining({'id': expect.any(String)}));
                if (!cfg.demoPage) {
                    cfg.demoPage = page;
                }
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);


    it('will update a page', async () => {

        await sleep(3000);

        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }
        else {
            await confluence.content.updateContent(cfg.demoPage.id, {
                title: cfg.updatedTitle,
                version: cfg.demoPage.version.number+1,
                body: "This is my test content - updated",
                format: ContentFormat.storage,
                type: ContentType.page
            })
                .then((page: object) => {
                    expect(page).toEqual(expect.objectContaining({'title': cfg.updatedTitle}));
                })
                .catch((err: IErrorResponse) => {
                    throw new Error(`Error occurred: ${err.message}`);
                });
        }
    }, 30000);

    it('will search using cql', async () => {
        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }
        else {
            await confluence.content.searchContent('id=' + cfg.demoPage.id)
                .then((pages: object[]) => {
                    expect(pages.length).toEqual(1);
                })
                .catch((err: IErrorResponse) => {
                    throw new Error(`Error occurred: ${err.message}`);
                });
        }
    }, 30000);


    it('will add and update an attachment', async () => {
        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }
        else {

            await confluence.content.addAttachment(cfg.demoPage.id,{
                    file: './tests/data/attachment.txt',
                    comment: "",
                    minorEdit: StringBoolean.true
                })
                .then((attachments: any[]) => {
                    expect(attachments.length).toEqual(1);
                })
                .catch((err: IErrorResponse) => {
                    throw new Error(`Error occurred: ${err.message}`);
                });

            await confluence.content.updateAttachment(cfg.demoPage.id,{
                file: './tests/data/attachment.txt',
                comment: "",
                minorEdit: StringBoolean.true
            })
                .then((attachments: any[]) => {
                    expect(attachments.length).toEqual(1);
                })
                .catch((err: IErrorResponse) => {
                    throw new Error(`Error occurred: ${err.message}`);
                });
        }
    }, 30000);

    it('will create a child page', async ()=> {
        if (!cfg.demoSpace) {
            console.warn('Specific space to use could not be found in previous steps');
            expect(true);
        }

        await confluence.content.createContent({
            title: cfg.childPageTitle,
            space: cfg.demoSpace.key,
            body: "This is my test content for the child of the other test content",
            format: ContentFormat.storage,
            type: ContentType.page,
            parentId: cfg.demoPage.id
        })
            .then((page: object) => {
                expect(page).toEqual(expect.objectContaining({'id': expect.any(String)}));
                cfg.demoChildPage = page;
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });

    });

    it('will retrieve page children', async () => {
        // @ts-ignore
        await confluence.content.getContentChildren(cfg.demoPage.id,
            [ContentType.attachment,ContentType.page])
            .then((results: ContentChildrenResponse) => {
                expect(results.attachment.results.length).toBeGreaterThanOrEqual(1);
                expect(results.page.results.length).toBeGreaterThanOrEqual(1);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will retrieve page attachments', async () => {
        // @ts-ignore
        await confluence.content.getAttachments(cfg.demoPage.id,
            {}
            )
            .then((attachments: any[]) => {
                expect(attachments.length).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will create a content property', async () => {
        // @ts-ignore
        await confluence.content.createContentProperty(cfg.demoPage.id,
            "testProp", {"test1": "hello"}
            )
            .then((prop: ContentProperty) => {
                expect(prop.key).toBe("testProp")
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will get a content property', async () => {
        // @ts-ignore
        await confluence.content.getContentProperty(cfg.demoPage.id,
            "testProp"
        )
            .then((prop: ContentProperty) => {
                expect(prop.key).toBe("testProp")
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);


    it('will update a content property', async () => {
        // @ts-ignore
        await confluence.content.updateContentProperty(cfg.demoPage.id,
            "testProp", {"test1": "goodbye"}
            )
            .then((prop: ContentProperty) => {
                expect(prop.key).toBe("testProp")
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will get content history', async () => {
        // @ts-ignore
        await confluence.content.getContentHistory(cfg.demoPage.id,
            [ContentHistoryExpansions.contributors, ContentHistoryExpansions.history]
            )
            .then((hist: ContentHistoryResponse) => {
                console.log(hist);
                expect(hist.history.latest).toBe(true);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('create a label', async () => {
        await confluence.content.addContentLabel(cfg.demoPage.id,
            {
                prefix: ContentLabelPrefixes.global,
                name: "label"
            }
        )
            .then((labels: ContentLabel[]) => {
                console.log(labels);
                expect(labels.length).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 3000);

    it('will get labels', async () => {
        // @ts-ignore
        await confluence.content.getContentLabels(cfg.demoPage.id,
            ContentLabelPrefixes.global
            )
            .then((labels: ContentLabel[]) => {
                expect(labels.length).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it ('will get all versions of a page', async () => {
        // @ts-ignore
        await confluence.content.getContentVersions(cfg.demoPage.id,
        )
            .then((versions: ContentVersion[]) => {
                expect(versions.length).toBeGreaterThan(1);
                cfg.demoVersion = versions[1]
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);


    it ('will get one version of a page', async () => {
        // @ts-ignore
        await confluence.content.getContentVersion(
            cfg.demoPage.id,
            cfg.demoVersion.number
        )
            .then((version: ContentVersion) => {
                expect(version.number).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it.skip ('restore a version of a page', async () => {
        // @ts-ignore
        await confluence.content.restoreContentVersion(
            cfg.demoPage.id,
            cfg.demoVersion.number,
            "testing restore"
        )
            .then((version: ContentVersion) => {
                expect(version.number).toBeGreaterThan(0);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will delete a specific page in the space', async () => {
        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }

        // we have to wait some period of time after the creation of the page to
        //  delete that page - otherwise we get an "rollback" error from Atlassian.
        await sleep(2000);

        await confluence.content.remove(cfg.demoPage.id)
            .then((deleted: boolean) => {
                expect(deleted).toEqual(true);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);

    it('will PERMANENTLY delete a specific page in the space', async () => {
        if (!cfg.demoPage)  {
            console.warn("Specific page to load was not found in previous steps");
            expect(true);
        }
        await confluence.content.permanentlyDelete(cfg.demoPage.id)
            .then((deleted: boolean) => {
                expect(deleted).toEqual(true);
            })
            .catch((err: IErrorResponse) => {
                throw new Error(`Error occurred: ${err.message}`);
            });
    }, 30000);
});
