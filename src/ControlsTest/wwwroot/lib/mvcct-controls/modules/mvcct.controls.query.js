(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls" : "../mvcct.controls.min", DEBUG ? "./mvcct.controls.ajax" : "./mvcct.controls.ajax.min", "../../mvcct-enhancer/mvcct.enhancer.min", "../../mvcct-odata/dest/umd/mvcct.odata.min"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require(DEBUG ? "./mvcct.controls.ajax" : "./mvcct.controls.ajax.min"), require("mvcct-enhancer"), require("mvcct-odata/dest/umd/mvcct.odata.min"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['controls'], mvcct['enhancer'], mvcct['odata']);
            }
        }(

            (function (serverControls, ajaxServerControls, enhancer, odata) {
                 var openStaticModal, closeStaticModal;
                 var expando = 'query_expando';
                 var operatorSuffix = '.Operator';
                 var expandoCompanion = '_companion_display_';
                function processOptions(o) {
                    options = o["ajax"] = o["ajax"] || {};
                    var serverWidgetsOptions  = o["serverWidgets"] || {};
                    var optionsModal = serverWidgetsOptions["modal"] || {};
                    openStaticModal= optionsModal["openStaticModal"];
                    closeStaticModal = optionsModal["closeStaticModal"];
                }
                function findForm(x) {
                    for (; x; x = x.parentNode) {
                        if (!x.getAttribute) return null;
                        else if (x.tagName == 'FORM') return x;
                    }
                    return null;
                }
                function serverQueryOpen(infos, postfix)
                {
                    var args = infos['args'];
                    var windowArgs = {};
                    windowArgs['form']=findForm(infos['control']);
                    if(args.len>1) windowArgs['url'] = args[1];
                    if(args.len>2) windowArgs['ajaxId'] = args[2];
                    var el = document.getElementById(args[0]+"_"+postfix+"_window");
                    var form = document.getElementById(args[0]+"_"+postfix);
                    form[expando] = windowArgs;
                    openStaticModal(el);
                }
                function getQueryModel (queryInput){
                    var model = queryInput[expando];
                    if(model) return model;
                    var jsonModel = queryInput.value;
                    if(jsonModel) model = new odata['QueryDescription'](JSON.parse(jsonModel));
                    else model = new odata['QueryDescription']();
                    queryInput[expando]=model;
                    return model;
                }
                function goToQueryUrl (query, url, id){
                    var endPoint=query['attachedTo'] || {};
                    url = url || endPoint['baseUrl'];
                    id = id || endPoint['ajaxId'];

                    url = query['addToUrl'](url);
                    if(!id) window.location.href = url;
                    else{
                        id = id.split(' ');
                        serverControls['attachHtml']({
                            'href': url,
                            'args': id
                        });
                    }
                }
                function applyAnd(allConditions, i)
                {
                    if(!allConditions || !allConditions.length || allConditions.length==i) return null;
                    return new odata['QueryFilterBooleanOperator'](odata['QueryFilterBooleanOperator']['and'],
                        allConditions[i],
                        applyAnd(allConditions, i+1)
                        );
                }
                function prepareFilter(form)
                {
                    //collects information
                    fieldsIndex={};
                    [].filter.call(form.elements, function (el) {
                        return (el.type != "radio" && el.type != 'button' 
                        && el.type != 'reset' && el.type != 'submit' && el.tagName != 'BUTTON') || el.checked;
                    })
                    .filter(function (el) { return !!el.name; }) //Nameless elements die.
                    .filter(function (el) { return !el.disabled; })
                    .forEach(function(el){
                        var isOperator=false;
                        var name = el.name;
                        var value=el.value.trim();
                        if(!value) return;
                        if(name.indexOf(operatorSuffix, name.length-operatorSuffix.length)>=0){
                            isOperator=true;
                            name = name.substr(0, name.length-operatorSuffix.length);
                        }
                        var condition = fieldsIndex[name];
                        if(!condition){
                            condition={};
                            fieldsIndex[name]=condition;
                        }
                        if(isOperator){
                            if(value == 'inv-contains')
                            {
                                condition['operator']='contains';
                                condition['inv'] = true;
                            }
                            else
                            {
                                condition['operator']=value;
                                condition['inv'] = false
                            }
                        }
                        else
                        {
                            condition["property"] = name.substr(name.indexOf('.') + 1);
                            var trueType = el.getAttribute('type'); 
                            var type = el.getAttribute('data-original-type')||
                               trueType;
                            if (type == 'datetime-local') type='datetime'; 
                            condition["jsType"] = type;
                            if(type == 'checkbox') condition["jsValue"] = el.checked;
                            else{
                                condition["jsValue"] = enhancer["parse"](type, value, trueType == "hidden" || trueType == "radio" || el.tagName == "SELECT");
                                condition["jsUtc"] = el.getAttribute('data-is-utc')=='true';
                            }
                            var companion = el[expandoCompanion];
                            if (companion) condition['takeFrom'] = companion.name;
                            else {
                                att = el.getAttribute('data-operation');
                                if (att && att.indexOf('autocomplete') == 0)
                                {
                                    for (companion = el.nextSibling; companion && companion.nodeType != 1; companion = companion.nextSibling);
                                    if (companion) condition['takeFrom'] = companion.name;
                                }
                                
                            }
                        }
                    });
                    var staticOperations = form.querySelectorAll('[data-name]');
                    if(staticOperations){
                        for(var i=0; i<staticOperations.length; i++){
                            var el = staticOperations[i];
                            var name = el.getAttribute('data-name');
                            name = name.substr(0, name.length - operatorSuffix.length)
                            var value = el.getAttribute('data-value');
                            if(!value || !name) continue;
                            var condition = fieldsIndex[name];
                            if(!condition) continue;
                            if(value == 'inv-contains')
                            {
                                condition['operator']='contains';
                                condition['inv'] = true;
                            }
                            else
                            {
                                condition['operator']=value;
                                condition['inv'] = false
                            }
                        }
                    }
                    //process all conditions now
                    var allConditions = [];
                    for (var property in fieldsIndex) {
                        if (fieldsIndex.hasOwnProperty(property)) {
                            var condition = fieldsIndex[property];
                            var takeFrom = condition['takeFrom'];
                            if (takeFrom) {
                                var companionCondition = fieldsIndex[takeFrom];
                                condition['operator'] = companionCondition['operator'];
                                condition['inv'] = companionCondition['inv'];
                                if (!companionCondition['property'] && condition['operator'] == 'eq')
                                    condition['operator'] = 'startswith';
                            }
                            var type = condition['jsType'];
                            var value = condition['jsValue'];
                            if((!value && value !== 0) || 
                                !condition['property'] ||
                                !condition['operator']) continue;
                            var cCondition = new odata['QueryFilterCondition'](condition);
                            allConditions.push(cCondition);
                            switch (condition["jsType"]) {
                                case 'date':
                                case 'month':
                                case 'week':
                                    cCondition['setDate'](value);
                                break;
                                case 'number':
                                case 'range':
                                    cCondition['setNumber'](value);
                                break;
                                case 'time':
                                    cCondition['setTime'](value);
                                break;
                                case 'checkbox':
                                    cCondition['setBoolean'](value);
                                break;
                                case 'datetime':
                                    if (condition["jsUtc"])
                                        cCondition['setDateTimeInvariant'](value);
                                    else
                                        cCondition['setDateTimeLocal'](value);
                                break;
                                default:
                                     cCondition['setString'](value);
                            }
                        }
                    }
                    return applyAnd(allConditions, 0);
                }
                function prepareSorting(form)
                {
                    fieldsIndex={};
                    [].filter.call(form.elements, function (el) {
                        return (el.type != "radio" && el.type != "checkbox" && el.type != 'button' 
                        && el.type != 'reset' && el.type != 'submit' && el.tagName != 'BUTTON') || el.checked;
                    })
                    .filter(function (el) { return !!el.name; }) 
                    .filter(function (el) { return !el.disabled; })
                    .forEach(function(el){
                        if(!el.value.trim()) return;
                        var index=null;
                        var isType=false;
                        if(el.name.indexOf('sorting_') == 0)
                            index=el.name.substr(8);
                        else{
                            isType=true;
                            index = el.name.substr(13);
                        }
                        var clause = fieldsIndex[index];
                        if(!clause) fieldsIndex[index] = clause = {};
                        if(isType) clause['down'] = el.value == 'desc';
                        else clause['property'] = el.value;
                    });
                    var res = [];
                    for (var index in fieldsIndex) {
                        if (fieldsIndex.hasOwnProperty(index)) {
                            var clause = fieldsIndex[index];
                            if(clause['property']) res.push(new odata['QuerySortingCondition'](clause));
                        }
                    }
                    if (res.length) return res;
                    else return null;
                }
                function prepareGrouping(form)
                {
                     var res = new  odata['QueryGrouping']();
                     [].filter.call(form.elements, function (el) {
                        return (el.type != "radio" && el.type != "checkbox" && el.type != 'button' 
                        && el.type != 'reset' && el.type != 'submit' && el.tagName != 'BUTTON') || el.checked;
                    })
                    .filter(function (el) { return !!el.name; }) 
                    .filter(function (el) { return !el.disabled; })
                    .forEach(function(el){
                        if(!el.value.trim()) return;
                        else if (el.value == 'groupby') {
                            res['keys'].push(el.name);
                            var displayName = el.getAttribute('data-display-name');
                            if (displayName) res['keys'].push(displayName);
                        }
                        else
                            res['aggregations'].push(
                                new odata['QueryAggregation'](el.value, el.name,
                                   el.value == 'countdistinct' ? el.getAttribute('data-count-distinct') : el.name)
                            );
                    });
                     if (res['keys'].length > 0) return res;
                    else return null;
                }
                function serverQuery(infos, type)
                {
                    var form = infos['control'];
                    var arg = infos['args'][0];
                    if(!serverControls['validateForm'](form)) return;
                    var extraData = form[expando] || {};
                    var oForm = extraData ? extraData['form'] : null;
                    var queryInput = undefined;
                    if(oForm) queryInput= oForm.elements.namedItem(arg);
                    else queryInput = document.getElementsByName(arg)[0];
                    var query = getQueryModel (queryInput);
                    if(type == 'filter')
                        query['filter'] = prepareFilter(form);
                    else if(type == 'sorting')
                        query['sorting'] = prepareSorting(form);
                    else
                        query['grouping'] = prepareGrouping(form);
                    query['take'] = 0;
                    query['skip'] = null;
                    goToQueryUrl (query, extraData['url'], extraData['ajaxId']);
                }
                function groupDetail(infos)
                {
                    var args = infos['args'];
                    if(!args.length) return;
                    if(args.length == 1) window.location.href = args[0];
                    else{
                        serverControls['attachHtml']({
                            'href': args[0],
                            'args': agrs.length == 2 ? [args[1]] : [args[1], args[2]]
                        });
                    }
                }
                enhancer["register"](null, null, processOptions, "ajax", null);
                serverControls['addOperation']('query-filtering_click', function (infos) { serverQueryOpen(infos, 'filter'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-filtering_click', function (infos) { serverQueryOpen(infos, 'filter'); }, 'server-batch-grid');

                serverControls['addOperation']('query-sorting_click', function (infos) { serverQueryOpen(infos, 'sorting'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-sorting_click', function (infos) { serverQueryOpen(infos, 'sorting'); }, 'server-batch-grid');

                serverControls['addOperation']('query-grouping_click', function (infos) { serverQueryOpen(infos, 'grouping'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-grouping_click', function (infos) { serverQueryOpen(infos, 'grouping'); }, 'server-batch-grid');

                serverControls['addOperation']('group-detail_click', function (infos) { groupDetail(infos); }, 'server-immediate-grid');
                serverControls['addOperation']('group-detail_click', function (infos) { groupDetail(infos); }, 'server-batch-grid');

                serverControls['addOperation']('filter-window-submit_click', function (infos) { serverQuery(infos, 'filter'); }, 'server-query-filter');
                serverControls['addOperation']('sort-window-submit_click', function (infos) { serverQuery(infos, 'sorting'); }, 'server-query-sorting');
                serverControls['addOperation']('grouping-window-submit_click', function (infos) { serverQuery(infos, 'grouping'); }, 'server-query-grouping');
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();