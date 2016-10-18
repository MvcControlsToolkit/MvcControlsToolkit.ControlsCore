(function () {
    var DEBUG = true;
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define([DEBUG ? "../mvcct.controls" : "../mvcct.controls.min", DEBUG ? "./mvcct.controls.ajax" : "./mvcct.controls.ajax.min", "../../mvcct-enhancer/mvcct.enhancer.min"], factory);
            } else if (typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require(DEBUG ? "./mvcct.controls.ajax" : "./mvcct.controls.ajax.min"), require("mvcct-enhancer"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['controls'], mvcct['enhancer']);
            }
        }(

            (function (serverControls, ajaxServerControls, enhancer) {
                var placeholder = "_zzFzz_";
                //Start actual code
                var options;
                var empty;
                var showErrors;
                var onStart;
                var onCompleted;
                var onProgress;
                function processOptions(o) {
                    var oAjax = o["ajax"] || {};
                    empty = oAjax['empty'] || function (x) { x.innerHTML = ''; };
                    o = o["serverWidgets"] || {};
                    options = o['grid'] || {};
                    showErrors = options["onError"] || function (x) { alert(x); }
                    onStart = options["onStart"] || function (x) { };
                    onCompleted = options["onCompleted"] || function (x) { };
                    onProgress = options["onProgress"] || function (x) { };
                };

                function serverDetailSave(infos) {
                    var form = infos['control'];
                    if (!form) return;
                    var onSuccess = form['expando_onSubmit'];
                    var errorMessageF = form['expando_onSubmitError'];
                    if (!onSuccess) return;
                    onStart();
                    serverControls['postForm'](form, onSuccess, errorMessageF, showErrors, onCompleted, onProgress);
                }
                function detachRow(row) {
                    empty(row);
                    row.parentNode.removeChild(row);
                }
                function serverGridDelete(infos, immediate) {
                    var root = infos['control'];
                    var row = infos['row']
                    if (!root || !row) return;
                    var tRoot = row.parentNode;
                    var confirmation = tRoot.getAttribute("data-delete-confirmation");
                    var failure = tRoot.getAttribute("data-delete-failed");
                    if (confirmation && !confirm(confirmation)) return;
                    if (!immediate) detachRow(row);
                    else {
                        onStart(row);
                        serverControls['getContent'](
                            row,
                            tRoot.getAttribute("data-delete-url-" + row.getAttribute("data-row"))
                                    .replace(placeholder, row.getAttribute("data-key")),
                            null,
                            function(x){
                                var res = JSON.parse(x);
                                if (res && res.length > 0) {
                                    showErrors(res[0].errors[0]);
                                }
                                else detachRow(row);
                            },
                            function () { return failure;},
                            showErrors,
                            onCompleted,
                            onProgress);
                    }
                }

                enhancer["register"](null, null, processOptions, "serverGrid", null);
                serverControls['addOperation']('save_click', serverDetailSave, 'server-detail', true);
                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, false); }, 'server-batch-grid');
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();