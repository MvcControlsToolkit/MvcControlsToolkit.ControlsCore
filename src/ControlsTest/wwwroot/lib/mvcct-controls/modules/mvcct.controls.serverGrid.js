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
                var expandoAlternateRow = "_expando_row_";
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
                    serverControls['postForm'](form, null, onSuccess, errorMessageF, showErrors, onCompleted, onProgress, onStart);
                }
                function detachRow(row) {
                    var tRoot = row.parentNode;
                    empty(row);
                    row.parentNode.removeChild(row);
                    var altRow = row[expandoAlternateRow];
                    var me = tRoot[expandoAlternateRow];
                    if (row == me) tRoot[expandoAlternateRow] = null;
                    if (altRow) {
                        row[expandoAlternateRow] = null;
                        empty(altRow);
                    }
                }
                function replaceRow(newRow, row) {
                    var tRoot = row.parentNode;
                    empty(row);
                    row.parentNode.replaceChild(newRow, row);
                    enhancer["transform"](newRow);
                    var me = tRoot[expandoAlternateRow];
                    if (row == me) tRoot[expandoAlternateRow] = null;
                    var altRow = row[expandoAlternateRow];
                    if (altRow) {
                        row[expandoAlternateRow] = null;
                        empty(altRow);
                    }
                }
                function undoEdit(row)
                {
                    if (!row) return;
                    var tRoot = row.parentNode;
                    var readRow = row[expandoAlternateRow];
                    row[expandoAlternateRow] = null;
                    readRow[expandoAlternateRow] = row;
                    var me = tRoot[expandoAlternateRow];
                    if (row == me) tRoot[expandoAlternateRow] = null;
                    serverControls['clearErrors'](row);
                    row.parentNode.replaceChild(readRow, row);
                    
                }
                function goEdit(row, editRow) {
                    if (!row || !editRow) return;
                    var tRoot = row.parentNode;
                    undoEdit(tRoot[expandoAlternateRow]);
                    row[expandoAlternateRow] = null;
                    editRow[expandoAlternateRow] = row;
                    tRoot[expandoAlternateRow]=editRow;
                    row.parentNode.replaceChild(editRow, row);
                }
                function serverGridDelete(infos, immediate) {
                    var row = infos['row'];
                    if (!row) return;
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
                function serverEdit(infos, undo) {
                    var row = infos['row'];
                    if (!row) return;
                    var args = infos["args"];
                    var undoAdd = undo && args != null && args.length > 0 && args[0] == "add";
                    var tRoot = row.parentNode;
                    var failure = tRoot.getAttribute("data-modification-failed");
                    
                    if (undoAdd) {
                        var nowEdit = tRoot[expandoAlternateRow];
                        if (nowEdit == row) tRoot[expandoAlternateRow] = null;
                        detachRow(row);
                        return;
                    }
                    else if (undo) {
                        undoEdit(row);
                        return;
                    }
                    var editRow = row[expandoAlternateRow];
                    if (editRow) {
                        goEdit(row, editRow);
                        return;
                    }
                    onStart(row);
                    serverControls['getContent'](
                        row,
                        tRoot.getAttribute("data-edit-url-" + row.getAttribute("data-row"))
                            .replace(placeholder + "1", row.getAttribute("data-row-id"))
                            .replace(placeholder, row.getAttribute("data-key")),
                                
                        null,
                        function (x) {
                            
                            var newRow = serverControls['parseHTML'](x);
                            if (newRow) {
                                goEdit(row, newRow);
                                enhancer["transform"](newRow);
                            }
                        },
                        function () { return failure; },
                        showErrors,
                        onCompleted,
                        onProgress);
                }
                function serverSubmit(infos) {
                    var row = infos['row'];
                    if (!row) return;
                    var tRoot = row.parentNode;
                    var failure = tRoot.getAttribute("data-modification-failed");
                    
                    serverControls['postForm'](
                        row,
                        tRoot.getAttribute("data-add-url-" + row.getAttribute("data-row"))
                            .replace(placeholder, row.getAttribute("data-row-id")),
                        row.getAttribute("data-key") ? "isAdd=False" : "isAdd=True",
                        function (html) {
                            var newRow = serverControls['parseHTML'](html);
                            if (newRow) replaceRow(newRow, row);
                        },
                        function () { return failure; },
                        showErrors, onCompleted, onProgress, onStart);
                }
                enhancer["register"](null, null, processOptions, "serverGrid", null);
                serverControls['addOperation']('save_click', serverDetailSave, 'server-detail', true);
                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, false); }, 'server-batch-grid');
                serverControls['addOperation']('edit_click', function (infos) { serverEdit(infos, false); }, 'server-immediate-grid');
                serverControls['addOperation']('undo_click', function (infos) { serverEdit(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('save_click', function (infos) { serverSubmit(infos); }, 'server-immediate-grid');
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();