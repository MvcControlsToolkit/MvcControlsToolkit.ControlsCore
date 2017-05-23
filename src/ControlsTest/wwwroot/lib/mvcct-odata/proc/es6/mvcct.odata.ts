
    /// Query tree basic classes and interfaces
    const firstArgumentNull = "first argument must have a not null value";
    const anArgumentNull = "all arguments must have a not null value";
    const firstOperandNull = "first operand must have a not null value";
    const notImplemented = "notImplemented";
    const guidMatch = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    /// Utilities
    export interface IAggregation{
        property: string|null;
        alias: string;
        initialize: (x: IAggregation) => void;
        update: (val: any, x: IAggregation) => void;
        result: (x: IAggregation) => any;
        counters: number[];
        set?: {[x: string]: boolean}
    }
    function updateCountDistinct(val: any, agg: IAggregation){
        val=val+'';
        if(!agg.set[val]) {
            agg.counters[0]=agg.counters[0]+1;
            agg.set[val]=true;
        }
    }
    class aggregationDictionary{
        value: Array<any>;
        child: {[x: string]: aggregationDictionary}|null|undefined; 
        constructor()
        {
            this.value=[];
            this.child={};
        }
        add(properties: string[], row: any)
        {
            this.addInternal(properties.map(x => row[x]+''), 0, row);
        }
        protected addInternal(keys: string[], index: number, row: any)
        {
            if(index == keys.length) this.value.push(row);
            else {
                let next=this.child[keys[index]];
                if(!next) this.child[keys[index]]=next= new aggregationDictionary();
                next.addInternal(keys, index+1, row);
            }
        }
        aggregate(depth: number, properties: string[], aggregations: Array<IAggregation>) : Array<any>
        {
            if(depth>0){
                let res : Array<any> =[];
                for(let key in this.child)
                {
                    Array.prototype.push.apply(res, 
                        this.child[key].aggregate(depth-1, properties, aggregations));
                }
                return res;
            }
            else{
                if(!this.value.length) return [];
                aggregations.forEach(agg =>{agg.initialize(agg)});
                let res: any={};
                 properties.forEach(key => {
                        res[key]=(<any>(this.value[0]))[key];
                    });
                for(let o of this.value)
                {
                    aggregations.forEach(agg =>{agg.update(o[agg.property], agg)});
                }
                aggregations.forEach(agg =>{res[agg.alias]=agg.result(agg)});
                return [res];
            }
        }
    }

    function composition<T>(funcs: Array<(x: Array<T>) => Array<T>>): (x: Array<T>) => Array<T>
    {
        return (x: Array<T>) => {
            for(let f of funcs)
                x=f(x);
                return x;
            };
    }
    function lexicalOrder(funcs: Array<(o1: any, o2: any) => number>): (o1: any, o2: any) => number
    {
        return (o1: any, o2: any) =>{
            let res=0;
            for(let f of funcs){
                let x = f(o1, o2);
                if(x != 0) return x;
            }
            return res;
        };
    }
    ///
    export abstract class QueryNode
    {
        encodeProperty(name: string): string
        {
            if (name == null) return null;
            return name.replace(/\./g, '/');
        }
        decodeProperty(name: string): string
        {
            if (name == null) return null;
            return name.replace(/\//g, '.');
        }
        abstract toString() : string|null;
        getProperty(o: any, p: string): any
        {
            return QueryNode.getProperty(o, p);
        }
        static getProperty(o: any, p: string): any{
            var path=p.split('.');
            var i=0;
            while(typeof o === "object" && i<path.length)
                o=o[path[i++]];
            if(o && typeof o.getMonth === 'function') o=o.getTime();
            return o;
        }
    }

    /// filtering 
    export abstract class QueryFilterClause extends QueryNode
    {
        abstract toQuery() : ((o: any) => boolean)|null;
    }  
    export interface IQueryFilterBooleanOperator
    {
        operator?: number;
        argument1?: IQueryValue;
        argument2?: IQueryValue;
        child1?: IQueryFilterBooleanOperator;
        child2?: IQueryFilterBooleanOperator;
    }
    export class QueryFilterBooleanOperator extends QueryFilterClause implements IQueryFilterBooleanOperator
    {
        //boolean operators
        static readonly and = 0;
        static readonly or = 1;
        static readonly not = 2;
        //free search operators
        static readonly AND = 3;
        static readonly OR = 4;
        static readonly NOT = 5;

        operator: number;
        argument1: QueryValue;
        argument2: QueryValue;
        child1: QueryFilterBooleanOperator;
        child2: QueryFilterBooleanOperator;
        
        constructor(origin: IQueryFilterBooleanOperator);
        constructor(operator: number, 
            a1: QueryFilterClause,
            a2?: QueryFilterClause
            );
        constructor(y: number|IQueryFilterBooleanOperator, 
            a1: QueryFilterClause = null,
            a2: QueryFilterClause = null)
            {
                super();
                if(typeof y == "number")
                {
                    if(!a1) throw firstOperandNull;
                    this.operator=y;
                    if (typeof (<QueryFilterCondition>a1).dateTimeType == "undefined")
                    {
                        this.child1=(<QueryFilterBooleanOperator>a1);
                        this.argument1=null;
                    }
                    else
                    {
                        this.child1=null;
                        this.argument1=(<QueryFilterCondition>a1);
                    }
                    if(!a2) {
                        this.child2=null;
                        this.argument2=null;
                    }
                    else if (typeof (<QueryFilterCondition>a2).dateTimeType == "undefined")
                    {
                        this.child2=(<QueryFilterBooleanOperator>a2);
                        this.argument2=null;
                    }
                    else
                    {
                        this.child2=null;
                        this.argument2=(<QueryFilterCondition>a2);
                    }
                }
                else{
                    if(!y) throw firstArgumentNull;
                    this.argument1= y.argument1 ? 
                        (typeof (<QueryFilterCondition>y.argument1).operator != "undefined" ?
                             new QueryFilterCondition(<QueryFilterCondition>y.argument1) 
                             : new QueryValue(y.argument1))
                        : null;
                    this.argument2= y.argument2 ? 
                        (typeof (<QueryFilterCondition>y.argument2).operator != "undefined" ?
                             new QueryFilterCondition(<QueryFilterCondition>y.argument2) 
                             : new QueryValue(y.argument2)) 
                        : null;
                    this.child1=y.child1 ? new QueryFilterBooleanOperator(y.child1) : null;
                    this.child2=y.child2 ? new QueryFilterBooleanOperator(y.child2) : null;;
                    this.operator=y.operator || QueryFilterBooleanOperator.and;
                }
            }
            toString() : string|null
            {
                var arg1= this.argument1 || this.child1;
                var arg2= this.argument2 || this.child2;
                if(!arg1 && !arg2) return null;
                if (this.operator == QueryFilterBooleanOperator.not) 
                    return "(not "+(arg1 || arg2).toString()+")";
                else if (this.operator == QueryFilterBooleanOperator.NOT) 
                    return "(NOT "+(arg1 || arg2).toString()+")";
                else if (!arg1) return arg2.toString();
                else if (!arg2) return arg1.toString();
                var sarg1 = arg1.toString();
                var sarg2 = arg2.toString();
                if (!sarg1) return sarg2 || null;
                if (!sarg2) return sarg1 || null;
                if (this.operator == QueryFilterBooleanOperator.and) 
                    return "("+sarg1+" and " +sarg2+")";
                else if (this.operator == QueryFilterBooleanOperator.AND) 
                    return "("+sarg1+" AND " +sarg2+")";
                else if (this.operator == QueryFilterBooleanOperator.OR) 
                    return "("+sarg1+" OR " +sarg2+")";
                else 
                    return "("+sarg1+" or " +sarg2+")";
            }
            toQuery() : ((o: any) => boolean)|null
            {
                var arg1= this.argument1 || this.child1;
                var arg2= this.argument2 || this.child2;
                if(!arg1 && !arg2) return null;
                if (this.operator == QueryFilterBooleanOperator.not || 
                    this.operator == QueryFilterBooleanOperator.NOT) 
                    return (o: any) => !(arg1 || arg2).toQuery()(o);
                else if (!arg1) return arg2.toQuery();
                else if (!arg2) return arg1.toQuery();
                var qarg1 = arg1.toQuery();
                var qarg2 = arg2.toQuery();
                if (!qarg1) return qarg2 || null;
                if (!qarg2) return qarg1 || null;
                else if (this.operator == QueryFilterBooleanOperator.and || 
                          this.operator == QueryFilterBooleanOperator.AND)
                    return (o: any) => arg1.toQuery()(o) && arg2.toQuery()(o);
                else
                   return  (o: any) => arg1.toQuery()(o) || arg2.toQuery()(o); 
            }
    }
    export interface IQueryValue
    {
        value: any;
        dateTimeType: number;
    }
    export class QueryValue extends QueryFilterClause implements IQueryValue
    {
        static IsNotDateTime= 0;
        static IsDate = 1;
        static IsTime = 2;
        static IsDateTime = 3;
        static IsDuration = 4;
        
        
        value: any;
        dateTimeType: number;
        constructor(origin: IQueryValue=null)
        {
            super();
            if(origin)
            {
                this.value = origin.value;
                this.dateTimeType=origin.dateTimeType||QueryValue.IsNotDateTime;
            }
            else 
            {
                this.value = null;
                this.dateTimeType=QueryFilterCondition.IsNotDateTime;
            }
        }
        private formatInt(x: number, len:number) : string
        {
            var res = x+"";
            if(res.length<len) return new Array(len-res.length+1).join("0")+res;
            else return res;
        }
        private normalizeTime(x: string, days: boolean, maxTree:boolean): string
        {
            var parts=x.split(":");
            var dayPos=parts[0].indexOf(".");
            if(days && dayPos<0) x="00."+x;
            else if (days && dayPos == 0) x="00"+x;
            else if (days && dayPos == 1) x="0"+x;
            if(parts.length==1) x=x+":00:00.000";
            else if (parts.length ==2) x=x+":00.000";
            else if(parts[2].indexOf(".")<0) x=x+".000";
            else if(maxTree && parts[2].length>6) x=x.substr(0, x.length-parts[2].length+6);
            else if (parts[2].length<6) x=x+new Array(7-parts[2].length).join("0")
            return x; 
        }
        isGuid(): boolean
        {
            return typeof this.value == "string" && guidMatch.test((<string>this.value).toLowerCase());
        }
        setDate(x: Date|null) {
            this.dateTimeType = QueryValue.IsDate;
            if(!x) this.value=null;
            this.value=this.formatInt(x.getFullYear(), 4) +
                "-"+this.formatInt(x.getMonth()+1, 2) +
                "-"+this.formatInt(x.getDate(), 2) +"T00:00:00.000";
        }
        setTime(x: Date|null) {
            this.dateTimeType = QueryValue.IsTime;
            if(!x) this.value=null;
            this.value=this.formatInt(x.getHours(), 2) +
                ":"+this.formatInt(x.getMinutes(), 2) +
                ":"+this.formatInt(x.getSeconds(), 2) +
                "."+this.formatInt(x.getMilliseconds(), 3);
        } 
        setDuration(days: number, hours: number, minutes: number=0, 
            seconds: number =0, milliseconds: number =0) {
            this.dateTimeType = QueryValue.IsDuration;
            this.value=this.formatInt(days || 0, 2) +
                "."+this.formatInt(hours || 0, 2) +
                ":"+this.formatInt(minutes || 0, 2) +
                ":"+this.formatInt(seconds || 0, 2) +
                "."+this.formatInt(milliseconds || 0, 3);
        }
        setDateTimeLocal(x: Date|null) {
            this.dateTimeType = QueryValue.IsDateTime;
            if(!x) this.value=null;
            this.value= x.toISOString();
        }
        setDateTimeInvariant(x: Date|null) {
            this.dateTimeType = QueryValue.IsDateTime;
            if(!x) this.value=null;
            this.value=this.formatInt(x.getFullYear(), 4) +
                "-"+this.formatInt(x.getMonth()+1, 2) +
                "-"+this.formatInt(x.getDate(), 2) +
                "T"+this.formatInt(x.getHours(), 2) +
                ":"+this.formatInt(x.getMinutes(), 2) +
                ":"+this.formatInt(x.getSeconds(), 2) +
                "."+this.formatInt(x.getMilliseconds(), 3);
        }
        setBoolean(x: boolean|null) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        }
        setNumber(x: number|null) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        }
        setString(x: string|null) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value=x;
        }
        setNotDateTime(x: any){
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value=x;
        }
        getValue(): any{
           if(this.value===null || typeof this.value == "undefined")
                 return null;
            else if(this.dateTimeType == QueryValue.IsNotDateTime)
                return this.value;
            let val = (<string>this.value);
            switch(this.dateTimeType)
            {
                case QueryValue.IsDateTime:
                    let dtParts = val.match(/\d+/g);
                    if(val.charAt(val.length-1).toUpperCase() == "Z") 
                        return new Date(Date.UTC(
                            parseInt(dtParts[0]), parseInt(dtParts[1])-1, parseInt(dtParts[2]),
                            parseInt(dtParts[3]), parseInt(dtParts[4]), parseInt(dtParts[5]), parseInt(dtParts[6])))
                            .getTime();
                    else
                        return new Date(
                            parseInt(dtParts[0]), parseInt(dtParts[1])-1, parseInt(dtParts[2]),
                            parseInt(dtParts[3]), parseInt(dtParts[4]), parseInt(dtParts[5]), parseInt(dtParts[6]))
                            .getTime();
                case QueryValue.IsDate:
                   let dParts=val.split("T")[0].split("-");
                   return new Date(parseInt(dParts[0]), parseInt(dParts[1])-1, parseInt(dParts[2]))
                   .getTime();
                case QueryValue.IsTime:
                    val=this.normalizeTime(val, false, true);
                    let tParts = val.match(/\d+/g);
                    return new Date(
                            1970, 0, 1,
                            parseInt(tParts[0]), parseInt(tParts[1]), parseInt(tParts[2]), parseInt(tParts[3]))
                            .getTime();
                case QueryValue.IsDuration:
                    val=this.normalizeTime(val, true, false);
                    let parts = val.match(/\d+/g);
                    return (((parseInt(parts[0])*24 +
                        parseInt(parts[1]))*60 +
                        parseInt(parts[2]))*60  +
                        parseInt(parts[3]))*1000 + 
                        parseInt(parts[4]) ;
                default:
                    return null;
            }
        }
        toString() : string|null
        {
            if(this.value===null || typeof this.value == "undefined")
                 return "null";
            else if(this.dateTimeType == QueryValue.IsNotDateTime)
                return this.value + "";
            let val = (<string>this.value);
            switch(this.dateTimeType)
            {
                case QueryValue.IsDateTime:
                    if(val.charAt(val.length-1).toUpperCase() != "Z") return val+"Z";
                    else return val;
                case QueryValue.IsDate:
                   return  val.split("T")[0];
                case QueryValue.IsTime:
                    val=this.normalizeTime(val, false, true);
                    return val;
                case QueryValue.IsDuration:
                    val=this.normalizeTime(val, true, false);
                    let parts = val.match(/\d+/g);
                    return "'P"+parts[0] + "DT"+
                        parts[1] + "H" +
                        parts[2] + "M" +
                        parts[3] + "." +
                        parts[4] + new Array(13-parts[4].length).join("0") + "S'";
                default:
                    return null;
            }
        }
        toQuery(): ((o: any) => boolean) | null
        {
            return null;
        }

    }
    export interface IQueryFilterCondition extends IQueryValue
    {
        operator: string|null;
        property: string|null;
        inv: boolean;
    }
    export class QueryFilterCondition  extends QueryValue implements IQueryFilterCondition
    {
        static readonly eq= "eq";
        static readonly ne = "ne";
        static readonly gt = "gt";
        static readonly lt = "lt";
        static readonly ge = "ge";
        static readonly le = "le";
        static readonly startswith = "startswith";
        static readonly endswith = "endswith";
        static readonly contains = "contains";
        private static readonly dict: {[name: string]: (x: any, y:any) => boolean} = 
            {
                "eq": (x, y) => x == y,
                "ne": (x, y) => x != y,
                "gt": (x, y) => x > y,
                "lt": (x, y) => x < y,
                "ge": (x, y) => x >= y,
                "le": (x, y) => x <= y,
                "startswith": (x, y) => ((x||'')+'').indexOf((y||'')+'') == 0,
                "endswith": (x, y) => {
                    let xs=(x||'')+'';
                    let ys=(y||'')+'';
                    return xs.indexOf(ys, xs.length - ys.length) >=0;
                },
                "contains": (x, y) => ((x||'')+'').indexOf((y||'')+'') >= 0
            };
        public static fromModelAndName(dateTimeType: number, property: string, o: any, op:string='eq', inv: boolean=false): QueryFilterCondition | null
        {
            if(!o) return null;
            var value = QueryNode.getProperty(o, property);
            var res = new QueryFilterCondition();
            res.inv=inv;
            res.property=property;
            res.operator=op;
            switch(dateTimeType){
                case QueryValue.IsDate:
                    res.setDate(value as Date|null);
                    break;
                case QueryValue.IsTime:
                    res.setTime(value as Date|null);
                    break;
                case QueryValue.IsDateTime:
                    res.setDateTimeLocal(value as Date|null);
                default:
                    res.setNotDateTime(value);    
                    break;
            }
            return res;
        }
        operator: string|null;
        property: string|null;
        inv: boolean;
        constructor(origin: IQueryFilterCondition=null)
        {
            super(origin);
            if(origin)
            {
                this.operator=origin.operator || null;
                this.inv=origin.inv || false;
                this.property=origin.property || null;
            }
            else 
            {
                this.operator=null;
                this.inv=false;
                this.property=null;
            }
        }
        toQuery() : ((o: any) => boolean)|null
        {
            let val = this.getValue();
            
            if(!this.property) {
                var res = (o: any) => {
                    if(typeof o !== "object") return false;
                    for(let key in o) {
                        let cval = o[key];
                        if(typeof cval === "string"){
                            if(cval.indexOf(val) >=0) return true;
                        }
                    }
                    return false;
                };
                return res;     
            }
            if (!this.operator) return null;
            let op = QueryFilterCondition.dict[this.operator];
            if(!op) return null;
            let self=this;
            let property = this.property;
            switch(this.operator)
            {
                case QueryFilterCondition.startswith:
                case QueryFilterCondition.endswith:
                case QueryFilterCondition.contains:
                    if (this.inv) return (o:any) => op(val, self.getProperty(o, property));
                    else return (o:any) => op(self.getProperty(o, property), val);
                default:
                    return (o:any) => op(self.getProperty(o, property), val);

            }
        }
        toString(): string|null
        {
            var val=super.toString();
            if (val === null) return null;
            if(!this.property) return val;
            if(this.dateTimeType == QueryValue.IsNotDateTime &&
                typeof this.value == "string" &&
                !this.isGuid()
            ) val = "'"+val+"'";
            
            switch(this.operator)
            {
                case QueryFilterCondition.startswith:
                case QueryFilterCondition.endswith:
                case QueryFilterCondition.contains:
                    if (this.inv) return this.operator+"("+val+","+this.encodeProperty(this.property)+")";
                    else return this.operator+"("+this.encodeProperty(this.property)+","+val+")";
                default:
                    return "("+this.encodeProperty(this.property)+" "+this.operator+" "+val+")";

            }
        }
    }

    /// free search

    export interface IQuerySearch
    {
        value: IQueryFilterBooleanOperator;
    }

    export class QuerySearch  extends QueryNode implements IQuerySearch
    {
        value: QueryFilterBooleanOperator;
        constructor(origin: IQuerySearch|IQueryFilterBooleanOperator|IQueryFilterCondition)
        {
            super();
            if (!origin) throw firstArgumentNull;
            if(typeof (<IQueryFilterCondition>origin).dateTimeType != "undefined")
                    this.value = new QueryFilterBooleanOperator(QueryFilterBooleanOperator.AND, 
                        new QueryFilterCondition(<IQueryFilterCondition>origin));
            else if(typeof (<IQueryFilterCondition>origin).operator != "undefined")
                    this.value = new QueryFilterBooleanOperator(<IQueryFilterBooleanOperator>origin);      
            else
               this.value = (<IQuerySearch>origin).value ?   
                    new QueryFilterBooleanOperator((<IQuerySearch>origin).value) 
                    : null;
        }
        toString(): string|null
        {
            if(!this.value) return null;
            else return this.value.toString();
        }
        toQuery() : ((o: any) => boolean)|null
        {
            if(!this.value) return null;
            else return this.value.toQuery();
        }
    }

    /// sorting
    export interface IQuerySortingCondition
    {
        property: string;
        down: boolean;
    }
    export class QuerySortingCondition  extends QueryNode implements IQuerySortingCondition
    {
        property: string;
        down: boolean;

        constructor(x: IQuerySortingCondition);
        constructor(property: string, down?: boolean);
        constructor(y: string|IQuerySortingCondition, down: boolean = false)
        {
            super();
            if(typeof y == "string")
            {
                this.property=y;
                this.down=down;
            }
            else
            {
                if(!y) throw firstArgumentNull; 
                this.property=y.property;
                this.down=y.down;
            }
            
        }
        toString(): string|null
        {
            if(!this.property) return null;
            if(this.down) return this.encodeProperty(this.property)+" desc";
            else return this.encodeProperty(this.property)+" asc";
        }
        toCompare(): ((o1: any, o2: any) => number) | null
        {
            if(!this.property) return null;
            let prop = this.property;
            let self = this;
            if(this.down)
                return (x, y) =>{
                    let val1 = self.getProperty(x, prop);
                    let val2 = self.getProperty(y, prop);
                    if(val1 > val2) return -1;
                    else if(val1 < val2) return 1;
                    else return 0;
                }
            else
               return (x, y) =>{
                    let val1 = self.getProperty(x, prop);
                    let val2 = self.getProperty(y, prop);
                    if(val1 < val2) return -1;
                    else if(val1 > val2) return 1;
                    else return 0;
                } 
        }
    }

    ///grouping
    export interface IQueryAggregation
    {
        operator: string;
        property: string;
        isCount: boolean;
        alias: string;
    }

    export class QueryAggregation   extends QueryNode implements IQueryAggregation
    {
        static readonly count = "countdistinct";
        static readonly sum = "sum";
        static readonly average = "average";
        static readonly min = "min";
        static readonly max = "max";
        private  getCount(): IAggregation
        {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: x => {x.set={}; x.counters[0] = 0;},
                result: x => x.counters[0],
                update: updateCountDistinct
            };
        } 
        private  getSum(): IAggregation
        {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: x => {x.counters[0] = 0;},
                result: x => x.counters[0],
                update: (x, agg) => {agg.counters[0] = agg.counters[0]+x;}
            };
        } 
        private  getAverage(): IAggregation
        {
            return {
                counters: [0, 0],
                alias: this.alias,
                property: this.property,
                initialize: x => {x.counters[0] = 0; x.counters[1] = 0},
                result: x => x.counters[0]/x.counters[1],
                update: (x, agg) => {
                    agg.counters[0] = agg.counters[0]+x;
                    agg.counters[1] = agg.counters[1]+1;
                }
            };
        } 
        private  getMin(): IAggregation
        {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: x => {x.counters[0] = undefined; },
                result: x => x.counters[0],
                update: (x, agg) => {
                    if(typeof agg.counters[0] === "undefined" || 
                       x < agg.counters[0]) 
                       agg.counters[0] = x;
                       

                }
            };
        } 
        private  getMax(): IAggregation
        {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: x => {x.counters[0] = undefined; },
                result: x => x.counters[0],
                update: (x, agg) => {
                    if(typeof agg.counters[0] === "undefined" || 
                       x > agg.counters[0]) 
                       agg.counters[0] = x;
                       

                }
            };
        } 
        operator: string;
        property: string;
        isCount: boolean;
        alias: string;

        constructor(x: IQueryAggregation);
        constructor(operator: string, property: string, alias: string);
        constructor(y: IQueryAggregation|string, property: string = null, alias: string = null)
        {
            super();
            if(typeof y == "string")
            {
               if(!y || !property || !alias) throw anArgumentNull; 
               this.operator = y;
               this.isCount=y == QueryAggregation.count;
               this.property=property;
               this.alias=alias;
            }
            else{
                if(!y) throw firstArgumentNull; 
                this.isCount=y.operator == QueryAggregation.count;
                this.operator=y.operator;
                this.alias=y.alias;
                this.property=y.property;
            }
        }
        toString(): string|null
        {
            if(!this.property || !this.operator || !this.alias) return null;
            return this.encodeProperty(this.property) + 
                " with " + this.operator +
                " as " + this.alias;
        }
        toQuery(): IAggregation{
            switch(this.operator){
                case QueryAggregation.count : return this.getCount();
                case QueryAggregation.min : return this.getMin();
                case QueryAggregation.max : return this.getMax();
                case QueryAggregation.sum : return this.getSum();
                case QueryAggregation.average : return this.getAverage(); 
            }
        }
    }

    export interface IQueryGrouping 
    {
        keys: Array<string>;
        aggregations: Array<IQueryAggregation>;
        dateTimeTypes: Array<number>;
    }

    export class QueryGrouping    extends QueryNode implements IQueryGrouping
    {
        keys: Array<string>;
        aggregations: Array<QueryAggregation>; 
        dateTimeTypes: Array<number>;
        constructor(origin: IQueryGrouping = null)
        {
            super();
            if(!origin)
            {
                this.keys=new Array<string>();
                this.dateTimeTypes=new Array<number>();
                this.aggregations=new Array<QueryAggregation>();
            }
            else
            {
                if(origin.keys) this.keys=origin.keys.map(x => x);
                else this.keys=new Array<string>();
                if(origin.dateTimeTypes) this.dateTimeTypes=origin.dateTimeTypes.map(x => x);
                else this.dateTimeTypes=new Array<number>();
                if(origin.aggregations) this.aggregations=origin.aggregations
                    .map(x => new QueryAggregation(x));
                else this.aggregations=new Array<QueryAggregation>();
            }
        }
        private encodeGroups(): string|null
        {
            if (!this.keys == null || !this.keys.length) return null;
            if (this.keys.length == 1) return this.encodeProperty(this.keys[0]);
            return this.keys.filter(x => x).map(x => this.encodeProperty(x)).join(',');  
        }
        private encodeAggrgates(): string|null
        {
            if (!this.aggregations|| !this.aggregations.length) return null;
            if (this.aggregations.length == 1) return this.aggregations[0].toString();
            return this.aggregations.map(x => x.toString()).filter(x => x).join(',');

        }
        toString(): string|null
        {
            var groups = this.encodeGroups();
            if (!groups) return null;

            var aggs = this.encodeAggrgates();

            if (!aggs) return "groupby(("+groups+"))";
            else return "groupby(("+groups+"),aggregate("+aggs+"))";
        }
        toQuery(): (input: any[]) => any[]
        {
            if (!this.keys || !this.keys.length) return null;
            let keys = this.keys.map(x => x);
            let aggs = !this.aggregations || !this.aggregations.length ? [] :
                this.aggregations.map(x => x.toQuery());
            return (input: any[]) => {
                if(!input || !input.length) return [];
                let aggregator = new aggregationDictionary();
                input.forEach(x => {
                    aggregator.add(keys, x);
                })
                return aggregator.aggregate(keys.length, keys, aggs);
            }
        }
    }

    /// utility
    export interface IEndpoint extends Endpoint
    {
        
    }
    export class Endpoint implements IEndpoint
    {
        static Get: string = "GET";
        static Post: string = "POST";
        static Put: string = "PUT";
        static Delete: string = "DELETE";
        static Patch: string = "PATCH";

        baseUrl: string;
        verb: string;
        accpetsJson: boolean;
        returnsJson: boolean;
        bearerToken: string|null;
        ajaxId: string|null;;
        constructor(x: IEndpoint);
        constructor(baseUrl: string, verb: string, accpetsJson?: boolean, returnsJson?: boolean, bearerToken?: string|null, ajaxId?: string|null)
        constructor(y: string|IEndpoint, verb: string = null, accpetsJson: boolean = false, returnsJson: boolean = false, bearerToken: string|null = null, ajaxId: string|null = null)
        {
            if(typeof y == "string"){
                this.baseUrl = y;
                this.bearerToken=bearerToken;
                this.accpetsJson=accpetsJson;
                this.returnsJson=returnsJson;
                this.verb = verb;
                this.ajaxId=ajaxId;
            }
            else
            {
               if(!y) throw firstArgumentNull; 
               this.baseUrl = y.baseUrl;
               this.bearerToken=y.bearerToken;
               this.accpetsJson=y.accpetsJson;
               this.returnsJson=y.returnsJson;
               this.verb = y.verb;
            }
        }
        
        
    }
    
    ///Full query container
    export interface IQueryDescription
    {
        skip: number|null;
        take: number;
        page: number;

        search: IQuerySearch;
        filter: IQueryFilterBooleanOperator;
        grouping: IQueryGrouping;
        sorting: Array<IQuerySortingCondition>;

        attachedTo: IEndpoint;
    }
    export class QueryDescription implements IQueryDescription
    {
        private static filterName = "$filter";
        private static applyName = "$apply";
        private static sortingName = "$orderby";
        private static searchName = "$search";
        private static topName = "$top";
        private static skipName = "$skip";

        protected urlEncode : (x: string) => string = encodeURIComponent;
        public customUrlEncode(func: (x: string) => string)
        {
            this.urlEncode = func || this.urlEncode;
        }

        skip: number|null;
        take: number;
        page: number;

        search: QuerySearch;
        filter: QueryFilterBooleanOperator;
        grouping: QueryGrouping;
        sorting: Array<QuerySortingCondition>;

        attachedTo: Endpoint;

        static fromJson(x: string) : QueryDescription {
            if(!x) return null;
            return new QueryDescription(JSON.parse(x));
        }
        
        constructor(origin: IQueryDescription)
        {
            if(origin)
            {
                this.skip=origin.skip;
                this.take=origin.take;
                this.page=origin.page; 

                this.search = origin.search ? new QuerySearch(origin.search) : null;
                this.filter = origin.filter ? new QueryFilterBooleanOperator(origin.filter) : null;
                this.grouping = origin.grouping ? new QueryGrouping(origin.grouping) : null;
                this.sorting = origin.sorting ? 
                    origin.sorting.map(x => new QuerySortingCondition(x)) : null; 

                this.attachedTo= origin.attachedTo ? new Endpoint(origin.attachedTo) : null;
            }
            else
            {
                this.skip=null;
                this.take=0;
                this.page=0;

                this.search=null;
                this.filter=null;
                this.grouping=null;
                this.sorting= new Array<QuerySortingCondition>();

                this.attachedTo=null;
            }
        }
        addFilterCondition(filter: QueryFilterClause|null, useOr: boolean=false): void
        {
            if(!filter) return;
            if (!this.filter){
                this.filter = typeof (<QueryFilterCondition>filter).dateTimeType == "undefined" ?
                    filter as QueryFilterBooleanOperator
                    :
                    new QueryFilterBooleanOperator(
                        QueryFilterBooleanOperator.and,
                        filter as QueryFilterCondition,
                        null
                   )
                return;
            }
            var cleanFilter: QueryFilterClause ;
            if(this.filter.operator != QueryFilterBooleanOperator.not)
            {
                if (!this.filter.child1 && !this.filter.argument1) 
                    cleanFilter = this.filter.argument2 || this.filter.child2;
                else if (!this.filter.child2 && !this.filter.argument2) 
                    cleanFilter = this.filter.argument1 || this.filter.child1;
                else cleanFilter = this.filter;
            }
            else cleanFilter = this.filter;
            this.filter = new QueryFilterBooleanOperator(
                useOr ? QueryFilterBooleanOperator.or : 
                        QueryFilterBooleanOperator.and,
                cleanFilter,
                filter
            );
        }
        getGroupDetailQuery(o: any): QueryDescription|null
        {
            if(!o || !this.grouping || !this.grouping.keys || !this.grouping.keys.length) return null;
            var newQuery = new QueryDescription(this);
            newQuery.grouping = null;
            newQuery.take = null;
            newQuery.page = 1;
            newQuery.skip = 0;
            for(var i=0; i< this.grouping.keys.length; i++)
            {
                var cond = QueryFilterCondition.fromModelAndName(
                    this.grouping.dateTimeTypes[i], 
                    this.grouping.keys[i],
                    o
                    );
                if(!cond) continue;
                newQuery.addFilterCondition(cond);
            }
            return newQuery;
        }
        public queryString(): string|null
        {
            var sb = new Array<string>();
            var search = this.search ? this.search.toString() : null;;
            var filter: string = null;
            if(search){
                sb.push(QueryDescription.searchName);
                sb.push("=");
                sb.push(this.urlEncode(search));
            }
            else
            {
                filter = this.filter ? this.filter.toString() : null;
                if(filter){
                    sb.push(QueryDescription.filterName);
                    sb.push("=");
                    sb.push(this.urlEncode(filter));
                }
            }
            var apply = this.grouping ? this.grouping.toString() : null;
            if(apply){
                if(sb.length) sb.push("&");
                sb.push(QueryDescription.applyName);
                sb.push("=");
                sb.push(this.urlEncode(apply)); 
            }
            var sorting = this.sorting ?
                this.sorting.map(x => x.toString()).filter(x => x).join(',') : null;
            if (sorting){
                if(sb.length) sb.push("&");
                sb.push(QueryDescription.sortingName);
                sb.push("=");
                sb.push(this.urlEncode(sorting)); 
            }
            if(this.skip>0){
                if(sb.length) sb.push("&");
                sb.push(QueryDescription.skipName);
                sb.push("=");
                sb.push(this.skip+""); 
            }
            if(this.take && this.take>0){
                if(sb.length) sb.push("&");
                sb.push(QueryDescription.topName);
                sb.push("=");
                sb.push(this.take+""); 
            }
            return sb.length ? sb.join("") : null;
        }
        public addToUrl(url: string|null): string|null
        {
            if (!url) url = '';
            var query = this.queryString();
            if (!query || !query.trim()) return url;
            if (url.indexOf('?')>=0) return url + "&" + query;
            else return url + "?" + query;
        }
        toString(): string|null
        {
            return this.addToUrl(this.attachedTo? this.attachedTo.baseUrl : null);
        }
        
        toQuery(): (o: Array<any>) =>  Array<any>
        {
             let toCompose: Array<(x: Array<any>) => Array<any>> =[];
             let search = this.search ? this.search.toQuery(): null;
             if(search){
                 toCompose.push(
                     x=> x.filter(search)
                 );
             } 
             else{
                 let filter = this.filter ? this.filter.toQuery(): null;
                 if(filter){
                     toCompose.push(
                        x=> x.filter(filter)
                    );
                 }
             }
             let grouping = this.grouping ? this.grouping.toQuery() : null;
             if(grouping){
                 toCompose.push(grouping);
             }
             let sorting = this.sorting ? lexicalOrder(this.sorting.map(x => x.toCompare())) : null;
             if(sorting) toCompose.push(
                x => {
                    let y = x.map(el => el);
                    y.sort(sorting);
                    return y;
                }
             );
             if(this.skip>0 || (this.take && this.take>0))
             {
                 let skip= this.skip>0 ? this.skip : 0;
                 let take = (this.take && this.take>0) ? this.take+skip : undefined;
                 toCompose.push(
                     x => x.length && skip<x.length? 
                        x.slice(skip, take ? Math.min(take, x.length) : undefined) :
                        []
                 );
             }
             if(toCompose.length) return composition(toCompose);
             else return x => x;
        }
    } 
    



