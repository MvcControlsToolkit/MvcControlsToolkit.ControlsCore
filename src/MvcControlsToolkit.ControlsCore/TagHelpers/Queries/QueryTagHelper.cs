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
using Microsoft.AspNetCore.Html;
using MvcControlsToolkit.Core.OptionsParsing;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class QueryTagHelperBase : TagHelper
    {
        protected const string ForAttributeName = "asp-for";
        protected const string CollectionForAttributeName = "query-for";
        protected const string ClientCustomProcessorForAttributeName = "client-custom-processor-for";
        protected const string TypeAttributeName = "type";
        protected IHttpContextAccessor httpAccessor;
        protected IHtmlHelper html;
        protected IViewComponentHelper component;
        protected IUrlHelperFactory urlHelperFactory;
        protected IStringLocalizerFactory factory;
        protected IStringLocalizer localizer = null;
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
        public ModelExpression TotalPagesContainer { get; set; }

        [HtmlAttributeName(ClientCustomProcessorForAttributeName)]
        public ModelExplorer ClientCustomProcessorFor { get; set; }

        [HtmlAttributeName(TypeAttributeName)]
        public QueryWindowType Type { get; set; }

        [HtmlAttributeName("row-collection-name")]
        public string RowCollection { get; set; }

        [HtmlAttributeName("window-template")]
        public string LayoutTemplate { get; set; }


        [HtmlAttributeName("grouping-output")]
        public Type GroupingOutput { get; set; }


        public QueryTagHelperBase(IHtmlHelper html,
            IHttpContextAccessor httpAccessor, IViewComponentHelper component,
            IUrlHelperFactory urlHelperFactory,
            IStringLocalizerFactory factory)
        {
            this.httpAccessor = httpAccessor;
            this.html = html;
            this.component = component;
            this.urlHelperFactory = urlHelperFactory;
            this.factory = factory;
            
        }
        protected string localize(string x)
        {
            if (localizer == null || x == null) return x;
            return localizer[x];
        }
        protected string localizeWindow(RowType row, string x)
        {
            if (row == null || x == null || row.LocalizationType == null) return x;
            var localizer = row.GetLocalizer(factory);
            return localizer[x];
        }
        protected string defaultTitle()
        {
            return Type == QueryWindowType.Filtering ? "filter" :
                (Type == QueryWindowType.Sorting ? "sorting" : "grouping");
        }
        protected string defaultHeader()
        {
            return Type == QueryWindowType.Filtering ? "Filter" :
                (Type == QueryWindowType.Sorting ? "Sorting" : "Grouping");
        }
    }

    [HtmlTargetElement(TagName, Attributes = ForAttributeName + "," + TypeAttributeName, TagStructure = TagStructure.WithoutEndTag)]
    public class QueryTagHelper : QueryTagHelperBase
    {
       
        private const string TagName = "query";

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

        [HtmlAttributeName("button-css")]
        public string ButtonCss { get; set; }
        [HtmlAttributeName("button-localization-type")]
        public Type ButtonLocalizationType { get; set; }



        public QueryTagHelper(IHtmlHelper html,
            IHttpContextAccessor httpAccessor, IViewComponentHelper component,
            IUrlHelperFactory urlHelperFactory,
            IStringLocalizerFactory factory)
            :base(html, httpAccessor, component, urlHelperFactory, factory)
        {
            
            
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
            if (ButtonLocalizationType != null) localizer = factory.Create(ButtonLocalizationType);
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
            IList<KeyValuePair<string, string>> toolbars = string.IsNullOrEmpty(RowCollection) ?
                null :
                RowType.GetToolbarsCollection(RowCollection);
            var windowOptions = new QueryWindowOptions(rows, toolbars)
            {
                ClientCustomProcessorFor=ClientCustomProcessorFor,
                CollectionFor=CollectionFor,
                For = For,
                SourceFor=SourceFor,
                GroupingOutput=GroupingOutput,
                Header=Header??defaultHeader(),
                LayoutTemplate= string.IsNullOrEmpty(LayoutTemplate) ? windowDefaultTemplates.LayoutTemplate :
                    new Template<LayoutTemplateOptions>(TemplateType.Partial, LayoutTemplate),
                TotalPagesContainer = TotalPagesContainer
            };
            Func<Tuple<IList<RowType>, IList<KeyValuePair<string, string>>>, IHtmlContent> toExecute =
                group =>
                {
                    if (windowOptions.Rows == null && group != null) windowOptions.UpdateRows(group.Item1, group.Item2);
                    if (windowOptions.Rows == null) return new HtmlString(string.Empty);
                    var mainRow = windowOptions.Rows.FirstOrDefault();
                    if (mainRow == null) return new HtmlString(string.Empty);

                    windowOptions.Header = localizeWindow(mainRow, windowOptions.Header);
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
                TagContextHelper.EndOfBodyHtml(httpAccessor.HttpContext, toExecute(new Tuple<IList<RowType>, IList<KeyValuePair<string, string>>>(rows, toolbars)));
            else
                TagContextHelper.RegisterDefaultToolWindow(httpAccessor.HttpContext, toExecute);
            
        }
    }
    [HtmlTargetElement(TagName, Attributes = ForAttributeName + "," + TypeAttributeName+","+CollectionForAttributeName, TagStructure = TagStructure.NormalOrSelfClosing)]
    public class QueryTagHelperInLine : QueryTagHelperBase
    {

        private const string TagName = "query-inline";

        public QueryTagHelperInLine(IHtmlHelper html,
            IHttpContextAccessor httpAccessor, IViewComponentHelper component,
            IUrlHelperFactory urlHelperFactory,
            IStringLocalizerFactory factory)
            : base(html, httpAccessor, component, urlHelperFactory, factory)
        {


        }
        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (For == null) throw new ArgumentNullException(ForAttributeName);
            if (!typeof(QueryDescription).GetTypeInfo().IsAssignableFrom(For.Metadata.ModelType)) throw new ArgumentException(ForAttributeName);
            if (CollectionFor == null) throw new ArgumentNullException(CollectionForAttributeName);
            
            
            var currProvider = ViewContext.TagHelperProvider();

            var tagPrefix = Type == QueryWindowType.Filtering ? "query-filter-" :
                (Type == QueryWindowType.Sorting ? "query-sort-" : "query-group-");

           
            var windowTag = tagPrefix + "inline";
            var ctx = new Core.Templates.ContextualizedHelpers(ViewContext, html, httpAccessor, component, urlHelperFactory, factory);

            
            var windowDefaultTemplates = currProvider.GetDefaultTemplates(windowTag);

            
            
            IList<RowType> rows = string.IsNullOrEmpty(RowCollection) ?
                null :
                RowType.GetRowsCollection(RowCollection);
            IList<KeyValuePair<string, string>> toolbars = string.IsNullOrEmpty(RowCollection) ?
                null :
                RowType.GetToolbarsCollection(RowCollection);
            if(rows == null || toolbars == null)
            {
                var nc = new Core.OptionsParsing.ReductionContext(Core.OptionsParsing.TagTokens.RowContainer, 0, windowDefaultTemplates, rows != null);
                context.SetChildrenReductionContext(nc);
                
                await output.GetChildContentAsync();
                var collector = new Core.OptionsParsing.RowContainerCollector(nc);
                var res = collector.Process(this, windowDefaultTemplates) as Tuple<IList<Core.Templates.RowType>, IList<KeyValuePair<string, string>>>;
                if (rows == null)
                {
                    rows = res.Item1;
                    if (!string.IsNullOrEmpty(RowCollection))
                        RowType.CacheRowGroup(RowCollection, rows, httpAccessor.HttpContext);
                }
                if (toolbars == null)
                {
                    toolbars = res.Item2;
                    if (!string.IsNullOrEmpty(RowCollection))
                        RowType.CacheToolbarGroup(RowCollection, toolbars, httpAccessor.HttpContext);
                }
            }
            var windowOptions = new QueryWindowOptions(rows, toolbars)
            {
                ClientCustomProcessorFor = ClientCustomProcessorFor,
                CollectionFor = CollectionFor,
                For = For,
                SourceFor = SourceFor,
                GroupingOutput = GroupingOutput,
                Header = null,
                LayoutTemplate = string.IsNullOrEmpty(LayoutTemplate) ? windowDefaultTemplates.LayoutTemplate :
                    new Template<LayoutTemplateOptions>(TemplateType.Partial, LayoutTemplate),
                TotalPagesContainer = TotalPagesContainer
            };
            Func<Tuple<IList<RowType>, IList<KeyValuePair<string, string>>>, Task<IHtmlContent>> toExecute =
                async group =>
                {
                    if (windowOptions.Rows == null && group != null) windowOptions.UpdateRows(group.Item1, group.Item2);
                    if (windowOptions.Rows == null) return new HtmlString(string.Empty);
                    var mainRow = windowOptions.Rows.FirstOrDefault();
                    if (mainRow == null) return new HtmlString(string.Empty);

                    windowOptions.Header = localizeWindow(mainRow, windowOptions.Header);
                    if (Type == QueryWindowType.Filtering && mainRow.FilterTemplate == null)
                    {
                        mainRow.FilterTemplate = windowDefaultTemplates.ERowTemplate;
                        foreach (var col in mainRow.Columns)
                        {
                            col.FilterTemplate = windowDefaultTemplates.EColumnTemplate;

                        }
                    }
                    await currProvider.GetTagProcessor(windowTag)(null, null, this, windowOptions, ctx);
                    
                    return windowOptions.Result;
                };
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(await toExecute(new Tuple<IList<RowType>, IList<KeyValuePair<string, string>>>(rows, toolbars)));
        }
    }
}
