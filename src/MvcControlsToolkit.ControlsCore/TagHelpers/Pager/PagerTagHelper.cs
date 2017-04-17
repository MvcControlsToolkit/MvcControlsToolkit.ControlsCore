using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public enum PagerMode {OData=0, CustomPages}
    [HtmlTargetElement(TagName, TagStructure=TagStructure.WithoutEndTag)]
    public class PagerTagHelper : TagHelper
    {
        private const string TagName = "pager";

        [HtmlAttributeName("mode")]
        public PagerMode Mode { get; set; }

        [HtmlAttributeName("layout-template")]
        public string LayoutTemplate { get; set; }

        [HtmlAttributeName("max-pages")]
        public int MaxPages { get; set; }

        [HtmlAttributeName("url-default")]
        public string UrlDefault { get; set; }

        [HtmlAttributeName("url")]
        public ModelExpression Url { get; set; }

        [HtmlAttributeName("skip-url-token")]
        public string SkipUrlToken { get; set; }

        [HtmlAttributeName("take-url-token")]
        public string TakeUrlToken { get; set; }

        [HtmlAttributeName("page-size-default")]
        public int PageSizeDefault { get; set; }

        [HtmlAttributeName("page-size")]
        public ModelExpression PageSize { get; set; }

        [HtmlAttributeName("current-page-default")]
        public int CurrentPageDefault { get; set; }

        [HtmlAttributeName("current-page")]
        public ModelExpression CurrentPage { get; set; }

        [HtmlAttributeName("current-query")]
        public ModelExpression Query { get; set; }

        [HtmlAttributeName("total-pages-default")]
        public int? TotalPagesDefault { get; set; }

        [HtmlAttributeName("total-pages")]
        public ModelExpression TotalPages { get; set; }

        [HtmlAttributeName("class")]
        public string CssClass { get; set; }

        [HtmlAttributeName("localization-type")]
        public Type LocalizationType { get; set; }

        [HtmlAttributeName("copy-html")]
        public string CopyHtml { get; set; }

        [HtmlAttributeName("ajax-id")]
        public string AjaxId { get; set; }

        [HtmlAttributeName("ajax-endpoint")]
        public string AjaxEndpoint { get; set; }

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }

        private IHtmlHelper html;
        private IHttpContextAccessor httpAccessor;
        private IViewComponentHelper component;
        private IUrlHelperFactory urlHelperFactory;
        private IStringLocalizerFactory factory;

        public PagerTagHelper(
            IHtmlHelper html,
            IHttpContextAccessor httpAccessor, IViewComponentHelper component,
            IUrlHelperFactory urlHelperFactory,
            IStringLocalizerFactory factory)
        {
            this.html = html;
            this.httpAccessor = httpAccessor;
            this.component = component;
            this.urlHelperFactory = urlHelperFactory;
            this.factory = factory;
        }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {

            if (string.IsNullOrWhiteSpace(SkipUrlToken)) SkipUrlToken="_skip_";
            if (string.IsNullOrWhiteSpace(TakeUrlToken)) TakeUrlToken="_top_";
            if (string.IsNullOrWhiteSpace(UrlDefault) && Url == null && Query == null) new ArgumentNullException("url-default/url/query");

            var ctx = new ContextualizedHelpers(ViewContext, html, httpAccessor, component, urlHelperFactory, factory);

            if (PageSizeDefault <= 0) PageSizeDefault = 10;
            if (MaxPages <= 0) MaxPages = 5;

            var currProvider = ViewContext.TagHelperProvider();
            string operation = null;
            if(AjaxId!= null )
                operation = "data-operation='ajax-html "+ AjaxId + "'";
            else if(AjaxEndpoint != null)
                operation = "data-operation='ajax-json " + AjaxEndpoint + "'";
            var defaultTemplates = currProvider.GetDefaultTemplates(TagName);
            var options = new Internals.PagerOptions(defaultTemplates.GetLayoutTemplate(LayoutTemplate), operation);
            await currProvider.GetTagProcessor(TagName)(context, output, this,  options , ctx);
        }
    }
}
