(function () {
    
    (function (undefined) {
        var window = this || (0, eval)('this');
        (function (factory) {
            // Support three module loading scenarios
            if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
                // [1] CommonJS/Node.js
                factory(module['exports'] || exports);
            } else if (typeof define === 'function' && define['amd']) {
                // [2] AMD anonymous module
                    define(['exports'], factory);
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                factory(window['mvcct']["routing"] = {});
            }
        }
 (function (routing) {
     if (typeof routing === 'undefined') {
         routing = {};
     }
     
     var
      PATH_NAME_MATCHER = /(\/?):([\w\d]+)(\??)/g,
      PATH_REPLACER = "([^\/]+)",
      OPTIONAL_PATH_REPLACER = "([^\/]*)",
      SLASH_PATH_REPLACER = "\/([^\/]+)",
      SLASH_OPTIONAL_PATH_REPLACER = "(?:\/([^\/]+))?",
      QUERY_STRING_MATCHER = /\?([^#]*)?$/,
      routerInfosKey = '_router_infos_',
      decode = function (str) { return decodeURIComponent((str || '').replace(/\+/g, ' ')); },
      encode = encodeURIComponent,
      unwrapObject = function (obj) {
          res = {};
          for (var prop in obj) {
              if (obj.hasOwnProperty(prop)) {
                  res[prop] = obj[prop];
              }
          }
          return res;
      },
      buildQueryString = function (obj) {
          var res = '';
          for (var prop in obj) {
              if (obj.hasOwnProperty(prop)) {
                  var value = obj[prop];
                  if (!value) continue;
                  else value = encode(value);
                  if (res)
                      res += "&" + prop + "=" + value;
                  else
                      res = "?" + prop + "=" + value;
                  res[prop] = obj[prop];
              }
          }
          return res;
      };
     function extendsObj(target, source) {
         for (var prop in obj) {
             if (typeof target[prop] === 'undefined') target[prop] = source[prop];
         }
     }
     function route(path, hasChildren, defaults, action, matchAll) {
         function parseQueryString(path) {
             var params = {}, parts, pairs, pair, i;

             parts = path.match(QUERY_STRING_MATCHER);
             if (parts && parts[1]) {
                 pairs = parts[1].split('&');
                 for (i = 0; i < pairs.length; i++) {
                     pair = pairs[i].split('=');
                     params = parseParamPair(params, decode(pair[0]), decode(pair[1] || ""));
                 }
             }
             return params;
         };

         function parseParamPair(params, key, value) {
             if (typeof params[key] !== 'undefined') {
                 if (_isArray(params[key])) {
                     params[key].push(value);
                 } else {
                     params[key] = [params[key], value];
                 }
             } else {
                 params[key] = value;
             }
             return params;
         };

         defaults = defaults || {};
         var paramNames = [],
             pattern,
             lastPath = null,
             lastChild = null,
             lastBindings = null,
             obligatoryValues = extendsObj({}, defaults);
         this.children = null;
         if (path) {
             PATH_NAME_MATCHER.lastIndex = 0;
             pattern = path.replace(PATH_NAME_MATCHER, function (toReplace, slash, parameter, optional) {
                 paramNames.push({
                     name: parameter,
                     optional: optional == '?',
                     slash: slash == '/'
                 });
                 if (obligatoryValues.hasOwnProperty(parameter)) delete obligatoryValues[parameter];
                 if (optional == '?') {
                     if (slash == '/') return SLASH_OPTIONAL_PATH_REPLACER;
                     else return OPTIONAL_PATH_REPLACER;
                 }
                 else {
                     if (slash == '/') return SLASH_PATH_REPLACER;
                     else return PATH_REPLACER;
                 }
             });
             pattern = new RegExp(pattern + (hasChildren ? "" : "$"));
         }

         this.routablePath = function (path) {
             return path.replace(QUERY_STRING_MATCHER, '');
         };
         this.match = function (url, params) {
             var paramValues;
             pattern.lastIndex = 0;
             lastBindings = extendsObj({}, defaults);
             if ((paramValues = pattern.exec(this.routablePath(url))) !== null) {
                 params = extendsObj(params || {}, defaults);
                 for (var i = 1; i < paramValues.length; i++) {
                     if (paramNames[i - 1] && paramNames[i - 1].name && paramValues[i]) {
                         lastBindings[paramNames[i - 1].name] = decode(paramValues[i]);
                     }
                 }
                 lastBindings = extendsObj(lastBindings, parseQueryString(url));
                 params = extendsObj(params, lastBindings);
                 return paramValues[0].length;
             }
             else return false;
         };
         this.action = function (params, prefix) {
             for (var i = 0; i < paramNames.length; i++) {
                 var x = paramNames[i];
                 if (x && x.name && !x.optional && !params[x.name]) return false;
             }
             for (var prop in obligatoryValues) {
                 if (obligatoryValues.hasOwnProperty(prop)) {
                     if (obligatoryValues[prop] != params[prop]) return false;
                 }
             }
             var fparams = extendsObj(extendsObj({}, defaults), params);
             for (var i = 0; i < paramNames.length; i++) {
                 var x = paramNames[i];
                 if (x && x.name && params.hasOwnProperty(x.name)) delete params[x.name];
             }
             for (var prop in obligatoryValues)
                 if (params.hasOwnProperty(prop)) delete params[prop];
             var i = 0;
             return (prefix || '') + path.replace(PATH_NAME_MATCHER, function (toReplace, slash, parameter, optional) {
                 var currPar = paramNames[i]; i++;
                 var value = parameter ? (fparams[parameter] || '') : '';
                 if (!parameter || (currPar.optional && value == defaults[currPar.name])) return '';
                 if (value) return (slash || '') + value;
                 else return '';
             });
         };

         this.matchRec = function (url, params, notChanged, level) {
             if (url === undefined) return false;
             url = url || '';
             var res = 0;
             if (matchAll) {
                 params = extendsObj(params, defaults);
                 res = url.length;
             }
             else if (path) res = this.match(url, params, level);
             if (res === false) return false;
             var newPath = '';
             if (res > 0) {
                 newPath = url.substr(0, res);
                 url = url.substr(res);
             }
             notChanged = notChanged && ((!path && !matchAll) || (newPath === lastPath));
             if (action && !notChanged) action(params, level, this.children);
             lastPath = newPath;
             if (this.children) {
                 for (var i = 0; i < this.children.length; i++) {
                     var x = this.children[i];
                     if (x.matchRec(url, params, notChanged && (lastChild == x), level + 1)) {
                         lastChild = x;
                         return true;
                     }
                 }
                 return false;
             }
             else return true;
         };
         var mergeCurrentPath = function (params) {
             for (var prop in lastBindings) {
                 if (lastBindings.hasOwnProperty(prop) && params.hasOwnProperty(prop)) return false;
             }
             extendsObj(params, lastBindings);
             return true;
         };
         this.mergeCurrentPathRec = function (params) {
             if (path) {
                 var res = mergeCurrentPath(params);
                 if (!res || !hasChildren || !lastChild) return;
             }
             else if (!hasChildren || !lastChild) return;
             lastChild.mergeCurrentPathRec(params);
         }
         this.actionRec = function (params, prefix) {
             var newPrefix = prefix;
             if (path) newPrefix = this.action(params, prefix);
             if (newPrefix === false) return false;
             if (this.children) {
                 var res = newPrefix;
                 for (var i = 0; i < this.children.length; i++) {
                     var x = this.children[i];
                     if ((res = x.actionRec(params, newPrefix)) !== false) return res;
                 }
                 return false;
             }
             else return newPrefix;
         };
     }
     function nativeHistory(onChange) {
         var prevHash = '';
         var baseUrl = '';
         this['back'] = function (x) { window.history.back(x); };
         this['forward'] = function (x) { window.history.forward(x); };
         this['go'] = function (x) { window.history.go(x); };
         this['refresh'] = function () {
             onChange(window.location.hash || '#');
         };
         this['set'] = function (url, replace) {
             if (url && url.length && url.charAt(0) == '#') {

                 if (replace) window.location.replace(('' + window.location).split('#')[0] + url);
                 else window.location.hash = url;
             }
             else {
                 if (replace) window.location.assign(url);
                 else window.location.replace(url);
             }
         }
         if (onChange) {
             var handler = function (event) {
                 onChange(window.location.hash || '#');
             };
             if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {
                 if (window.addEventListener) {
                     window.addEventListener('hashchange', handler, false);
                     this.reset = function () { window.removeEventListener('hashchange', handler); };
                 }
                 else {
                     attachEvent('onhashchange', handler);
                     this.reset = function () { window.detachEvent('onhashchange', handler); };
                 }
             }
             else {
                 var timerId = setInterval(function () {
                     var newHash = window.location.hash || '#';
                     if (newHash != prevHash) {
                         prevHash = newHash;
                         onChange(window.location.hash || '#');
                     }
                 }, 50);
                 this.reset = function () { clearInterval(timerId); };
             }

         }
     }
     function simulatedHistory(onChange, baseUrl, fullUrl) {
         baseUrl = baseUrl || '';
         var forwardStack = [], backStack = [];
         function updateStacks(self) {
             self['canBack']=backStack.length > 0;
             self['canForward']=forwardStack.length > 0;
         }
         function routeUrl(x) {
             if (onChange) {
                 if (!fullUrl) {
                     x = x.split('#')
                     if (x.length < 2) x = '#';
                     else x = '#' + x[1];
                 }
                 onChange(x);
             }
         }
         this['url'] = '';
         this['title'] = '';
         this['canForward'] = false;
         this['canBack'] = false;
         this['clear'] = function (url, title) {
             if (url) {
                 var newUrl = url && url.length && url.charAt(0) == '#' ?
                     (baseUrl || ('' + window.location).split('#')[0]) + url :
                     url;
                 routeUrl(newUrl);
                 url = newUrl;
             }
             this.url=url || '';
             this.title=title || '';
             forwardStack=[];
             backStack=[];
             updateStacks(this);
         }
         this['set'] = function (url, replace, title) {
             var newUrl = url && url.length && url.charAt(0) == '#' ?
                 (baseUrl || ('' + window.location).split('#')[0]) + url :
                 url;
             if (!replace) {
                 forwardStack=[];
                 backStack.push({ url: this.url, title: this.title });
             }
             this.url=newUrl;
             this.title=title;
             routeUrl(newUrl);
             updateStacks(this);
         }
         this['forward'] = function (steps) {
             steps = steps || 1;
             if (steps > forwardStack.length) steps = forwardStack.length;
             if (steps <= 0) return;
             var removed = extendsObj(forwardStack.splice(-steps, steps));
             if (removed.length == 1) {
                 backStack.push({ url: this.url, title: this.title });
                 this.url=removed[0].url;
                 this.title=removed[0].title;
             }
             else {
                 removed.reverse();
                 var newCurrent = removed.pop();
                 var backStackO = backStack;
                 backStackO.push({ url: this.url, title: this.title });
                 this.url=newCurrent.url;
                 this.title=newCurrent.title;
                 backStack=backStackO.concat(removed);
             }
             routeUrl(this.url);
             updateStacks(this);
         }
         this['back'] = function (steps) {
             steps = steps || 1;
             if (steps > backStack.length) steps = backStack.length;
             if (steps <= 0) return;
             var removed = extendsObj(backStack.splice(-steps, steps));
             if (removed.length == 1) {
                 forwardStack.push({ url: this.url, title: this.title });
                 this.url=removed[0].url;
                 this.title=removed[0].title;
             }
             else {
                 removed.reverse();
                 var newCurrent = removed.pop();
                 var forwardStack0 = forwardStack;
                 forwardStack0.push({ url: this.url, title: this.title });
                 this.url=newCurrent.url;
                 this.title=newCurrent.title;
                 forwardStack(forwardStack0.concat(removed));
             }
             routeUrl(this.url);
             updateStacks(this);
         }
     }
     this["go"] = function (x) {
         if (x > 0) this['forward'](x);
         else if (x < 0) this['back'](-x);
     };
     var mainRouter = null,
         defaultAction = null,
         defaultPrefixAction = null;
     routing["reset"] = function () {
         if (!mainRouter) return;
         mainRouter.history.reset();
         mainRouter = null;
     };
     var localHandler = function (event) {
         var infos = this[routerInfosKey];
         if (!infos) return true;
         event = event || window.event;
         var target = event.target || event.srcElement;
         var href = target.getAttribute("href");
         var data_action = target.getAttribute("data-action");
         href = data_action || href;

         if (!href || data_action || (!infos['fakeUrls'] && href.indexOf(infos['baseUrl'] + '#') == 0)) {
             if (href) infos['router']['history']['set'](href);
             event.preventDefault ? event.preventDefault() : (event.returnValue = false);
             event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
             return false;
         }
         return true;
     };
     routing["router"] = function (local, baseUrl, fakeUrls, onChange) {
         var
             defaultParameters = false,
             baseRoute = new route(null, true),
             routingHandler = function (url) {
                 baseRoute.matchRec(url, {}, true, -1);
                 if (onChange) onChange(this);
             },
             routerStak = [],
             currRouter = baseRoute;

         if (!local && mainRouter) local = true;

         baseUrl = baseUrl || '';
         this['history'] = local ? new simulatedHistory(routingHandler, baseUrl, fakeUrls) :
                            new nativeHistory(routingHandler);
         if (!local) {
             mainRouter = this;
             routing['history'] = mainRouter['history'];
             fakeUrls = false;
         }
         this['attach'] = function (el) {
             if (!local) return;
             var infos = el[routerInfosKey];
             if (!infos && infos !== '') {
                 el.addEventListener("click", localHandler, false);
                 
             }
             el[routerInfosKey] = {
                 'baseUrl': baseUrl,
                 'fakeUrls': fakeUrls,
                 'router': this
             };
         };
         this['detach'] = function (el) {
             if (!local) return;
             var infos = el[routerInfosKey];
             if (infos) {
                 el[routerInfosKey] = '';
             }
         };
         this['prefix'] = function (path, defaults, action) {
             action = action || defaultAction;
             if (!currRouter.children) currRouter.children = [];
             var newRoute = new route(path, true, defaults, action);
             currRouter.children.push(newRoute);
             routerStak.push(currRouter);
             currRouter = newRoute;
             ; return this;
         }
         this['end'] = function () {
             if (routerStak.length) currRouter = routerStak.pop();
             return this;
         };
         this['route'] = function (path, defaults, action) {
             action = action || defaultAction;
             if (!currRouter.children) currRouter.children = [];
             currRouter.children.push(new route(path, false, defaults, action));
             return this;
         };
         this['notFound'] = function (defaults, action) {
             action = action || defaultAction;
             if (!currRouter.children) currRouter.children = [];
             currRouter.children.push(new route(null, false, defaults, action, true));
             return this;
         };
         this['action'] = function (params) {
             params = unwrapObject(params);
             var rel = params['_rel'];
             if (rel) delete params['_rel'];
             if (defaultParameters || rel) baseRoute.mergeCurrentPathRec(params);
             return baseUrl + baseRoute.actionRec(params, '') + buildQueryString(params);
         };
         this['defaultParameters'] = function (on) {
             defaultParameters = on;
         };
     }
     routing['action'] = function (params) {
         if (!mainRouter) return false;
         return mainRouter['action'](params);
     };
     routing['defaultAction'] = function (action) {
         defaultAction = action;
     };



     
     



 }));
    }());
})();