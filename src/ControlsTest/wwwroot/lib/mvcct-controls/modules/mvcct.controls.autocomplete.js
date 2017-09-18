(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this'); 
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls" : "../mvcct.controls.min", "../../mvcct-enhancer/mvcct.enhancer.min", "../../awesomplete/awesomplete.min"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require("mvcct-enhancer"), require("awesomplete"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['enhancer'], window['Awesomplete']);
            }
        }(

            (function (serverControls, enhancer, Awesomplete) {
                var expando = "_companion_display_";
                //Start actual code
                var options;
                function processOptions(o) {
                    o = o["serverWidgets"] || {};
                    options = o['autocomplete'] || {};
                };
                var $ = window["jQuery"];
                function onChanged(hidden) {
                    var e = document.createEvent('HTMLEvents');
                    e.initEvent('blur', true, true);
                    hidden.dispatchEvent(e);
                    e = document.createEvent('HTMLEvents');
                    e.initEvent('change', true, true);
                    hidden.dispatchEvent(e);
                    if ($ && $['validator']) {
                        var jhidden = $(hidden);
                        var validator = jhidden['closest']('form')['validate']();
                        if (validator) validator['element'](jhidden);
                    }
                }
                var dict = {};
                function attach(infos) {
                    var el = infos['target'];
                    var args = infos['args'];
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
                    var tolerate = args[5] == "tolerate";
                    if(tolerate) el[expando] = hidden;
                    var defaultEmpty = tolerate || (args[5] == "true");
                    var tOptions = typeof options === 'function' ? options(target) : options;
                    var lastData;
                    var removeDiacritics=
                        tOptions['removeDiacritics'] ? serverControls['removeDiacritics'] :
                        function (x) { return x;}
                    var safeRemoveDiacritics = serverControls['removeDiacritics'];
                    var engine = dict[args[2]];
                    var minChars = parseInt(args[4]);
                    var maxItems = parseInt(args[3]);
                    if (!engine) {
                        dict[args[2]] = engine = new serverControls['searchDictionary'](args[0], minChars, maxItems, tOptions["maxCacheSize"])
                    }
                    var awesomplete = new Awesomplete(el, {
                        'minChars': minChars,
                        'maxItems': maxItems,
                        'filter': function (x, y) {
                            x = removeDiacritics(x).toLowerCase();
                            y = removeDiacritics(y).toLowerCase();
                            return x.indexOf(y) >=0;
                        },
                        'data': function (item, input) {
                            return { label: item[args[1]], value: item[args[1]] };
                        }
                    });
                    el.parentNode.style.display = "block";
                    var elStyle = style = window.getComputedStyle(el);
                    if (elStyle.maxWidth) el.parentNode.style.maxWidth = elStyle.maxWidth;
                    if (elStyle.minWidth) el.parentNode.style.minWidth = elStyle.minWidth;
                    
                    var mainHandler = function (evt) {
                        if (evt.type == "keydown") {
                            if ((evt.keyCode || evt.which) != 9) {
                                return;

                            }
                            else {
                                
                                if (lastData && lastData.length > 0) {
                                    var x = removeDiacritics(el.value).toLowerCase();
                                    var y;
                                    for(var j = 0; j<lastData.length; j++){
                                        y = removeDiacritics(lastData[j][args[1]]).toLowerCase();
                                        if(y.indexOf(x) >=0){
                                            if (x != y) {
                                                el.value = lastData[j][args[1]];
                                                evt.preventDefault();
                                            } 
                                            break;  
                                        }
                                    }
                                    
                                     
                                }
                                
                            }
                        }
                        
                        
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
                        var update = (emptysearch = defaultEmpty || !el.value) ?
                            function () { if(!tolerate) el.value = ''; } :
                            function () { el.value = el.getAttribute("data-last-value"); };
                        update();
                        oldVal = hidden.value;
                        newVal = emptysearch ? '' : hidden.getAttribute("data-last-value");
                        hidden.value = newVal;
                        if (hidden.value !== oldVal) onChanged(hidden);
                        else {
                            if ($ && $['validator']) {
                                var jhidden = $(hidden);
                                var validator = jhidden['closest']('form')['validate']();
                                if (validator) validator['element'](jhidden);
                            }
                        }
                    }
                    el.addEventListener('blur', mainHandler, false);
                    el.addEventListener('keydown', mainHandler, false);
                    el.addEventListener('awesomplete-selectcomplete', mainHandler, false);
                    
                    el.addEventListener('keyup', function (evt) {
                        if (el.value.length < awesomplete.minChars) return;
                        var code = evt.keyCode || evt.which;
                        if (code == 9 || code == 37 || code == 38 || code == 39 || code == 40 || code === 27 || code === 13) {
                            return;
                        }
                        var lastCall = removeDiacritics(el.value).toLowerCase();
                        var res = engine['get'](lastCall);
                        if (res) {
                            awesomplete.list = lastData = res;
                            return;
                        }
                        var ajax = new XMLHttpRequest();
                        
                        ajax.open("GET", el.getAttribute('data-url').replace(el.getAttribute('data-url-token'), el.value), true);
                        ajax.onload = function () {
                            awesomplete['list'] = lastData = JSON.parse(ajax.responseText);
                            engine['add'](lastCall, lastData);
                            };
                        ajax.send();
                    }, false);
                    
                    
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