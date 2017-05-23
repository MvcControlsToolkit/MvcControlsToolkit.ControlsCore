declare namespace mvcct {
    namespace odata {
        interface IAggregation {
            property: string | null;
            alias: string;
            initialize: (x: IAggregation) => void;
            update: (val: any, x: IAggregation) => void;
            result: (x: IAggregation) => any;
            counters: number[];
            set?: {
                [x: string]: boolean;
            };
        }
        abstract class QueryNode {
            encodeProperty(name: string): string;
            decodeProperty(name: string): string;
            abstract toString(): string | null;
            getProperty(o: any, p: string): any;
            static getProperty(o: any, p: string): any;
        }
        abstract class QueryFilterClause extends QueryNode {
            abstract toQuery(): ((o: any) => boolean) | null;
        }
        interface IQueryFilterBooleanOperator {
            operator?: number;
            argument1?: IQueryValue;
            argument2?: IQueryValue;
            child1?: IQueryFilterBooleanOperator;
            child2?: IQueryFilterBooleanOperator;
        }
        class QueryFilterBooleanOperator extends QueryFilterClause implements IQueryFilterBooleanOperator {
            static readonly and: number;
            static readonly or: number;
            static readonly not: number;
            static readonly AND: number;
            static readonly OR: number;
            static readonly NOT: number;
            operator: number;
            argument1: QueryValue;
            argument2: QueryValue;
            child1: QueryFilterBooleanOperator;
            child2: QueryFilterBooleanOperator;
            constructor(origin: IQueryFilterBooleanOperator);
            constructor(operator: number, a1: QueryFilterClause, a2?: QueryFilterClause);
            toString(): string | null;
            toQuery(): ((o: any) => boolean) | null;
        }
        interface IQueryValue {
            value: any;
            dateTimeType: number;
        }
        class QueryValue extends QueryFilterClause implements IQueryValue {
            static IsNotDateTime: number;
            static IsDate: number;
            static IsTime: number;
            static IsDateTime: number;
            static IsDuration: number;
            value: any;
            dateTimeType: number;
            constructor(origin?: IQueryValue);
            private formatInt(x, len);
            private normalizeTime(x, days, maxTree);
            isGuid(): boolean;
            setDate(x: Date | null): void;
            setTime(x: Date | null): void;
            setDuration(days: number, hours: number, minutes?: number, seconds?: number, milliseconds?: number): void;
            setDateTimeLocal(x: Date | null): void;
            setDateTimeInvariant(x: Date | null): void;
            setBoolean(x: boolean | null): void;
            setNumber(x: number | null): void;
            setString(x: string | null): void;
            setNotDateTime(x: any): void;
            getValue(): any;
            toString(): string | null;
            toQuery(): ((o: any) => boolean) | null;
        }
        interface IQueryFilterCondition extends IQueryValue {
            operator: string | null;
            property: string | null;
            inv: boolean;
        }
        class QueryFilterCondition extends QueryValue implements IQueryFilterCondition {
            static readonly eq: string;
            static readonly ne: string;
            static readonly gt: string;
            static readonly lt: string;
            static readonly ge: string;
            static readonly le: string;
            static readonly startswith: string;
            static readonly endswith: string;
            static readonly contains: string;
            private static readonly dict;
            static fromModelAndName(dateTimeType: number, property: string, o: any, op?: string, inv?: boolean): QueryFilterCondition | null;
            operator: string | null;
            property: string | null;
            inv: boolean;
            constructor(origin?: IQueryFilterCondition);
            toQuery(): ((o: any) => boolean) | null;
            toString(): string | null;
        }
        interface IQuerySearch {
            value: IQueryFilterBooleanOperator;
        }
        class QuerySearch extends QueryNode implements IQuerySearch {
            value: QueryFilterBooleanOperator;
            constructor(origin: IQuerySearch | IQueryFilterBooleanOperator | IQueryFilterCondition);
            toString(): string | null;
            toQuery(): ((o: any) => boolean) | null;
        }
        interface IQuerySortingCondition {
            property: string;
            down: boolean;
        }
        class QuerySortingCondition extends QueryNode implements IQuerySortingCondition {
            property: string;
            down: boolean;
            constructor(x: IQuerySortingCondition);
            constructor(property: string, down?: boolean);
            toString(): string | null;
            toCompare(): ((o1: any, o2: any) => number) | null;
        }
        interface IQueryAggregation {
            operator: string;
            property: string;
            isCount: boolean;
            alias: string;
        }
        class QueryAggregation extends QueryNode implements IQueryAggregation {
            static readonly count: string;
            static readonly sum: string;
            static readonly average: string;
            static readonly min: string;
            static readonly max: string;
            private getCount();
            private getSum();
            private getAverage();
            private getMin();
            private getMax();
            operator: string;
            property: string;
            isCount: boolean;
            alias: string;
            constructor(x: IQueryAggregation);
            constructor(operator: string, property: string, alias: string);
            toString(): string | null;
            toQuery(): IAggregation;
        }
        interface IQueryGrouping {
            keys: Array<string>;
            aggregations: Array<IQueryAggregation>;
            dateTimeTypes: Array<number>;
        }
        class QueryGrouping extends QueryNode implements IQueryGrouping {
            keys: Array<string>;
            aggregations: Array<QueryAggregation>;
            dateTimeTypes: Array<number>;
            constructor(origin?: IQueryGrouping);
            private encodeGroups();
            private encodeAggrgates();
            toString(): string | null;
            toQuery(): (input: any[]) => any[];
        }
        interface IEndpoint extends Endpoint {
        }
        class Endpoint implements IEndpoint {
            static Get: string;
            static Post: string;
            static Put: string;
            static Delete: string;
            static Patch: string;
            baseUrl: string;
            verb: string;
            accpetsJson: boolean;
            returnsJson: boolean;
            bearerToken: string | null;
            ajaxId: string | null;
            constructor(x: IEndpoint);
            constructor(baseUrl: string, verb: string, accpetsJson?: boolean, returnsJson?: boolean, bearerToken?: string | null, ajaxId?: string | null);
        }
        interface IQueryDescription {
            skip: number | null;
            take: number;
            page: number;
            search: IQuerySearch;
            filter: IQueryFilterBooleanOperator;
            grouping: IQueryGrouping;
            sorting: Array<IQuerySortingCondition>;
            attachedTo: IEndpoint;
        }
        class QueryDescription implements IQueryDescription {
            private static filterName;
            private static applyName;
            private static sortingName;
            private static searchName;
            private static topName;
            private static skipName;
            protected urlEncode: (x: string) => string;
            customUrlEncode(func: (x: string) => string): void;
            skip: number | null;
            take: number;
            page: number;
            search: QuerySearch;
            filter: QueryFilterBooleanOperator;
            grouping: QueryGrouping;
            sorting: Array<QuerySortingCondition>;
            attachedTo: Endpoint;
            static fromJson(x: string): QueryDescription;
            constructor(origin: IQueryDescription);
            addFilterCondition(filter: QueryFilterClause | null, useOr?: boolean): void;
            getGroupDetailQuery(o: any): QueryDescription | null;
            queryString(): string | null;
            addToUrl(url: string | null): string | null;
            toString(): string | null;
            toQuery(): (o: Array<any>) => Array<any>;
        }
    }
}
