using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.Views;
using MvcControlsToolkit.Core.TagHelpersUtilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.Templates;
using System.Reflection;

namespace MvcControlsToolkit.Core.TagHelpers
{
    
    [HtmlTargetElement(TagName, Attributes = ForAttributeName + "," + TypeAttributeName)]
    public class QueryTagHelper : TagHelper
    {
        private const string ForAttributeName = "asp-for";
        private const string CollectionForAttributeName = "query-for";
        private const string ClientCustomProcessorForAttributeName = "client-custom-processor-for";
        private const string TypeAttributeName = "type";
        private const string TagName = "query";
        private IHttpContextAccessor httpAccessor;
        private IHtmlHelper html;
        private IViewComponentHelper component;
        private IUrlHelperFactory urlHelperFactory;
        private IStringLocalizerFactory factory;
        private IStringLocalizer localizer=null;
        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }

        [HtmlAttributeName(ForAttributeName)]
        public ModelExpression For { get; set; }

        [HtmlAttributeName(CollectionForAttributeName)]
        public ModelExpression CollectionFor { get; set; }

        [HtmlAttributeName("source-for")]
        public ModelExplorer SourceFor { get; set; }

        [HtmlAttributeName("override-url")]
        public string Url { get; set; }

        [HtmlAttributeName("override-ajax-id")]
        public string AjaxId { get; set; }
        [HtmlAttributeName("total-pages")]
        public ModelExpression TotalPagesContainer{get; set;}

        [HtmlAttributeName(ClientCustomProcessorForAttributeName)]
        public ModelExplorer ClientCustomProcessorFor { get; set; }

        [HtmlAttributeName(TypeAttributeName)]
        public QueryWindowType Type { get; set; }

        [HtmlAttributeName("row-collection-name")]
        public string RowCollection { get; set; }

        [HtmlAttributeName("window-template")]
        public string LayoutTemplate { get; set; }

        [HtmlAttributeName("window-header")]
        public string Header { get; set; }

        [HtmlAttributeName("button-template")]
        public string ButtonTemplate { get; set; }

        [HtmlAttributeName("button-text")]
        public string ButtonText { get; set; }

        [HtmlAttributeName("button-title")]
        public string ButtonTitle { get; set; }

        [HtmlAttributeName("button-icon")]
        public string ButtonIcon { get; set; }

        [HtmlAttributeName("grouping-output")]
        public Type GroupingOutput { get; set; }
        [HtmlAttributeName("button-css")]
        public string ButtonCss { get; set; }
        [HtmlAttributeName("button-localization-type")]
        public Type ButtonLocalizationType { get; set; }



        public QueryTagHelper(IHtmlHelper html,
            IHttpContextAccessor httpAccessor, IViewComponentHelper component,
            IUrlHelperFactory urlHelperFactory,
            IStringLocalizerFactory factory)
        {
            this.httpAccessor = httpAccessor;
            this.html = html;
            this.component = component;
            this.urlHelperFactory = urlHelperFactory;
            this.factory = factory;
            if (ButtonLocalizationType != null) localizer = factory.Create(ButtonLocalizationType);
        }
        private string localize(string x)
        {
            if (localizer == null || x== null) return x;
            return localizer[x];
        }
        private string defaultTitle()
        {
            return Type == QueryWindowType.Filtering ? "filter" :
                (Type == QueryWindowType.Sorting ? "sorting" : "grouping");
        }
        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (For == null) throw new ArgumentNullException(ForAttributeName);
            if (!typeof(QueryDescription).GetTypeInfo().IsAssignableFrom(For.Metadata.ModelType)) throw new ArgumentException(ForAttributeName);
            if (CollectionFor == null)
            {
                CollectionFor = TagContextHelper.GetBindingContext(httpAccessor.HttpContext, BindingContextNames.Collection);
                if (CollectionFor == null) throw new ArgumentNullException(CollectionForAttributeName);
            }
            var currProvider = ViewContext.TagHelperProvider();
            
            var tagPrefix = Type == QueryWindowType.Filtering ? "query-filter-" :
                (Type == QueryWindowType.Sorting ? "query-sort-" : "query-group-");

            var buttonTag = "query-button";
            var windowTag = tagPrefix + "window";
            var ctx = new Core.Templates.ContextualizedHelpers(ViewContext, html, httpAccessor, component, urlHelperFactory, factory);
            
            var buttonDefaultTemplates = currProvider.GetDefaultTemplates(buttonTag);
            var windowDefaultTemplates = currProvider.GetDefaultTemplates(windowTag);
            
            var buttonOptions = new QueryButtonOptions
            {
                ButtonIcon = ButtonIcon,
                ButtonTitle = localize(ButtonTitle??defaultTitle()),
                ButtonText = localize(ButtonText),
                ButtonTemplate = string.IsNullOrEmpty(ButtonTemplate) ? buttonDefaultTemplates.LayoutTemplate :
                    new Template<LayoutTemplateOptions>(TemplateType.Partial, ButtonTemplate),
                CollectionFor = CollectionFor,
                For = For,
                TotalPagesContainer = TotalPagesContainer,
                Type=Type,
                AjaxId=AjaxId,
                Url=Url,
                ButtonCss = ButtonCss
            };
            await currProvider.GetTagProcessor(buttonTag)(context, output, this, buttonOptions, ctx);
            IList<RowType> rows = string.IsNullOrEmpty(RowCollection) ?
                null :
                RowType.GetRowsCollection(RowCollection);
            var windowOptions = new QueryWindowOptions(rows)
            {
                ClientCustomProcessorFor=ClientCustomProcessorFor,
                CollectionFor=CollectionFor,
                For = For,
                GroupingOutput=GroupingOutput,
                Header=Header,
                LayoutTemplate=LayoutTemplate,
                TotalPagesContainer = TotalPagesContainer
            };
            Func<IList<RowType>, string> toExecute =
                r =>
                {
                    if (windowOptions.Rows == null && r != null) windowOptions.UpdateRows(r);
                    if (windowOptions.Rows == null) return string.Empty;
                    var mainRow = windowOptions.Rows.FirstOrDefault();
                    if (mainRow == null) return string.Empty;
                    if (Type == QueryWindowType.Filtering && mainRow.FilterTemplate == null)
                    {
                        mainRow.FilterTemplate = windowDefaultTemplates.ERowTemplate;
                        foreach (var col in mainRow.Columns)
                        {
                            col.FilterTemplate = windowDefaultTemplates.EColumnTemplate;
                            
                        }
                    }
                    var res = currProvider.GetTagProcessor(windowTag)(null, null, this, windowOptions, ctx);
                        res.Wait();
                        return windowOptions.Result;
                };
            if (rows != null)
                TagContextHelper.EndOfBodyHtml(httpAccessor.HttpContext, toExecute(rows));
            else
                TagContextHelper.RegisterDefaultToolWindow(httpAccessor.HttpContext, toExecute);
            
        }
    }
}
