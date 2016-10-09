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
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls.server" : "../mvcct.controls.server.min"), require("mvcct-enhancer"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls']['server'], mvcct['enhancer']);
            }
        }(

            (function (serverControls, enhancer) {

                //Start actual code
                var options;
                var empty;
                function processOptions(o) {
                    options = o["ajax"] || {};
                    empty = options['empty'] || function (x) { x.innerHTML = ''; };
                    
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
                var addEndpoint=function(name, success, router, error, start, completed, progress)
                {
                    endpoints[name] = {
                        router: router,
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
                serverControls['addJsonEndpoint'] = function (name, success, error, start, completed, progress) {
                    addEndpoint(name, success, null, error, start, completed, progress);
                }
                serverControls['removeEndpoint'] = function(name){
                    delete endpoints[name];
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
                
                enhancer["register"](null, null, processOptions, "ajax", null)
                serverControls['addOperation']('ajax-html_click', attachHtml);
                serverControls['addOperation']('ajax-json_click', attachJson);

                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();