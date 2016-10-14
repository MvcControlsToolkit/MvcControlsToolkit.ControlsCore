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
                module["exports"] = factory(require(DEBUG ? "../mvcct.controls" : "../mvcct.controls.min"), require(DEBUG ? "./mvcct.controls.ajax" : "./mvcct.controls.ajax.min"), require("mvcct-enhancer"), require("awesomplete"));  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                var mvcct = window["mvcct"] = window["mvcct"] || {};
                factory(mvcct['controls'], mvcct['enhancer']);
            }
        }(

            (function (serverControls, ajaxServerControls, enhancer) {

                //Start actual code
                var options;
                
                function processOptions(o) {
                    o = o["serverWidgets"] || {};
                    options = o['grid'] || {};
                };

                
                
                function serverDetailSave(infos) {
                    var showErrors = options["onError"] || function (x) { alert(x); }
                    var onStart = options["onStart"] || function (x) { };
                    var onCompleted = options["onCompleted"] || function (x) { };
                    var onProgress = options["onProgress"] || function (x) { };
                    var form = infos['control'];
                    if (!form) return;
                    var onSuccess = form['expando_onSubmit'];
                    if (!onSuccess) return;

                    serverControls['postForm'](form, onSuccess, showErrors, onCompleted, onProgress);

                }

                enhancer["register"](null, null, processOptions, "serverGrid", null);
                serverControls['addOperation']('save_click', serverDetailSave, 'server-detail', true);

                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();