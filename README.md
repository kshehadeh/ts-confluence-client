# Typescript Confluence Client

A client for the Confluence Cloud API written in TypeScript.  

# Installation

    npm install ts-confluence-client
    
# Usage


Example of code for updating an attachment.

    const confluence = new Confluence({
        host: process.env.CONFLUENCE_HOST,          // e.g. https://myconf.atlassian.net/wiki
        username: process.env.CONFLUENCE_USERNAME,  // e.g. me@email.com
        apiToken: process.env.CONFLUENCE_API_KEY    // e.g. XXXXXXXXXXXXXXXXXXXXXX
    });
    
    confluence.content.updateAttachment('294913',{        
        file: './tests/data/attachment.txt',
        comment: "",
        minorEdit: StringBoolean.true
    })
        .then((pages: object[]) => {
            
        })
        .catch((err: IErrorResponse) => {
            throw new Error(`Error occurred: ${err.message}`);
        });

# Development

## Running tests
    
Before running tests you will need to define the environment variables either directly using export in your shell before
running the tests or by create a .env file in the root that looks something like this:

    CONFLUENCE_HOST=https://myconf.atlassian.net/wiki
    CONFLUENCE_USERNAME=me@email.com
    CONFLUENCE_API_KEY=XXXXXXXXXXXXXXXXXXXXXX

Then run tests using:
 
    npm run test
    
## Publishing a new version

Update the version number:

    npm version patch # or major,minor,etc.
     
And publish with:
    
    npm publish
    
    
