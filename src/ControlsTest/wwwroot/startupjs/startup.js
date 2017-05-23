/// <reference path="../lib/mvcct-enhancer/mvcct.enhancer.js" />
(function () {
    var options = {};
    options.serverWidgets = {
        autocomplete: {
            removeDiacritics: true
        }
    };
    options.browserSupport = {
        cookie: "_browser_basic_capabilities",
        forms: null,
        fallbacks: {
            number: {
                force: true
            },
            range: {
                force: true
            },
            time: {
                force: true
            },
            date: {
                force: true
            },
            datetime: {
                force: true
            },
            month: {
                force: true
            },
            week: {
                force: true
            },
            color: {
                force: true
            }
        },
        handlers: {
            enhance: {
                //datetime: undefined
            }
        }
    };
    mvcct.enhancer.waitAsync(options);
})();