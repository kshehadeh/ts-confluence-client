# Typescript Confluence Client

A client for the Confluence Cloud API written in TypeScript.

# Installation

    npm install
    
# Usage

    const confluence = new Confluence({
        host: process.env.CONFLUENCE_HOST,
        username: process.env.CONFLUENCE_USERNAME,
        apiToken: process.env.CONFLUENCE_API_KEY
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

# Run Tests
    
    npm run test
    
