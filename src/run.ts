import {Confluence} from "./index";
import {IErrorResponse} from "./resources";
import {config} from "dotenv";
import {StringBoolean} from "./resources/contentApi";

config();

const confluence = new Confluence({
    host: process.env.CONFLUENCE_HOST,
    username: process.env.CONFLUENCE_USERNAME,
    apiToken: process.env.CONFLUENCE_API_KEY
});

confluence.content.updateAttachment('294913',{
    // await confluence.content.addAttachment(cfg.demoPage.id,{
    file: './tests/data/attachment.txt',
    comment: "",
    minorEdit: StringBoolean.true
})
    .then((pages: object[]) => {
        expect(pages.length).toEqual(1);
    })
    .catch((err: IErrorResponse) => {
        throw new Error(`Error occurred: ${err.message}`);
    });
