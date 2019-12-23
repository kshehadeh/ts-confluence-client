import {Resource} from "./index";
import { SearchResult, CqlContextProperties } from './types';

export class SearchApi extends Resource {

    protected getRoot() {
        return "/rest/api/search";
    }

    public search(cql: string, cqlContext?: CqlContextProperties) {
        return this.getAll<SearchResult>({
            id: ``,
            params: {
                cql,
                cqlcontext: cqlContext
            }
        })
    }
}
