var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var firstArgumentNull = "first argument must have a not null value";
    var anArgumentNull = "all arguments must have a not null value";
    var firstOperandNull = "first operand must have a not null value";
    var notImplemented = "notImplemented";
    var guidMatch = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    function updateCountDistinct(val, agg) {
        val = val + '';
        if (!agg.set[val]) {
            agg.counters[0] = agg.counters[0] + 1;
            agg.set[val] = true;
        }
    }
    var aggregationDictionary = (function () {
        function aggregationDictionary() {
            this.value = [];
            this.child = {};
        }
        aggregationDictionary.prototype.add = function (properties, row) {
            this.addInternal(properties.map(function (x) { return row[x] + ''; }), 0, row);
        };
        aggregationDictionary.prototype.addInternal = function (keys, index, row) {
            if (index == keys.length)
                this.value.push(row);
            else {
                var next = this.child[keys[index]];
                if (!next)
                    this.child[keys[index]] = next = new aggregationDictionary();
                next.addInternal(keys, index + 1, row);
            }
        };
        aggregationDictionary.prototype.aggregate = function (depth, properties, aggregations) {
            var _this = this;
            if (depth > 0) {
                var res = [];
                for (var key in this.child) {
                    Array.prototype.push.apply(res, this.child[key].aggregate(depth - 1, properties, aggregations));
                }
                return res;
            }
            else {
                if (!this.value.length)
                    return [];
                aggregations.forEach(function (agg) { agg.initialize(agg); });
                var res_1 = {};
                properties.forEach(function (key) {
                    res_1[key] = (_this.value[0])[key];
                });
                var _loop_1 = function (o) {
                    aggregations.forEach(function (agg) { agg.update(o[agg.property], agg); });
                };
                for (var _i = 0, _a = this.value; _i < _a.length; _i++) {
                    var o = _a[_i];
                    _loop_1(o);
                }
                aggregations.forEach(function (agg) { res_1[agg.alias] = agg.result(agg); });
                return [res_1];
            }
        };
        return aggregationDictionary;
    }());
    function composition(funcs) {
        return function (x) {
            for (var _i = 0, funcs_1 = funcs; _i < funcs_1.length; _i++) {
                var f = funcs_1[_i];
                x = f(x);
            }
            return x;
        };
    }
    function lexicalOrder(funcs) {
        return function (o1, o2) {
            var res = 0;
            for (var _i = 0, funcs_2 = funcs; _i < funcs_2.length; _i++) {
                var f = funcs_2[_i];
                var x = f(o1, o2);
                if (x != 0)
                    return x;
            }
            return res;
        };
    }
    var QueryNode = (function () {
        function QueryNode() {
        }
        QueryNode.prototype.encodeProperty = function (name) {
            if (name == null)
                return null;
            return name.replace(/\./g, '/');
        };
        QueryNode.prototype.decodeProperty = function (name) {
            if (name == null)
                return null;
            return name.replace(/\//g, '.');
        };
        QueryNode.prototype.getProperty = function (o, p) {
            return QueryNode.getProperty(o, p);
        };
        QueryNode.getProperty = function (o, p) {
            var path = p.split('.');
            var i = 0;
            while (typeof o === "object" && i < path.length)
                o = o[path[i++]];
            if (o && typeof o.getMonth === 'function')
                o = o.getTime();
            return o;
        };
        return QueryNode;
    }());
    exports.QueryNode = QueryNode;
    var QueryFilterClause = (function (_super) {
        __extends(QueryFilterClause, _super);
        function QueryFilterClause() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return QueryFilterClause;
    }(QueryNode));
    exports.QueryFilterClause = QueryFilterClause;
    var QueryFilterBooleanOperator = (function (_super) {
        __extends(QueryFilterBooleanOperator, _super);
        function QueryFilterBooleanOperator(y, a1, a2) {
            if (a1 === void 0) { a1 = null; }
            if (a2 === void 0) { a2 = null; }
            var _this = _super.call(this) || this;
            if (typeof y == "number") {
                if (!a1)
                    throw firstOperandNull;
                _this.operator = y;
                if (typeof a1.dateTimeType == "undefined") {
                    _this.child1 = a1;
                    _this.argument1 = null;
                }
                else {
                    _this.child1 = null;
                    _this.argument1 = a1;
                }
                if (!a2) {
                    _this.child2 = null;
                    _this.argument2 = null;
                }
                else if (typeof a2.dateTimeType == "undefined") {
                    _this.child2 = a2;
                    _this.argument2 = null;
                }
                else {
                    _this.child2 = null;
                    _this.argument2 = a2;
                }
            }
            else {
                if (!y)
                    throw firstArgumentNull;
                _this.argument1 = y.argument1 ?
                    (typeof y.argument1.operator != "undefined" ?
                        new QueryFilterCondition(y.argument1)
                        : new QueryValue(y.argument1))
                    : null;
                _this.argument2 = y.argument2 ?
                    (typeof y.argument2.operator != "undefined" ?
                        new QueryFilterCondition(y.argument2)
                        : new QueryValue(y.argument2))
                    : null;
                _this.child1 = y.child1 ? new QueryFilterBooleanOperator(y.child1) : null;
                _this.child2 = y.child2 ? new QueryFilterBooleanOperator(y.child2) : null;
                ;
                _this.operator = y.operator || QueryFilterBooleanOperator.and;
            }
            return _this;
        }
        QueryFilterBooleanOperator.prototype.toString = function () {
            var arg1 = this.argument1 || this.child1;
            var arg2 = this.argument2 || this.child2;
            if (!arg1 && !arg2)
                return null;
            if (this.operator == QueryFilterBooleanOperator.not)
                return "(not " + (arg1 || arg2).toString() + ")";
            else if (this.operator == QueryFilterBooleanOperator.NOT)
                return "(NOT " + (arg1 || arg2).toString() + ")";
            else if (!arg1)
                return arg2.toString();
            else if (!arg2)
                return arg1.toString();
            var sarg1 = arg1.toString();
            var sarg2 = arg2.toString();
            if (!sarg1)
                return sarg2 || null;
            if (!sarg2)
                return sarg1 || null;
            if (this.operator == QueryFilterBooleanOperator.and)
                return "(" + sarg1 + " and " + sarg2 + ")";
            else if (this.operator == QueryFilterBooleanOperator.AND)
                return "(" + sarg1 + " AND " + sarg2 + ")";
            else if (this.operator == QueryFilterBooleanOperator.OR)
                return "(" + sarg1 + " OR " + sarg2 + ")";
            else
                return "(" + sarg1 + " or " + sarg2 + ")";
        };
        QueryFilterBooleanOperator.prototype.toQuery = function () {
            var arg1 = this.argument1 || this.child1;
            var arg2 = this.argument2 || this.child2;
            if (!arg1 && !arg2)
                return null;
            if (this.operator == QueryFilterBooleanOperator.not ||
                this.operator == QueryFilterBooleanOperator.NOT)
                return function (o) { return !(arg1 || arg2).toQuery()(o); };
            else if (!arg1)
                return arg2.toQuery();
            else if (!arg2)
                return arg1.toQuery();
            var qarg1 = arg1.toQuery();
            var qarg2 = arg2.toQuery();
            if (!qarg1)
                return qarg2 || null;
            if (!qarg2)
                return qarg1 || null;
            else if (this.operator == QueryFilterBooleanOperator.and ||
                this.operator == QueryFilterBooleanOperator.AND)
                return function (o) { return arg1.toQuery()(o) && arg2.toQuery()(o); };
            else
                return function (o) { return arg1.toQuery()(o) || arg2.toQuery()(o); };
        };
        return QueryFilterBooleanOperator;
    }(QueryFilterClause));
    QueryFilterBooleanOperator.and = 0;
    QueryFilterBooleanOperator.or = 1;
    QueryFilterBooleanOperator.not = 2;
    QueryFilterBooleanOperator.AND = 3;
    QueryFilterBooleanOperator.OR = 4;
    QueryFilterBooleanOperator.NOT = 5;
    exports.QueryFilterBooleanOperator = QueryFilterBooleanOperator;
    var QueryValue = (function (_super) {
        __extends(QueryValue, _super);
        function QueryValue(origin) {
            if (origin === void 0) { origin = null; }
            var _this = _super.call(this) || this;
            if (origin) {
                _this.value = origin.value;
                _this.dateTimeType = origin.dateTimeType || QueryValue.IsNotDateTime;
            }
            else {
                _this.value = null;
                _this.dateTimeType = QueryFilterCondition.IsNotDateTime;
            }
            return _this;
        }
        QueryValue.prototype.formatInt = function (x, len) {
            var res = x + "";
            if (res.length < len)
                return new Array(len - res.length + 1).join("0") + res;
            else
                return res;
        };
        QueryValue.prototype.normalizeTime = function (x, days, maxTree) {
            var parts = x.split(":");
            var dayPos = parts[0].indexOf(".");
            if (days && dayPos < 0)
                x = "00." + x;
            else if (days && dayPos == 0)
                x = "00" + x;
            else if (days && dayPos == 1)
                x = "0" + x;
            if (parts.length == 1)
                x = x + ":00:00.000";
            else if (parts.length == 2)
                x = x + ":00.000";
            else if (parts[2].indexOf(".") < 0)
                x = x + ".000";
            else if (maxTree && parts[2].length > 6)
                x = x.substr(0, x.length - parts[2].length + 6);
            else if (parts[2].length < 6)
                x = x + new Array(7 - parts[2].length).join("0");
            return x;
        };
        QueryValue.prototype.isGuid = function () {
            return typeof this.value == "string" && guidMatch.test(this.value.toLowerCase());
        };
        QueryValue.prototype.setDate = function (x) {
            this.dateTimeType = QueryValue.IsDate;
            if (!x)
                this.value = null;
            this.value = this.formatInt(x.getFullYear(), 4) +
                "-" + this.formatInt(x.getMonth() + 1, 2) +
                "-" + this.formatInt(x.getDate(), 2) + "T00:00:00.000";
        };
        QueryValue.prototype.setTime = function (x) {
            this.dateTimeType = QueryValue.IsTime;
            if (!x)
                this.value = null;
            this.value = this.formatInt(x.getHours(), 2) +
                ":" + this.formatInt(x.getMinutes(), 2) +
                ":" + this.formatInt(x.getSeconds(), 2) +
                "." + this.formatInt(x.getMilliseconds(), 3);
        };
        QueryValue.prototype.setDuration = function (days, hours, minutes, seconds, milliseconds) {
            if (minutes === void 0) { minutes = 0; }
            if (seconds === void 0) { seconds = 0; }
            if (milliseconds === void 0) { milliseconds = 0; }
            this.dateTimeType = QueryValue.IsDuration;
            this.value = this.formatInt(days || 0, 2) +
                "." + this.formatInt(hours || 0, 2) +
                ":" + this.formatInt(minutes || 0, 2) +
                ":" + this.formatInt(seconds || 0, 2) +
                "." + this.formatInt(milliseconds || 0, 3);
        };
        QueryValue.prototype.setDateTimeLocal = function (x) {
            this.dateTimeType = QueryValue.IsDateTime;
            if (!x)
                this.value = null;
            this.value = x.toISOString();
        };
        QueryValue.prototype.setDateTimeInvariant = function (x) {
            this.dateTimeType = QueryValue.IsDateTime;
            if (!x)
                this.value = null;
            this.value = this.formatInt(x.getFullYear(), 4) +
                "-" + this.formatInt(x.getMonth() + 1, 2) +
                "-" + this.formatInt(x.getDate(), 2) +
                "T" + this.formatInt(x.getHours(), 2) +
                ":" + this.formatInt(x.getMinutes(), 2) +
                ":" + this.formatInt(x.getSeconds(), 2) +
                "." + this.formatInt(x.getMilliseconds(), 3);
        };
        QueryValue.prototype.setBoolean = function (x) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        };
        QueryValue.prototype.setNumber = function (x) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        };
        QueryValue.prototype.setString = function (x) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        };
        QueryValue.prototype.setNotDateTime = function (x) {
            this.dateTimeType = QueryValue.IsNotDateTime;
            this.value = x;
        };
        QueryValue.prototype.getValue = function () {
            if (this.value === null || typeof this.value == "undefined")
                return null;
            else if (this.dateTimeType == QueryValue.IsNotDateTime)
                return this.value;
            var val = this.value;
            switch (this.dateTimeType) {
                case QueryValue.IsDateTime:
                    var dtParts = val.match(/\d+/g);
                    if (val.charAt(val.length - 1).toUpperCase() == "Z")
                        return new Date(Date.UTC(parseInt(dtParts[0]), parseInt(dtParts[1]) - 1, parseInt(dtParts[2]), parseInt(dtParts[3]), parseInt(dtParts[4]), parseInt(dtParts[5]), parseInt(dtParts[6])))
                            .getTime();
                    else
                        return new Date(parseInt(dtParts[0]), parseInt(dtParts[1]) - 1, parseInt(dtParts[2]), parseInt(dtParts[3]), parseInt(dtParts[4]), parseInt(dtParts[5]), parseInt(dtParts[6]))
                            .getTime();
                case QueryValue.IsDate:
                    var dParts = val.split("T")[0].split("-");
                    return new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]))
                        .getTime();
                case QueryValue.IsTime:
                    val = this.normalizeTime(val, false, true);
                    var tParts = val.match(/\d+/g);
                    return new Date(1970, 0, 1, parseInt(tParts[0]), parseInt(tParts[1]), parseInt(tParts[2]), parseInt(tParts[3]))
                        .getTime();
                case QueryValue.IsDuration:
                    val = this.normalizeTime(val, true, false);
                    var parts = val.match(/\d+/g);
                    return (((parseInt(parts[0]) * 24 +
                        parseInt(parts[1])) * 60 +
                        parseInt(parts[2])) * 60 +
                        parseInt(parts[3])) * 1000 +
                        parseInt(parts[4]);
                default:
                    return null;
            }
        };
        QueryValue.prototype.toString = function () {
            if (this.value === null || typeof this.value == "undefined")
                return "null";
            else if (this.dateTimeType == QueryValue.IsNotDateTime)
                return this.value + "";
            var val = this.value;
            switch (this.dateTimeType) {
                case QueryValue.IsDateTime:
                    if (val.charAt(val.length - 1).toUpperCase() != "Z")
                        return val + "Z";
                    else
                        return val;
                case QueryValue.IsDate:
                    return val.split("T")[0];
                case QueryValue.IsTime:
                    val = this.normalizeTime(val, false, true);
                    return val;
                case QueryValue.IsDuration:
                    val = this.normalizeTime(val, true, false);
                    var parts = val.match(/\d+/g);
                    return "'P" + parts[0] + "DT" +
                        parts[1] + "H" +
                        parts[2] + "M" +
                        parts[3] + "." +
                        parts[4] + new Array(13 - parts[4].length).join("0") + "S'";
                default:
                    return null;
            }
        };
        QueryValue.prototype.toQuery = function () {
            return null;
        };
        return QueryValue;
    }(QueryFilterClause));
    QueryValue.IsNotDateTime = 0;
    QueryValue.IsDate = 1;
    QueryValue.IsTime = 2;
    QueryValue.IsDateTime = 3;
    QueryValue.IsDuration = 4;
    exports.QueryValue = QueryValue;
    var QueryFilterCondition = (function (_super) {
        __extends(QueryFilterCondition, _super);
        function QueryFilterCondition(origin) {
            if (origin === void 0) { origin = null; }
            var _this = _super.call(this, origin) || this;
            if (origin) {
                _this.operator = origin.operator || null;
                _this.inv = origin.inv || false;
                _this.property = origin.property || null;
            }
            else {
                _this.operator = null;
                _this.inv = false;
                _this.property = null;
            }
            return _this;
        }
        QueryFilterCondition.fromModelAndName = function (dateTimeType, property, o, op, inv) {
            if (op === void 0) { op = 'eq'; }
            if (inv === void 0) { inv = false; }
            if (!o)
                return null;
            var value = QueryNode.getProperty(o, property);
            var res = new QueryFilterCondition();
            res.inv = inv;
            res.property = property;
            res.operator = op;
            switch (dateTimeType) {
                case QueryValue.IsDate:
                    res.setDate(value);
                    break;
                case QueryValue.IsTime:
                    res.setTime(value);
                    break;
                case QueryValue.IsDateTime:
                    res.setDateTimeLocal(value);
                default:
                    res.setNotDateTime(value);
                    break;
            }
            return res;
        };
        QueryFilterCondition.prototype.toQuery = function () {
            var val = this.getValue();
            if (!this.property) {
                var res = function (o) {
                    if (typeof o !== "object")
                        return false;
                    for (var key in o) {
                        var cval = o[key];
                        if (typeof cval === "string") {
                            if (cval.indexOf(val) >= 0)
                                return true;
                        }
                    }
                    return false;
                };
                return res;
            }
            if (!this.operator)
                return null;
            var op = QueryFilterCondition.dict[this.operator];
            if (!op)
                return null;
            var self = this;
            var property = this.property;
            switch (this.operator) {
                case QueryFilterCondition.startswith:
                case QueryFilterCondition.endswith:
                case QueryFilterCondition.contains:
                    if (this.inv)
                        return function (o) { return op(val, self.getProperty(o, property)); };
                    else
                        return function (o) { return op(self.getProperty(o, property), val); };
                default:
                    return function (o) { return op(self.getProperty(o, property), val); };
            }
        };
        QueryFilterCondition.prototype.toString = function () {
            var val = _super.prototype.toString.call(this);
            if (val === null)
                return null;
            if (!this.property)
                return val;
            if (this.dateTimeType == QueryValue.IsNotDateTime &&
                typeof this.value == "string" &&
                !this.isGuid())
                val = "'" + val + "'";
            switch (this.operator) {
                case QueryFilterCondition.startswith:
                case QueryFilterCondition.endswith:
                case QueryFilterCondition.contains:
                    if (this.inv)
                        return this.operator + "(" + val + "," + this.encodeProperty(this.property) + ")";
                    else
                        return this.operator + "(" + this.encodeProperty(this.property) + "," + val + ")";
                default:
                    return "(" + this.encodeProperty(this.property) + " " + this.operator + " " + val + ")";
            }
        };
        return QueryFilterCondition;
    }(QueryValue));
    QueryFilterCondition.eq = "eq";
    QueryFilterCondition.ne = "ne";
    QueryFilterCondition.gt = "gt";
    QueryFilterCondition.lt = "lt";
    QueryFilterCondition.ge = "ge";
    QueryFilterCondition.le = "le";
    QueryFilterCondition.startswith = "startswith";
    QueryFilterCondition.endswith = "endswith";
    QueryFilterCondition.contains = "contains";
    QueryFilterCondition.dict = {
        "eq": function (x, y) { return x == y; },
        "ne": function (x, y) { return x != y; },
        "gt": function (x, y) { return x > y; },
        "lt": function (x, y) { return x < y; },
        "ge": function (x, y) { return x >= y; },
        "le": function (x, y) { return x <= y; },
        "startswith": function (x, y) { return ((x || '') + '').indexOf((y || '') + '') == 0; },
        "endswith": function (x, y) {
            var xs = (x || '') + '';
            var ys = (y || '') + '';
            return xs.indexOf(ys, xs.length - ys.length) >= 0;
        },
        "contains": function (x, y) { return ((x || '') + '').indexOf((y || '') + '') >= 0; }
    };
    exports.QueryFilterCondition = QueryFilterCondition;
    var QuerySearch = (function (_super) {
        __extends(QuerySearch, _super);
        function QuerySearch(origin) {
            var _this = _super.call(this) || this;
            if (!origin)
                throw firstArgumentNull;
            if (typeof origin.dateTimeType != "undefined")
                _this.value = new QueryFilterBooleanOperator(QueryFilterBooleanOperator.AND, new QueryFilterCondition(origin));
            else if (typeof origin.operator != "undefined")
                _this.value = new QueryFilterBooleanOperator(origin);
            else
                _this.value = origin.value ?
                    new QueryFilterBooleanOperator(origin.value)
                    : null;
            return _this;
        }
        QuerySearch.prototype.toString = function () {
            if (!this.value)
                return null;
            else
                return this.value.toString();
        };
        QuerySearch.prototype.toQuery = function () {
            if (!this.value)
                return null;
            else
                return this.value.toQuery();
        };
        return QuerySearch;
    }(QueryNode));
    exports.QuerySearch = QuerySearch;
    var QuerySortingCondition = (function (_super) {
        __extends(QuerySortingCondition, _super);
        function QuerySortingCondition(y, down) {
            if (down === void 0) { down = false; }
            var _this = _super.call(this) || this;
            if (typeof y == "string") {
                _this.property = y;
                _this.down = down;
            }
            else {
                if (!y)
                    throw firstArgumentNull;
                _this.property = y.property;
                _this.down = y.down;
            }
            return _this;
        }
        QuerySortingCondition.prototype.toString = function () {
            if (!this.property)
                return null;
            if (this.down)
                return this.encodeProperty(this.property) + " desc";
            else
                return this.encodeProperty(this.property) + " asc";
        };
        QuerySortingCondition.prototype.toCompare = function () {
            if (!this.property)
                return null;
            var prop = this.property;
            var self = this;
            if (this.down)
                return function (x, y) {
                    var val1 = self.getProperty(x, prop);
                    var val2 = self.getProperty(y, prop);
                    if (val1 > val2)
                        return -1;
                    else if (val1 < val2)
                        return 1;
                    else
                        return 0;
                };
            else
                return function (x, y) {
                    var val1 = self.getProperty(x, prop);
                    var val2 = self.getProperty(y, prop);
                    if (val1 < val2)
                        return -1;
                    else if (val1 > val2)
                        return 1;
                    else
                        return 0;
                };
        };
        return QuerySortingCondition;
    }(QueryNode));
    exports.QuerySortingCondition = QuerySortingCondition;
    var QueryAggregation = (function (_super) {
        __extends(QueryAggregation, _super);
        function QueryAggregation(y, property, alias) {
            if (property === void 0) { property = null; }
            if (alias === void 0) { alias = null; }
            var _this = _super.call(this) || this;
            if (typeof y == "string") {
                if (!y || !property || !alias)
                    throw anArgumentNull;
                _this.operator = y;
                _this.isCount = y == QueryAggregation.count;
                _this.property = property;
                _this.alias = alias;
            }
            else {
                if (!y)
                    throw firstArgumentNull;
                _this.isCount = y.operator == QueryAggregation.count;
                _this.operator = y.operator;
                _this.alias = y.alias;
                _this.property = y.property;
            }
            return _this;
        }
        QueryAggregation.prototype.getCount = function () {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: function (x) { x.set = {}; x.counters[0] = 0; },
                result: function (x) { return x.counters[0]; },
                update: updateCountDistinct
            };
        };
        QueryAggregation.prototype.getSum = function () {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: function (x) { x.counters[0] = 0; },
                result: function (x) { return x.counters[0]; },
                update: function (x, agg) { agg.counters[0] = agg.counters[0] + x; }
            };
        };
        QueryAggregation.prototype.getAverage = function () {
            return {
                counters: [0, 0],
                alias: this.alias,
                property: this.property,
                initialize: function (x) { x.counters[0] = 0; x.counters[1] = 0; },
                result: function (x) { return x.counters[0] / x.counters[1]; },
                update: function (x, agg) {
                    agg.counters[0] = agg.counters[0] + x;
                    agg.counters[1] = agg.counters[1] + 1;
                }
            };
        };
        QueryAggregation.prototype.getMin = function () {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: function (x) { x.counters[0] = undefined; },
                result: function (x) { return x.counters[0]; },
                update: function (x, agg) {
                    if (typeof agg.counters[0] === "undefined" ||
                        x < agg.counters[0])
                        agg.counters[0] = x;
                }
            };
        };
        QueryAggregation.prototype.getMax = function () {
            return {
                counters: [0],
                alias: this.alias,
                property: this.property,
                initialize: function (x) { x.counters[0] = undefined; },
                result: function (x) { return x.counters[0]; },
                update: function (x, agg) {
                    if (typeof agg.counters[0] === "undefined" ||
                        x > agg.counters[0])
                        agg.counters[0] = x;
                }
            };
        };
        QueryAggregation.prototype.toString = function () {
            if (!this.property || !this.operator || !this.alias)
                return null;
            return this.encodeProperty(this.property) +
                " with " + this.operator +
                " as " + this.alias;
        };
        QueryAggregation.prototype.toQuery = function () {
            switch (this.operator) {
                case QueryAggregation.count: return this.getCount();
                case QueryAggregation.min: return this.getMin();
                case QueryAggregation.max: return this.getMax();
                case QueryAggregation.sum: return this.getSum();
                case QueryAggregation.average: return this.getAverage();
            }
        };
        return QueryAggregation;
    }(QueryNode));
    QueryAggregation.count = "countdistinct";
    QueryAggregation.sum = "sum";
    QueryAggregation.average = "average";
    QueryAggregation.min = "min";
    QueryAggregation.max = "max";
    exports.QueryAggregation = QueryAggregation;
    var QueryGrouping = (function (_super) {
        __extends(QueryGrouping, _super);
        function QueryGrouping(origin) {
            if (origin === void 0) { origin = null; }
            var _this = _super.call(this) || this;
            if (!origin) {
                _this.keys = new Array();
                _this.dateTimeTypes = new Array();
                _this.aggregations = new Array();
            }
            else {
                if (origin.keys)
                    _this.keys = origin.keys.map(function (x) { return x; });
                else
                    _this.keys = new Array();
                if (origin.dateTimeTypes)
                    _this.dateTimeTypes = origin.dateTimeTypes.map(function (x) { return x; });
                else
                    _this.dateTimeTypes = new Array();
                if (origin.aggregations)
                    _this.aggregations = origin.aggregations
                        .map(function (x) { return new QueryAggregation(x); });
                else
                    _this.aggregations = new Array();
            }
            return _this;
        }
        QueryGrouping.prototype.encodeGroups = function () {
            var _this = this;
            if (!this.keys == null || !this.keys.length)
                return null;
            if (this.keys.length == 1)
                return this.encodeProperty(this.keys[0]);
            return this.keys.filter(function (x) { return x; }).map(function (x) { return _this.encodeProperty(x); }).join(',');
        };
        QueryGrouping.prototype.encodeAggrgates = function () {
            if (!this.aggregations || !this.aggregations.length)
                return null;
            if (this.aggregations.length == 1)
                return this.aggregations[0].toString();
            return this.aggregations.map(function (x) { return x.toString(); }).filter(function (x) { return x; }).join(',');
        };
        QueryGrouping.prototype.toString = function () {
            var groups = this.encodeGroups();
            if (!groups)
                return null;
            var aggs = this.encodeAggrgates();
            if (!aggs)
                return "groupby((" + groups + "))";
            else
                return "groupby((" + groups + "),aggregate(" + aggs + "))";
        };
        QueryGrouping.prototype.toQuery = function () {
            if (!this.keys || !this.keys.length)
                return null;
            var keys = this.keys.map(function (x) { return x; });
            var aggs = !this.aggregations || !this.aggregations.length ? [] :
                this.aggregations.map(function (x) { return x.toQuery(); });
            return function (input) {
                if (!input || !input.length)
                    return [];
                var aggregator = new aggregationDictionary();
                input.forEach(function (x) {
                    aggregator.add(keys, x);
                });
                return aggregator.aggregate(keys.length, keys, aggs);
            };
        };
        return QueryGrouping;
    }(QueryNode));
    exports.QueryGrouping = QueryGrouping;
    var Endpoint = (function () {
        function Endpoint(y, verb, accpetsJson, returnsJson, bearerToken, ajaxId) {
            if (verb === void 0) { verb = null; }
            if (accpetsJson === void 0) { accpetsJson = false; }
            if (returnsJson === void 0) { returnsJson = false; }
            if (bearerToken === void 0) { bearerToken = null; }
            if (ajaxId === void 0) { ajaxId = null; }
            if (typeof y == "string") {
                this.baseUrl = y;
                this.bearerToken = bearerToken;
                this.accpetsJson = accpetsJson;
                this.returnsJson = returnsJson;
                this.verb = verb;
                this.ajaxId = ajaxId;
            }
            else {
                if (!y)
                    throw firstArgumentNull;
                this.baseUrl = y.baseUrl;
                this.bearerToken = y.bearerToken;
                this.accpetsJson = y.accpetsJson;
                this.returnsJson = y.returnsJson;
                this.verb = y.verb;
            }
        }
        ;
        return Endpoint;
    }());
    Endpoint.Get = "GET";
    Endpoint.Post = "POST";
    Endpoint.Put = "PUT";
    Endpoint.Delete = "DELETE";
    Endpoint.Patch = "PATCH";
    exports.Endpoint = Endpoint;
    var QueryDescription = (function () {
        function QueryDescription(origin) {
            this.urlEncode = encodeURIComponent;
            if (origin) {
                this.skip = origin.skip;
                this.take = origin.take;
                this.page = origin.page;
                this.search = origin.search ? new QuerySearch(origin.search) : null;
                this.filter = origin.filter ? new QueryFilterBooleanOperator(origin.filter) : null;
                this.grouping = origin.grouping ? new QueryGrouping(origin.grouping) : null;
                this.sorting = origin.sorting ?
                    origin.sorting.map(function (x) { return new QuerySortingCondition(x); }) : null;
                this.attachedTo = origin.attachedTo ? new Endpoint(origin.attachedTo) : null;
            }
            else {
                this.skip = null;
                this.take = 0;
                this.page = 0;
                this.search = null;
                this.filter = null;
                this.grouping = null;
                this.sorting = new Array();
                this.attachedTo = null;
            }
        }
        QueryDescription.prototype.customUrlEncode = function (func) {
            this.urlEncode = func || this.urlEncode;
        };
        QueryDescription.fromJson = function (x) {
            if (!x)
                return null;
            return new QueryDescription(JSON.parse(x));
        };
        QueryDescription.prototype.addFilterCondition = function (filter, useOr) {
            if (useOr === void 0) { useOr = false; }
            if (!filter)
                return;
            if (!this.filter) {
                this.filter = typeof filter.dateTimeType == "undefined" ?
                    filter
                    :
                        new QueryFilterBooleanOperator(QueryFilterBooleanOperator.and, filter, null);
                return;
            }
            var cleanFilter;
            if (this.filter.operator != QueryFilterBooleanOperator.not) {
                if (!this.filter.child1 && !this.filter.argument1)
                    cleanFilter = this.filter.argument2 || this.filter.child2;
                else if (!this.filter.child2 && !this.filter.argument2)
                    cleanFilter = this.filter.argument1 || this.filter.child1;
                else
                    cleanFilter = this.filter;
            }
            else
                cleanFilter = this.filter;
            this.filter = new QueryFilterBooleanOperator(useOr ? QueryFilterBooleanOperator.or :
                QueryFilterBooleanOperator.and, cleanFilter, filter);
        };
        QueryDescription.prototype.getGroupDetailQuery = function (o) {
            if (!o || !this.grouping || !this.grouping.keys || !this.grouping.keys.length)
                return null;
            var newQuery = new QueryDescription(this);
            newQuery.grouping = null;
            newQuery.take = null;
            newQuery.page = 1;
            newQuery.skip = 0;
            for (var i = 0; i < this.grouping.keys.length; i++) {
                var cond = QueryFilterCondition.fromModelAndName(this.grouping.dateTimeTypes[i], this.grouping.keys[i], o);
                if (!cond)
                    continue;
                newQuery.addFilterCondition(cond);
            }
            return newQuery;
        };
        QueryDescription.prototype.queryString = function () {
            var sb = new Array();
            var search = this.search ? this.search.toString() : null;
            ;
            var filter = null;
            if (search) {
                sb.push(QueryDescription.searchName);
                sb.push("=");
                sb.push(this.urlEncode(search));
            }
            else {
                filter = this.filter ? this.filter.toString() : null;
                if (filter) {
                    sb.push(QueryDescription.filterName);
                    sb.push("=");
                    sb.push(this.urlEncode(filter));
                }
            }
            var apply = this.grouping ? this.grouping.toString() : null;
            if (apply) {
                if (sb.length)
                    sb.push("&");
                sb.push(QueryDescription.applyName);
                sb.push("=");
                sb.push(this.urlEncode(apply));
            }
            var sorting = this.sorting ?
                this.sorting.map(function (x) { return x.toString(); }).filter(function (x) { return x; }).join(',') : null;
            if (sorting) {
                if (sb.length)
                    sb.push("&");
                sb.push(QueryDescription.sortingName);
                sb.push("=");
                sb.push(this.urlEncode(sorting));
            }
            if (this.skip > 0) {
                if (sb.length)
                    sb.push("&");
                sb.push(QueryDescription.skipName);
                sb.push("=");
                sb.push(this.skip + "");
            }
            if (this.take && this.take > 0) {
                if (sb.length)
                    sb.push("&");
                sb.push(QueryDescription.topName);
                sb.push("=");
                sb.push(this.take + "");
            }
            return sb.length ? sb.join("") : null;
        };
        QueryDescription.prototype.addToUrl = function (url) {
            if (!url)
                url = '';
            var query = this.queryString();
            if (!query || !query.trim())
                return url;
            if (url.indexOf('?') >= 0)
                return url + "&" + query;
            else
                return url + "?" + query;
        };
        QueryDescription.prototype.toString = function () {
            return this.addToUrl(this.attachedTo ? this.attachedTo.baseUrl : null);
        };
        QueryDescription.prototype.toQuery = function () {
            var toCompose = [];
            var search = this.search ? this.search.toQuery() : null;
            if (search) {
                toCompose.push(function (x) { return x.filter(search); });
            }
            else {
                var filter_1 = this.filter ? this.filter.toQuery() : null;
                if (filter_1) {
                    toCompose.push(function (x) { return x.filter(filter_1); });
                }
            }
            var grouping = this.grouping ? this.grouping.toQuery() : null;
            if (grouping) {
                toCompose.push(grouping);
            }
            var sorting = this.sorting ? lexicalOrder(this.sorting.map(function (x) { return x.toCompare(); })) : null;
            if (sorting)
                toCompose.push(function (x) {
                    var y = x.map(function (el) { return el; });
                    y.sort(sorting);
                    return y;
                });
            if (this.skip > 0 || (this.take && this.take > 0)) {
                var skip_1 = this.skip > 0 ? this.skip : 0;
                var take_1 = (this.take && this.take > 0) ? this.take + skip_1 : undefined;
                toCompose.push(function (x) { return x.length && skip_1 < x.length ?
                    x.slice(skip_1, take_1 ? Math.min(take_1, x.length) : undefined) :
                    []; });
            }
            if (toCompose.length)
                return composition(toCompose);
            else
                return function (x) { return x; };
        };
        return QueryDescription;
    }());
    QueryDescription.filterName = "$filter";
    QueryDescription.applyName = "$apply";
    QueryDescription.sortingName = "$orderby";
    QueryDescription.searchName = "$search";
    QueryDescription.topName = "$top";
    QueryDescription.skipName = "$skip";
    exports.QueryDescription = QueryDescription;
});
//# sourceMappingURL=mvcct.odata.js.map