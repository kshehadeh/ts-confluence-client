import {config} from "dotenv";
import {getTestConfluence} from "./lib/init";

describe('Confluence Client', () => {
    const cfg = config();
    const confluence = getTestConfluence();
    it('retrieved configuration information correctly', () => {
        expect(confluence.connection.host === cfg.CONFLUENCE_HOST);
        expect(confluence.connection.username === cfg.CONFLUENCE_USERNAME);
        expect(confluence.connection.apiToken === cfg.CONFLUENCE_API_KEY);
    });
});


