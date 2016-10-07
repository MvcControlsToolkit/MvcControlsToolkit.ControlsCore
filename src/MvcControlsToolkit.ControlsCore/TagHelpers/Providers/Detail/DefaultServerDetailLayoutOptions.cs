using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MvcControlsToolkit.Core.Templates;
using Microsoft.Extensions.Localization;
using Microsoft.AspNetCore.Html;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class DefaultServerDetailLayoutOptions: LayoutTemplateOptions
    {
        public string CssClass { get; private set; }
        public string Id { get; private set; }
        public string Prefix { get; private set; }
        public Type LocalizerType { get; private set; }
        public IStringLocalizer Localizer { get; private set; }
        public bool EditMode { get; private set; }

        public string FormAction { get; private set; }
        
        public string FormMethod { get; private set; }
        
        public bool? Antiforgery { get; private set; }

        private ContextualizedHelpers helpers;
        public DefaultServerDetailLayoutOptions(
            ContextualizedHelpers helpers,
            IList<RowType> rows,
            IList<KeyValuePair<string, string>> toolbars,
            Template<LayoutTemplateOptions> layoutTemplate,
            IEnumerable<Template<LayoutTemplateOptions>> subTemplates,
            IHtmlContent mainContent,
            string id,
            string prefix,
            string cssClass,
            Type localizerType,
            bool editMode,
            string formAction,
            string formMethod,
            bool? antiforgery
            ) : base(rows, toolbars, layoutTemplate, subTemplates, mainContent)
        {
            this.helpers = helpers;
            Id = id;
            Prefix = prefix;
            CssClass = cssClass;
            LocalizerType = localizerType;
            Localizer = LocalizerType != null ? helpers.LocalizerFactory.Create(LocalizerType) : null;
            EditMode = editMode;
            Antiforgery = antiforgery;
            FormAction = formAction;
            FormMethod = formMethod;
        }
        
    }
}
