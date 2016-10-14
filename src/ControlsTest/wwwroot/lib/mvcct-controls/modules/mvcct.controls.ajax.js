(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls" : "../mvcct.controls.min", "../../mvcct-enhancer/mvcct.enhancer.min"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require("mvcct-enhancer"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['enhancer']);
            }
        }(

            (function (serverControls, enhancer) {

                //Start actual code
                var options;
                var empty;
                var validateForm
                function processOptions(o) {
                    options = o["ajax"] || {};
                    empty = options['empty'] || function (x) { x.innerHTML = ''; };
                    validateForm = options['validateForm'] || function (x) { return true;};
                };
                
                function attachHtml(infos) {
                    var href = infos["href"];
                    var el = infos['target'];
                    var args = infos['args'];
                    var arg = args[0];
                    var proc = args.length > 1 ? endpoints(args[1]) : {};
                    var ajax = new XMLHttpRequest();

                    ajax.open("GET", href||el.getAttribute('href'), true);
                    ajax.onload = function () {
                        if (ajax.responseText && ajax.responseText.charAt(0) == '#')
                        {
                            proc.completed ? completed(el): null;
                            proc.onerror ? proc.onerror(ajax.responseText.substring(1)) : null;
                            return;
                        }
                        el = document.getElementById(arg);
                        empty(el);
                        el.innerHTML = ajax.responseText;
                        enhancer["transform"](el);
                        proc.completed ? completed(el) : null;
                    };
                    ajax.onerror = function (e) { proc.completed ? completed(el) : null; proc.onerror ? proc.onerror(e) : null; }
                    proc.onstart ? proc.onstart(el) : null;
                    ajax.send();
                }
                var endpoints = {};
                var addEndpoint=function(name, success, router, error, start, completed, progress, bearerToken)
                {
                    endpoints[name] = {
                        router: router,
                        bearerToken: bearerToken,
                        onSuccess: success,
                        onerror: error,
                        onprogress: progress,
                        onstart: start,
                        oncompleted: completed
                    };
                }
                serverControls['addHtmlEndpoint'] = function (name, start, completed, error, progress) {
                    addEndpoint(name, null, null, error, start, completed, progress);
                }
                serverControls['addRouterEndpoint']=function(name, router)
                {
                    addEndpoint(name, null, router, null, null, null, null);
                }
                serverControls['addJsonEndpoint'] = function (name, bearerToken, success, error, start, completed, progress) {
                    addEndpoint(name, success, null, error, start, completed, progress, bearerToken);
                }
                serverControls['removeEndpoint'] = function(name){
                    delete endpoints[name];
                };
                serverControls['postJson'] = function (url, data, bearerToken, onSuccess, onError, onCompleted, onProgress) {
                    var ajax = new XMLHttpRequest();
                    ajax.open("POST", url, true);
                    ajax.setRequestHeader("Content-type", "application/json");
                    if (bearerToken) ajax.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
                    ajax.onload = function () {
                        onSuccess(JSON.parse(ajax.responseText));
                        onCompleted ? onCompleted(el) : null;
                    };
                    ajax.onerror = function (e) { onCompleted ? onCompleted(el) : null; onError ? onError(e) : null; }
                    ajax.onprogress = onProgress;
                    
                    ajax.send(JSON.stringify(data));
                };
                serverControls['postForm'] = function (form, onSuccess, onError, onCompleted, onProgress) {
                    if (!validateForm(form)) return;
                    var ajax = new XMLHttpRequest();

                    var params = [].filter.call(form.elements, function (el) {
                        //Allow only elements that don't have the 'checked' property
                        //Or those who have it, and it's checked for them.
                        return typeof (el.checked) === 'undefined' || el.checked;
                        //Practically, filter out checkboxes/radios which aren't checekd.
                    })
                    .filter(function (el) { return !!el.name; }) //Nameless elements die.
                    .filter(function (el) { return !el.disabled; }) //Disabled elements die.
                    .map(function (el) {
                        //Map each field into a name=value string, make sure to properly escape!
                        return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
                    }).join('&'); //Then join all the strings by &

                    ajax.open("POST", url, true);
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    ajax.onload = function () {
                        
                        if (ajax.responseText && ajax.responseText.charAt(0) == '#') {
                            onCompleted ? onCompleted(el) : null;
                            onError ? onError(ajax.responseText.substring(1)) : null;
                            return;
                        }
                        onSuccess(ajax.responseText);
                        onCompleted ? onCompleted(el) : null;
                    };
                    ajax.onerror = function (e) { onCompleted ? onCompleted(el) : null; onError ? onError(e) : null; }
                    ajax.onprogress = onProgress;

                    ajax.send(params);
                };
                function attachJson(infos) {
                    var href = infos["href"];
                    var el = infos['target'];
                    var arg = infos['args'][0];
                    var proc = endpoints[arg];
                    if (proc.router) proc.router(el.getAttribute('href'));
                    else {
                        var ajax = new XMLHttpRequest();

                        ajax.open("GET", el.getAttribute('href'), true);
                        if (proc.bearerToken) ajax.setRequestHeader('Authorization', 'Bearer ' + proc.bearerToken);
                        ajax.onload = function () {
                            proc.onSuccess(JSON.parse(ajax.responseText));
                            proc.completed ? proc.completed(el) : null;
                        };
                        ajax.onerror = function (e) { proc.completed ? completed(el) : null; proc.onerror ? proc.onerror(e) : null; }
                        ajax.onprogress = proc.onprogress;
                        proc.onstart ? proc.onstart(el) : null;
                        ajax.send();
                    }
                }
                
                enhancer["register"](null, null, processOptions, "ajax", null);
                serverControls['addOperation']('ajax-html_click', attachHtml);
                serverControls['addOperation']('ajax-json_click', attachJson);

                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();