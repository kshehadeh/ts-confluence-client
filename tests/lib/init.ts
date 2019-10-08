import {Confluence} from "../../src";

export const getTestConfluence = () => {
    const conn = {
        host: process.env.CONFLUENCE_HOST,
        username: process.env.CONFLUENCE_USERNAME,
        apiToken: process.env.CONFLUENCE_API_KEY
    };

    return new Confluence(conn);
};
