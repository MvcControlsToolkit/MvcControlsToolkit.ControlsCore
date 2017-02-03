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
                var forgeryName="__RequestVerificationToken";
                //Start actual code
                var frozenAttribute = "data-frozen";
                var options;
                var empty;
                var showErrors;
                var onStart;
                var onStartNet;
                var onCompleted;
                var onCompletedNet;
                var onProgress;
                var openModal, closeModal;
                function processOptions(o) {
                    var oAjax = o["ajax"] = o["ajax"] || {};
                    empty = oAjax['empty'] || function (x) { x.innerHTML = ''; };
                    var o = o["serverWidgets"] = o["serverWidgets"] || {};
                    var optionsModal = o["modal"] = o["modal"] || {};
                    options = o['grid'] = o['grid'] || {};
                    showErrors = options["onError"] || function (x) { alert(x); }
                    onStartNet = options["onStart"] || function (x) { 
                        x.style.opacity = "0.5";
                    };
                    onCompletedNet = options["onCompleted"] || function (x) { 
                        x.removeAttribute("style");
                    };
                    onProgress = options["onProgress"] || function (x) { };
                    openModal = optionsModal["openModal"] ;
                    closeModal = optionsModal["closeModal"];

                    onStart=function(x){
                        x.setAttribute(frozenAttribute, "true");
                        onStartNet(x);
                    };
                    onCompleted=function(x){
                        x.removeAttribute(frozenAttribute);
                        onCompletedNet(x);
                    };
                };

                function serverDetailSave(infos) {
                    var form = infos['control'];
                    if (!form) return;
                    var root = infos['find']('data-version');
                    if (!root) return;
                    root = root.firstChild;
                    var onSuccess = root['expando_onSubmit'];
                    var errorMessageF = root['expando_onSubmitError'];
                    if (!onSuccess) return;
                    serverControls['postForm'](form, null, null, onSuccess, errorMessageF, showErrors, onCompleted, onProgress, onStart);
                }
                function serverDetailClose(infos) {
                    var form = infos['control'];
                    if (!form) return;
                    var root = infos['find']('data-version');
                    if (!root) return;
                    closeModal(root);
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
                    row.parentNode.replaceChild(newRow, row);
                    empty(row);
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
                    var me = tRoot[expandoAlternateRow];
                    if (row == me) tRoot[expandoAlternateRow] = null;
                    serverControls['clearErrors'](row);
                    if (!readRow) detachRow(row);
                    else {
                        readRow[expandoAlternateRow] = row;
                        row.parentNode.replaceChild(readRow, row);
                    }
                    
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
                function findForm(x) {
                    for (; x; x = x.parentNode) {
                        if (!x.getAttribute) return null;
                        else if (x.tagName == 'FORM') return x;
                    }
                    return null;
                }
                function serverGridDelete(infos, immediate) {
                    var row = infos['row'];
                    if (!row) return;
                    var tRoot = row.parentNode;
                    var form = findForm(row);
                    var params = null;
                    if(form){
                        var forgery=form.querySelector('[name="' + forgeryName + '"]');
                        if(forgery) {
                            params= encodeURIComponent(forgeryName) + '=' + encodeURIComponent(forgery.value);
                        }
                    }
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
                            onProgress, null, 'POST',params);
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
                        tRoot.getAttribute("data-add-url-" + row.getAttribute("data-row")),
                        row.getAttribute("data-key") ? "isAdd=False" : "isAdd=True",
                        function (html) {
                            var newRow = serverControls['parseHTML'](html);
                            if (newRow) replaceRow(newRow, row);
                        },
                        function () { return failure; },
                        showErrors, onCompleted, onProgress, onStart);
                }
                function fillAddInfos(infos) {
                    var args = infos["args"];
                    if (!args.length) return null;
                    var type = args[0];
                    infos['type']=type;
                    if (type == "before" || type == "after")
                    {
                        var row = infos["find"]("data-row");
                        if (!row) return null;
                        infos["row"] = row;
                    }
                    var id = infos["control"] ? 
                        infos["control"].getAttribute('id') :
                        infos['target'].getAttribute('data-target');
                    if (!id) return null;
                    infos["control"] = infos["control"] || document.getElementById(id);
                    id = document.getElementById(id + '_container');
                    if (!id) return null;
                    infos["container"] = id;
                    return infos;
                }

                function serverAdd(infos, immediate) {
                    if (!infos) return;
                    var row = infos['row'];
                    var args = infos['args'];
                    var type = infos['type'];
                    var rowOrder =
                        args.length > 1 ? args[1] :
                        (row ? row.getAttribute("data-row") : "0");
                    tRoot = infos['container'];
                    var url = tRoot.getAttribute("data-add-url-" + rowOrder);
                    if (!immediate)
                        url = url.replace(placeholder, tRoot.getAttribute('data-prefix'));
                    var failure = tRoot.getAttribute("data-add-failed");
                    onStart(infos['control']);
                    serverControls['getContent'](
                        infos['control'],
                        url,
                        null,
                        function (x) {
                            var newRow = serverControls['parseHTML'](x);
                            if (newRow) {
                                if (type == "before") tRoot.insertBefore(newRow, row);
                                else if (type == "append" ||
                                        (type == "prepend" && !tRoot.hasChildNodes()) ||
                                        (type == "after" && row == tRoot.lastChild)
                                    ) tRoot.appendChild(newRow);
                                else if (type == "prepend")
                                    tRoot.insertBefore(newRow, tRoot.firstChild);
                                
                                else if (type == "after")
                                    tRoot.insertBefore(newRow, row.nextSibling);
                                else
                                    tRoot.appendChild(newRow);
                                enhancer["transform"](newRow);
                                if (immediate) {
                                    undoEdit(tRoot[expandoAlternateRow]);
                                    tRoot[expandoAlternateRow] = newRow;
                                }
                            }
                        },
                        function () { return failure; },
                        showErrors,
                        onCompleted,
                        onProgress);
                }
                function serverDetailEdit(infos, immediate){
                    var row = infos['row'];
                    if (!row) return;
                    var args = infos["args"];
                    var tRoot = row.parentNode;
                    var failure = tRoot.getAttribute("data-modification-failed");
                    onStart(infos['control']);
                    var rowIndex = row.getAttribute("data-row");
                    var url=tRoot.getAttribute("data-edit-detail-url-" + rowIndex)
                            .replace(placeholder, row.getAttribute("data-key"));
                    if (!immediate)
                        url = url
                            .replace(placeholder+"1", tRoot.getAttribute('data-prefix'));
                    serverControls['getContent'](
                        infos['control'],
                        url,
                        null,
                        function (x) {
                            var detail = serverControls['parseHTML'](x);
                            if (detail) {
                                openModal(detail, infos["control"].getAttribute('id')+"_detail", rowIndex);
                                detail['expando_onSubmit'] = function (html) {
                                    var newRow = serverControls['parseHTML'](html);
                                    if (newRow) replaceRow(newRow, row);
                                    closeModal(detail);
                                };
                                detail['expando_onSubmitError'] = function () { return failure; };
                            }
                        },
                        function () { return failure; },
                        showErrors,
                        onCompleted,
                        onProgress);
                }
                function serverDetailShow(infos, immediate) {
                    var row = infos['row'];
                    if (!row) return;
                    var args = infos["args"];
                    var tRoot = row.parentNode;
                    var failure = tRoot.getAttribute("data-record-not-found");
                    onStart(infos['control']);
                    var rowIndex = row.getAttribute("data-row");
                    var url = tRoot.getAttribute("data-show-url-" + rowIndex)
                            .replace(placeholder, row.getAttribute("data-key"));
                    serverControls['getContent'](
                        infos['control'],
                        url,
                        null,
                        function (x) {
                            var detail = serverControls['parseHTML'](x);
                            if (detail) {
                                openModal(detail, infos["control"].getAttribute('id') + "_detail", rowIndex); 
                            }
                        },
                        function () { return failure; },
                        showErrors,
                        onCompleted,
                        onProgress);
                }
                function serverDetailAdd(infos, immediate) {
                    if (!infos) return;
                    var row = infos['row'];
                    var args = infos['args'];
                    var type = infos['type'];
                    var rowOrder =
                        args.length > 1 ? args[1] :
                        (row ? row.getAttribute("data-row") : "0");
                    tRoot = infos['container'];
                    var url = tRoot.getAttribute("data-add-detail-url-" + rowOrder);
                    if (!immediate)
                        url = url.replace(placeholder, tRoot.getAttribute('data-prefix'));
                    var failure = tRoot.getAttribute("data-add-failed");
                    onStart(infos['control']);
                    serverControls['getContent'](
                        infos['control'],
                        url,
                        null,
                        function (x) {
                            var detail = serverControls['parseHTML'](x);
                            if (detail) {
                                openModal(detail, infos["control"].getAttribute('id') + "_detail", rowOrder)
                                detail['expando_onSubmit'] = function (html) {
                                    var newRow = serverControls['parseHTML'](html);
                                    if (newRow) {
                                        if (type == "before") tRoot.insertBefore(newRow, row);
                                        else if (type == "append" ||
                                                (type == "prepend" && !tRoot.hasChildNodes()) ||
                                                (type == "after" && row == tRoot.lastChild)
                                            ) tRoot.appendChild(newRow);
                                        else if (type == "prepend")
                                            tRoot.insertBefore(newRow, tRoot.firstChild);

                                        else if (type == "after")
                                            tRoot.insertBefore(newRow, row.nextSibling);
                                        else
                                            tRoot.appendChild(newRow);
                                        enhancer["transform"](newRow);

                                        if (immediate) {
                                            undoEdit(tRoot[expandoAlternateRow]);
                                            tRoot[expandoAlternateRow] = newRow;
                                        }
                                    }
                                    closeModal(detail);
                                };
                                detail['expando_onSubmitError'] = function () { return failure; };
                                
                            }
                        },
                        function () { return failure; },
                        showErrors,
                        onCompleted,
                        onProgress);
                }
                enhancer["register"](null, null, processOptions, "serverGrid", null);
                serverControls['addOperation']('save_click', serverDetailSave, 'server-detail', true);
                serverControls['addOperation']('close_click', serverDetailClose, 'server-detail', true);

                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('delete_click', function (infos) { serverGridDelete(infos, false); }, 'server-batch-grid');

                serverControls['addOperation']('edit_click', function (infos) { serverEdit(infos, false); }, 'server-immediate-grid');
                serverControls['addOperation']('edit-detail_click', function (infos) { serverDetailEdit(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('edit-detail_click', function (infos) { serverDetailEdit(infos, false); }, 'server-batch-grid');

                serverControls['addOperation']('undo_click', function (infos) { serverEdit(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('save_click', function (infos) { serverSubmit(infos); }, 'server-immediate-grid');

                serverControls['addOperation']('add_click', function (infos) { serverAdd(fillAddInfos(infos), true); }, 'server-immediate-grid');
                serverControls['addOperation']('add_click', function (infos) { serverAdd(fillAddInfos(infos), false); }, 'server-batch-grid');

                serverControls['addOperation']('add-detail_click', function (infos) { serverDetailAdd(fillAddInfos(infos), true); }, 'server-immediate-grid', true);
                serverControls['addOperation']('add-detail_click', function (infos) { serverDetailAdd(fillAddInfos(infos), false); }, 'server-batch-grid', true);

                serverControls['addOperation']('show-detail_click', function (infos) { serverDetailShow(infos, true); }, 'server-immediate-grid');
                serverControls['addOperation']('show-detail_click', function (infos) { serverDetailShow(infos, false); }, 'server-batch-grid');
                
                //Finish actual code
                return serverControls;
            })
        ));
    }());
})();