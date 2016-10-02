﻿(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls.server" : "../mvcct.controls.server.min", "../../mvcct-enhancer/mvcct.enhancer.min", "../../awesomplete/awesomplete.min"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls.server" : "../mvcct.controls.server.min"), require("mvcct-enhancer"), require("awesomplete"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls']['server'], mvcct['enhancer'], window['Awesomplete']);
            }
        }(

            (function (serverControls, enhancer, Awesomplete) {

                //Start actual code
                var options;
                function processOptions(o) {
                    o = o["serverWidgets"] || {};
                    options = o['autocompleteBootstrap'] || {};
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
                    var defaultEmpty = args[5] == "true";
                    var tOptions = typeof options === 'function' ? options(target) : options;
                    var lastData;
                    //var removeDiacritics=
                    //    tOptions['removeDiacritics'] ? serverControls['removeDiacritics'] :
                    //    function (x) { return x;}
                    var safeRemoveDiacritics = serverControls['removeDiacritics'];
                    var awesomplete=new Awesomplete(el, {
                        minChars: parseInt(args[4]),
                        maxItems: parseInt(args[3]),
                        filter: function (x, y) {
                            return true;
                        },
                        data: function (item, input) {
                            return { label: item[args[1]], value: item[args[1]] };
                        }
                    });
                    el.parentNode.style.display = "block";
                    var elStyle = style = window.getComputedStyle(el);
                    if (elStyle.maxWidth) el.parentNode.style.maxWidth = elStyle.maxWidth;
                    if (elStyle.minWidth) el.parentNode.style.minWidth = elStyle.minWidth;
                    
                    var mainHandler = function (evt) {
                        if (evt.type == "keydown") {
                            if (evt.keyCode != 9) {
                                return;

                            }
                            else {
                                
                                if (lastData && lastData.length > 0) {
                                    if (el.value != lastData[0][args[1]]) {
                                        el.value = lastData[0][args[1]];
                                        evt.preventDefault();
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
                            function () { el.value = ''; } :
                            function () { el.value = el.getAttribute("data-last-value"); };
                        update();
                        oldVal = hidden.value;
                        newVal = emptysearch ? '' : hidden.getAttribute("data-last-value");
                        hidden.value = newVal;
                        if (hidden.value !== oldVal) onChanged(hidden);
                        else {
                            var jhidden = $(hidden);
                            var validator = jhidden.closest('form').validate();
                            if (validator) validator.element(jhidden);
                        }
                    }
                    el.addEventListener('blur', mainHandler, false);
                    el.addEventListener('keydown', mainHandler, false);
                    el.addEventListener('awesomplete-selectcomplete', mainHandler, false);
                    el.addEventListener('keyup', function (evt) {
                        if (el.value.length < awesomplete.minChars) return;
                        var ajax = new XMLHttpRequest();
                        ajax.open("GET", el.getAttribute('data-url').replace(el.getAttribute('data-url-token'), el.value), true);
                        ajax.onload = function () {
                            awesomplete.list = lastData=JSON.parse(ajax.responseText);
                        };
                        ajax.send();
                    }, false);
                    
                    
                    
                    el.focus();
                }
                enhancer["register"](null, null, processOptions, "server autocomplete", null)
                serverControls['addOperation']('autocomplete', attach);
                
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();