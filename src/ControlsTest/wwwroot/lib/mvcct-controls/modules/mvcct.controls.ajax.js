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
                jQuery = window["jQuery"];
                //Start actual code
                var options;
                var empty;
                var validateForm;
                var dispatchServerErrors;
                var clearErrors;
                var validationSummarySelector, validationSummaryValidClass, validationSummaryInvalidClass;
                var fieldErrorClass, errorLabelValidClass, errorLabelInvalidClass, errorLabelLocator;
                var openModal, closeModal, openStaticModal, closeStaticModal;
                function processOptions(o) {
                    options = o["ajax"] = o["ajax"] || {};
                    empty = options['empty'] =  options['empty'] || function (x) {
                        if (!x) return;
                        if (jQuery){
                            var jx=jQuery(x);
                            if(jQuery['validator']){
                                var form=findForm(x);
                                if(form){
                                    var validator = jQuery['data'](form, "validator" );
                                    if(validator){
                                        var settings = validator['settings'];
                                        if(settings){
                                            var staticRules = settings['rules'];
                                            jx['find']("[data-val=true]")['each'](function(){
                                                delete staticRules[ this.name ];
                                            });
                                        }
                                    }     
                                }
                             }
                             jx["empty"]();
                             
                        }
                        else x.innerHTML = '';
                    };
                    validateForm = options['validateForm'] = options['validateForm'] || function (x)
                    {
                        if (jQuery && jQuery['validator']) {
                            return jQuery(x)["closest"]('form')["validate"]()["form"]();
                        }
                        return true;
                    };
                    clearErrors = options['clearErrors'] || defaultClearErrors;
                    dispatchServerErrors = options['dispatchServerErrors'] || defaultDispatchServerErrors;
                    clearErrors = options["clearErrors"] || defaultClearErrors;
                    validationSummarySelector = options["validationSummarySelector"] || '[data-valmsg-summary="true"], [data-valmsg-ajax="true"]';
                    validationSummaryValidClass = options["validationSummaryValidClass"] || "validation-summary-valid";
                    validationSummaryInvalidClass = options["validationSummaryInvalidClass"] || "validation-summary-errors";

                    fieldErrorClass = options["fieldErrorClass"] || "input-validation-error";
                    errorLabelValidClass = options["errorLabelValidClass"] || "field-validation-valid";
                    errorLabelInvalidClass = options["errorLabelInvalidClass"] || "field-validation-error";

                    errorLabelLocator = options["errorLabelLocator"] || function (x, form) {
                        form = form || findForm(x);
                        if (!form) return null;
                        return form.querySelector('[data-val-msg-for="' + x.name + '"]');
                    }
                    serverControls['dispatchServerErrors'] = dispatchServerErrors;
                    serverControls['clearErrors'] = clearErrors;
                    serverControls['validateForm'] = validateForm;
                    var serverWidgetsOptions = o["serverWidgets"] = o["serverWidgets"] || {};
                    var optionsModal = serverWidgetsOptions["modal"] =serverWidgetsOptions["modal"] || {};
                    openModal = optionsModal["openModal"] = optionsModal["openModal"] || function (x, id, version) {
                        var container = document.getElementById(id);
                        var toCreate = true;
                        if (!container) {
                            container = document.createElement('DIV');
                            container.setAttribute('id', id);
                            container.setAttribute('data-version', version);
                            container.appendChild(x);
                            document.body.appendChild(container);
                            enhancer["transform"](container);
                        }
                        else  {
                            container.firstChild['expando_onSubmit']=null;
                            container.firstChild['expando_onSubmitError']=null;
                            empty(container);
                            container.setAttribute('data-version', version);
                            container.appendChild(x);
                            enhancer["transform"](container);
                        }
                        if (toCreate) {
                            jQuery(x)['modal']({
                                show: false,
                                backdrop: 'static'
                            });
                            if (x.getAttribute('data-destroy-on-close')) {
                                jQuery(x).on('hidden.bs.modal', function (e) {
                                    x['expando_onSubmit']=null;
                                    x['expando_onSubmitError']=null;
                                    empty(x.parentNode);
                                    x.parentNode.parentNode.removeChild(x.parentNode);
                                })
                            }
                        }
                        jQuery(x)['modal']('show');
                    };
                    closeModal = optionsModal["closeModal"] = optionsModal["closeModal"] || function (x) {
                        jQuery(x)['modal']('hide'); 
                        x['expando_onSubmit']=null;
                        x['expando_onSubmitError']=null;
                    };
                    openStaticModal= optionsModal["openStaticModal"] = optionsModal["openStaticModal"] || function(x){
                        var jx = jQuery(x);
                        if(!x['expando_created']) {
                            jx['show']();
                            jx['addClass'](jx['attr']('data-class'));
                            jx['modal']({
                                show: false,
                                backdrop: 'static'
                            });
                            jx['on']('hidden.bs.modal', function (e) {
                                    x['expando_onSubmit']=null;
                                    x['expando_onSubmitError']=null;
                            });
                        }
                        jx['modal']('show');
                    };
                    closeStaticModal = optionsModal["closeStaticModal"] = optionsModal["closeStaticModal"] || function (x) {
                        jQuery(x)['modal']('hide'); 
                        x['expando_onSubmit']=null;
                        x['expando_onSubmitError']=null;
                    };

                };
                function appendToList(ul, txtArray) {
                    if (!ul || !txtArray) return;
                    for(var i=0; i<txtArray.length; i++){
                        var node = document.createElement("LI");                 
                        var textnode = document.createTextNode(txtArray[i]);         
                        node.appendChild(textnode); 
                        ul.appendChild(node);
                    }
                }
                function defaultDispatchServerErrors(errors, x) {
                    if (!errors || !errors.length) return;
                    var form = findForm(x);
                    if (!form) return;
                    var summary = form.querySelector(validationSummarySelector);
                    var toAppend;
                    if(summary){
                        empty(summary);
                        summary.classList.remove(validationSummaryValidClass);
                        summary.classList.add(validationSummaryInvalidClass);
                        toAppend=document.createElement("UL");
                        summary.appendChild(toAppend);
                    }
                    errors.map(function (er) {
                        if (!er["prefix"]) appendToList(toAppend, er["errors"]);
                        else {
                            var el = form.querySelector('[name="' + er["prefix"]+'"]');
                            if (!el) { appendToList(toAppend, er["errors"]); return; }
                            el.classList.add(fieldErrorClass);
                            var label = errorLabelLocator(el, form);
                            if (label) {
                                label.classList.add(errorLabelInvalidClass);
                                label.classList.remove(errorLabelValidClass);
                                label.appendChild(document.createTextNode(er["errors"][0]));
                            }
                            else appendToList(toAppend, er["errors"]);
                        }
                    });
                }
                function defaultClearErrors(x) {
                    var form = findForm(x);
                    if (!form) return;
                    var summary = form.querySelector(validationSummarySelector);
                    if (!summary) return;
                    empty(summary);
                    summary.classList.remove(validationSummaryInvalidClass);
                    summary.classList.add(validationSummaryValidClass);
                    var res = form.querySelectorAll("." + fieldErrorClass);
                    for (var i = 0; i < res.length; i++) {
                        var y = res[i];
                        y.classList.remove(fieldErrorClass);
                        var label = errorLabelLocator(y, form);
                        if (label) {
                            label.classList.remove(errorLabelInvalidClass);
                            label.classList.add(errorLabelValidClass);
                            empty(label);

                        }
                    }
                }
                function findForm(x) {
                    for (; x; x = x.parentNode) {
                        if (!x.getAttribute) return null;
                        else if (x.tagName == 'FORM') return x;
                    }
                    return null;
                }
                
                function attachHtml(infos) {
                    var href = infos["href"];
                    var el = infos['target'];
                    var args = infos['args'];
                    var arg = args[0];
                    var proc = infos["proc"] || args.length > 1 ? endpoints(args[1]) : {};
                    var ajax = new XMLHttpRequest();

                    ajax.open("GET", href||el.getAttribute('href'), true);
                    ajax.onload = function () {
                        if (ajax.responseText && ajax.responseText.charAt(0) == '#')
                        {
                            proc.completed ? proc.completed(el) : null;
                            proc.onerror ? proc.onerror(ajax.responseText.substring(1)) : null;
                            return;
                        }
                        else if (ajax.status != 200) {
                            proc.completed ? proc.completed(el) : null;
                            proc.onerror ? proc.onerror(el.getAttribute('data-error-message') || "") : null;
                            return;
                        }
                        el = document.getElementById(arg);
                        empty(el);
                        el.innerHTML = ajax.responseText;
                        enhancer["transform"](el);
                        proc.completed ? proc.completed(el) : null;
                    };
                    ajax.onerror = function (e) { proc.completed ? proc.completed(el) : null; proc.onerror ? proc.onerror(el.getAttribute('data-error-message') || "") : null; }
                    proc.onstart ? proc.onstart(el) : null;
                    ajax.send();
                }
                serverControls['attachHtml'] = attachHtml;
                var endpoints = {};
                var addEndpoint = function (name, success, router, errorMessageF, error, start, completed, progress, bearerToken)
                {
                    endpoints[name] = {
                        router: router,
                        bearerToken: bearerToken,
                        onSuccess: success,
                        onerror: error,
                        onprogress: progress,
                        onstart: start,
                        oncompleted: completed,
                        errorMessageF: errorMessageF
                    };
                }
                serverControls['addHtmlEndpoint'] = function (name, start, completed, errorMessageF, error, progress) {
                    addEndpoint(name, null, null, errorMessageF, error, start, completed, progress);
                }
                serverControls['addRouterEndpoint']=function(name, router)
                {
                    addEndpoint(name, null, router, null, null, null, null, null);
                }
                serverControls['addJsonEndpoint'] = function (name, bearerToken, success, errorMessageF, error, start, completed, progress) {
                    addEndpoint(name, success, null, errorMessageF, error, start, completed, progress, bearerToken);
                }
                serverControls['removeEndpoint'] = function(name){
                    delete endpoints[name];
                };
                function addHeaders(headers, ajax){
                    if(headers && typeof headers === 'object')
                        for (var property in headers) {
                            if (headers.hasOwnProperty(property)) 
                                ajax.setRequestHeader(property, headers[property]);
                        }
                }
                serverControls['postJson'] = function (el, url, data, bearerToken, onSuccess, errorMessageF, onError, onCompleted, onProgress, headers) {
                    var ajax = new XMLHttpRequest();
                    ajax.open("POST", url, true);
                    ajax.setRequestHeader("Content-type", "application/json");
                    if (bearerToken) ajax.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
                    addHeaders(headers, ajax);
                    ajax.onload = function () {
                        if (ajax.status != 200) {
                            onCompleted ? onCompleted(el) : null;
                            onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null;
                            return;
                        }
                        else {
                            onSuccess(JSON.parse(ajax.responseText));
                            onCompleted ? onCompleted(el) : null;
                        }
                    };
                    ajax.onerror = function (e) { onCompleted ? onCompleted(el) : null; onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null; }
                    ajax.onprogress = onProgress;
                    
                    ajax.send(JSON.stringify(data));
                };
                serverControls['getContent'] = function (el, url, bearerToken, onSuccess, errorMessageF, onError, onCompleted, onProgress, headers, verb, params) {
                    var ajax = new XMLHttpRequest();
                    ajax.open(verb||"GET", url, true);
                    if (bearerToken) ajax.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
                    if(params) ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    addHeaders(headers, ajax);
                    ajax.onload = function () {
                        if (ajax.responseText && ajax.responseText.charAt(0) == '#') {
                            onCompleted ? onCompleted(el) : null;
                            onError ? onError(ajax.responseText.substring(1)) : null;
                            return;
                        }
                        if (ajax.status != 200) {
                            onCompleted ? onCompleted(el) : null;
                            onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null;
                            return;
                        }
                        else {
                            onSuccess(ajax.responseText);
                            onCompleted ? onCompleted(el) : null;
                        }
                    };
                    ajax.onerror = function (e) { onCompleted ? onCompleted(el) : null; onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null; }
                    ajax.onprogress = onProgress;

                    if(params) ajax.send(params)
                    else ajax.send();
                };
                serverControls['postForm'] = function (inForm, url, extraData, onSuccess, errorMessageF, onError, onCompleted, onProgress, onStart, headers) {
                    var form = findForm(inForm);
                    if (!validateForm(form)) return;
                    if (onStart) onStart(inForm);
                    serverControls['clearErrors'](inForm);
                    var ajax = new XMLHttpRequest();
                    url = url || form.getAttribute("action");
                    var params = [].filter.call(form.elements, function (el) {
                        return (el.type != "radio" && el.type != "checkbox") || el.checked;
                    })
                    .filter(function (el) { return !!el.name; }) //Nameless elements die.
                    .filter(function (el) { return !el.disabled; }) //Disabled elements die.
                    .map(function (el) {
                        //Map each field into a name=value string, make sure to properly escape!
                        return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
                    }).join('&'); //Then join all the strings by &
                    if (extraData) {
                        if (params) params = params + '&' + extraData;
                        else params = extraData;
                    }
                    ajax.open("POST", url, true);
                    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    addHeaders(headers, ajax);
                    ajax.onload = function () {
                        if (ajax.responseText && ajax.responseText.trim().charAt(0)=="[")
                        {
                            var errors = JSON.parse(ajax.responseText);
                            if (errors.length > 0) {
                                dispatchServerErrors(errors, form);
                            }
                            onCompleted ? onCompleted(inForm) : null;
                            return;
                        }
                        if (ajax.responseText && ajax.responseText.charAt(0) == '#') {
                            onCompleted ? onCompleted(inForm) : null;
                            onError ? onError(ajax.responseText.substring(1)) : null;
                            return;
                        }
                        else if (ajax.status != 200) {
                            onCompleted ? onCompleted(inForm) : null;
                            onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null;
                            return;
                        }
                        onSuccess(ajax.responseText);
                        onCompleted ? onCompleted(inForm) : null;
                    };
                    ajax.onerror = function (e) { onCompleted ? onCompleted(inForm) : null; onError ? onError(errorMessageF ? errorMessageF(ajax.status) : "") : null; }
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
                            if (ajax.status != 200) {
                                proc.completed ? proc.completed(el) : null;
                                proc.onerror ? proc.onerror(proc.errorMessageF ? proc.errorMessageF(ajax.status) : "") : null;
                                return;
                            }
                            else {
                                proc.onSuccess(JSON.parse(ajax.responseText));
                                proc.completed ? proc.completed(el) : null;
                            }
                        };
                        ajax.onerror = function (e) { proc.completed ? proc.completed(el) : null; proc.onerror ? proc.onerror(proc.errorMessageF ? proc.errorMessageF(ajax.status) : "") : null; }
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