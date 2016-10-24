(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls" : "../mvcct.controls.min", "../../mvcct-enhancer/mvcct.enhancer.min", "jquery", "../../corejs-typeahead/dist/bloodhound", "../../corejs-typeahead/dist/typeahead.jquery"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require("mvcct-enhancer"), require("jquery"), require("corejs-typeahead/dist/bloodhound"), require("corejs-typeahead/dist/typeahead.jquery"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['enhancer'], window['jQuery'], window['Bloodhound']);
            }
        }(

            (function (serverControls, enhancer, $, Bloodhound) {

                //Start actual code
                var options;
                function processOptions(o) {
                    o = o["serverWidgets"] || {};
                    options = o['autocomplete'] || {};
                };
                
                function onChanged(hidden) {
                    var e = document.createEvent('HTMLEvents');
                    e.initEvent('blur', true, true);
                    hidden.dispatchEvent(e);
                    e = document.createEvent('HTMLEvents');
                    e.initEvent('change', true, true);
                    hidden.dispatchEvent(e);
                    var jhidden=$(hidden);
                    var validator = jhidden.closest('form').validate();
                    if (validator) validator.element(jhidden);
                }
                var dict = {};
                function attach(infos) {
                    var el = infos['target'];
                    var args = infos['args'];
                    var init = true;
                    
                    if (el.getAttribute('data-enhanced-autocomplete')) {
                        el.value = "";
                        return;
                    }
                    el.setAttribute('data-enhanced-autocomplete', 'true');
                    var hidden;
                    for (hidden = el.nextSibling; hidden && hidden.nodeType != 1; hidden = hidden.nextSibling);
                    if (!hidden) return;
                    el.setAttribute("data-last-value", el.value);
                    hidden.setAttribute("data-last-value", hidden.value);
                    el.value = "";
                    var defaultEmpty = args[5] == "true";
                    var tOptions = typeof options === 'function' ? options(target) : options;
                    var jel = $(el);
                    var removeDiacritics=
                        tOptions['removeDiacritics'] ? serverControls['removeDiacritics'] :
                        function (x) { return x;}
                    var safeRemoveDiacritics = serverControls['removeDiacritics'];
                    var engine = dict[args[2]];
                    if (!engine) {
                        var boptions = {
                            datumTokenizer: function (d) {
                                return removeDiacritics(d[args[1]]);
                            },
                            queryTokenizer: function (x) {
                                return removeDiacritics(x);
                            },
                            identify: function (x) {
                                return x[args[0]];
                            },
                            remote: {
                                url: el.getAttribute('data-url'),
                                wildcard: el.getAttribute('data-url-token')
                            }
                        };
                        dict[args[2]]=engine = new Bloodhound(boptions);
                    }
                    var ds = [$.extend(tOptions, {
                        async: true,
                        display: args[1],
                        name: args[2],
                        limit: parseInt(args[3]),
                        source: function (x, sr, ar) {
                            var newSr = function (r) {
                                if(r && r.length >0) jel.data("_lastresults_", r);
                                sr(r);
                            };
                            var newAr = function (r) {
                                if (r && r.length > 0) jel.data("_lastresults_", r);
                                ar(r);
                            };
                            var en = engine;
                            en.search(x, newSr, newAr);
                        }
                    })];
                    
                    var mainHandler = function (evt) {
                        if (init) {
                            init = false;
                            return;
                        }
                        var lastData = jel.data("_lastresults_");
                        var oldVal = hidden.value;
                        var newVal;
                        if (lastData) {
                            for (var j = 0; j < lastData.length; j++) {
                                if (safeRemoveDiacritics(lastData[j][args[1]]) == safeRemoveDiacritics(el.value)) {
                                    newVal = lastData[j][args[0]];
                                    hidden.value = newVal;
                                    el.setAttribute("data-last-value", el.value);
                                    hidden.setAttribute("data-last-value", hidden.value);
                                    if (hidden.value !== oldVal) onChanged(hidden);
                                    return;
                                }
                            }
                            
                        }
                        
                        var emptysearch;
                        var update = (emptysearch=defaultEmpty || !el.value) ?
                            function () { el.value = ''; } :
                            function () { el.value = el.getAttribute("data-last-value"); };
                        
                        update();
                        setTimeout(function () { update(); }, 0);
                        
                        
                        oldVal = hidden.value;
                        newVal = emptysearch ? '' : hidden.getAttribute("data-last-value");
                        hidden.value = newVal;
                        if (hidden.value !== oldVal) onChanged(hidden);
                        else {
                            var jhidden = $(hidden);
                            var validator = jhidden.closest('form').validate();
                            if (validator) validator.element(jhidden);
                        }
                    };
                    jel.bind("blur typeahead:autocomplete typeahead:selected", mainHandler);
                    jel.typeahead({ minLength: parseInt(args[4]) }, ds);
                    setTimeout(function () { el.focus(); });
                }
                enhancer["register"](null, null, processOptions, "server autocomplete", null)
                serverControls['addOperation']('autocomplete_focus', attach);
                
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();