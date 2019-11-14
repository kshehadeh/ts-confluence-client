export type AtlassianCollection<T> = {
    results: T[],
    start: number,
    limit: number,
    size: number,
    totalSize: number,
    _links: any
}

export interface Error {
    message: {
        translation: string,
        args: []
    }
}

export type AtlassianError = {
    statusCode: number,
    data: {
        authorized?: boolean,
        valid?: boolean,
        errors?: Error[],
        successful?: boolean
    },
    message?: string
}

export type Space = {
    id?: number,
    key?: string,
    name?: string,
    icon?: {
        path: string,
        width: number,
        height: number,
        isDefault: true
    },
    description?: {
        plain?: ContentView,
        view?: ContentView
    },
    homepage?: Content
}

/**
 * These are the Confluence ContentApi Types that are supported by the API
 */
export enum ContentType {
    page = 'page',
    blogpost = 'blogpost',
    comment = 'comment',
    attachment = 'attachment'
}

/**
 * Most of the  type, the format you will be  requesting the  content in is "storage"
 * meaning the raw format (as it is "stored" in Confluence backend).
 */
export enum ContentFormat {
    storage = 'storage',
    styled_view = 'styled_view',
    view = 'view',
    export_view = 'export_view'
}

/**
 * ContentApi properties are  custom data that you can associated with  pages. The  any
 * below is the Confluence API's definition of the content prop's values.
 */
export type ContentProperty = {
    id?: string,
    key: string,
    value: any,
    version?: any,
    content?: any,
    _links?: any
}

export enum ContentStatus {
    current = "current",
    trashed = "trashed",
    historical = "historical",
    draft = "draft"
}

export enum StringBoolean {
    true = "true",
    false = "false"
}

export type ContentChildren = {
    attachment?: AtlassianCollection<Content>,
    page?: AtlassianCollection<Content>,
    comment?: AtlassianCollection<Content>,
    _expandable: any,
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

export type ContentHistory = {
    latest: boolean
    createdBy: AtlassianUser
    createdDate: string,
    lastUpdated: ContentVersion,
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
    history = "history",
    nextVersion = "nextVersion"
}

export type ContentLabel = {
    prefix: string,
    name: string,
    id?: string,
    label?: string
}

export enum OperationCheckResult {
    administer = "administer",
    copy = "copy",
    create = "create",
    delete = "delete",
    export = "export",
    move = "move",
    purge = "purge",
    purge_version = "purge_version",
    read = "read",
    restore = "restore",
    update = "",
    use = ""
}

export enum ContentLabelPrefixes {
    global = "global",
    my = "my",
    team = "team"
}

export type LookAndFeel = {
    headings: any
    links: any
    menus: any
    header: any
    content: any
    bordersAndDividers: any
}

export type LookAndFeelSettings = {
    selected: string
    global: LookAndFeel,
    theme: LookAndFeel,
    custom: LookAndFeel
}

export type SystemInfo = {
    cloudId: string,
    commitHash: string
}

export type ChildTypes = {
    attachment?: {
        value: boolean,
        _links: any
    },
    comment?: {
        value: boolean,
        _links: any
    },
    page?: {
        value: boolean,
        _links: any
    },
    _expandable: {
        all: string,
        attachment: string,
        comment: string,
        page: string
    }
}

export type ContentView = {
    value?: string,
    representation?: string,
    embeddedContent?: any[],
    webresource?: any,
    _expandable?: any
}

export type ContentRestriction = {
    operation: string,
    restrictions: {
        user?: AtlassianCollection<AtlassianUser>,
        group?: AtlassianCollection<AtlassianGroup>,
        _expandable?: any
    },
    content?: Content,
    _expandable?: any,
    _links?: any
}

export type Content = {
    id?: string,
    type?: string,
    status?: string,
    title?: string,
    space?: Space,
    history?: ContentHistory,
    version?: ContentVersion,
    ancestors?: Content[],
    operations?: OperationCheckResult[]
    children?: ContentChildren,
    childTypes?: ChildTypes,
    descendants?: ContentChildren,
    container?: any,
    metadata?: {
        properties?: any,
        currentuser?: any,
        simple?: any,
        frontend?: any,
        labels?: any,
        likes?: any,
        _expandable?: any,
    }
    body?: {
        view?: ContentView,
        export_view?: ContentView,
        styled_view?: ContentView,
        storage?: ContentView,
        editor2?: ContentView,
        anonymous_export_view?: ContentView,
        _expandable?: any
    },
    restrictions?: {
        read?: ContentRestriction,
        update?: ContentRestriction,
        _links?: any
    },
    _expandable?: {
        childTypes?: string,
        container?: string,
        metadata?: string,
        operations?: string,
        children?: string,
        restrictions?: string,
        history?: string,
        ancestors?: string,
        body?: string,
        version?: string,
        descendants?: string,
        space?: string
    },
    _links?: any
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
    operations?: {
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

export type AtlassianGroup = {
    type: string,
    name: string,
    _links: any
}

export type ResponseOrError<T> = T | AtlassianError;

/**
 * Given the ResponseOrError union type, return ture if the given value is an error, otherwise return false.
 * @param ob
 */
export function isAtlassianError<T>(ob: ResponseOrError<T>): boolean {
    return !!(ob as AtlassianError).statusCode;
}
