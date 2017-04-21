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
                    el[expando] = windowArgs;
                    openStaticModal(el);
                }
                enhancer["register"](null, null, processOptions, "ajax", null);
                serverControls['addOperation']('query-filtering_click', function (infos) { serverQueryOpen(infos, 'filter'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-filtering_click', function (infos) { serverQueryOpen(infos, 'filter'); }, 'server-batch-grid');

                serverControls['addOperation']('query-sorting_click', function (infos) { serverQueryOpen(infos, 'sorting'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-sorting_click', function (infos) { serverQueryQuery(infos, 'sorting'); }, 'server-batch-grid');

                serverControls['addOperation']('query-grouping_click', function (infos) { serverQueryOpen(infos, 'grouping'); }, 'server-immediate-grid');
                serverControls['addOperation']('query-grouping_click', function (infos) { serverQueryOpen(infos, 'grouping'); }, 'server-batch-grid');
                
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();