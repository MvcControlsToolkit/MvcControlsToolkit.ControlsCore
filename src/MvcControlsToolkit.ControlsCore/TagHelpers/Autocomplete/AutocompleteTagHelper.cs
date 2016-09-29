using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.TagHelpers.Internals;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers
{
    [HtmlTargetElement(TagName, Attributes = ForAttributeName)]
    public class AutocompleteTagHelper : TagHelper
    {
        private const string ForAttributeName = "asp-for";
        private const string TagName = "autocomplete";

        [HtmlAttributeName(ForAttributeName)]
        public ModelExpression For { get; set; }
        [HtmlAttributeName("display-property")]
        public ModelExpression DisplayProperty { get; set; }
        [HtmlAttributeName("for-expression-override")]
        public string ForExpressionOverride { get; set; }
        [HtmlAttributeName("display-expression-override")]
        public string DisplayPropertyExpressionOverride { get; set; }
        [HtmlAttributeName("items-display-property")]
        public string ItemsDisplayProperty { get; set; }
        [HtmlAttributeName("items-value-property")]
        public string ItemsValueProperty { get; set; }
        [HtmlAttributeName("items-url")]
        public string ItemsUrl { get;  set; }
        [HtmlAttributeName("url-token")]
        public string UrlToken { get;  set; }
        [HtmlAttributeName("dataset-name")]
        public string DataSetName { get; set; }
        [HtmlAttributeName("max-results")]
        public uint MaxResults { get; set; }
        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }

        

        private IHtmlGenerator generator;

        public AutocompleteTagHelper(IHtmlGenerator generator)
        {
            this.generator = generator;
        }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (DisplayProperty == null) new ArgumentNullException("display-property");
            if (string.IsNullOrWhiteSpace(ItemsDisplayProperty)) new ArgumentNullException("items-display-property");
            if (string.IsNullOrWhiteSpace(ItemsValueProperty)) new ArgumentNullException("items-value-property");
            if (string.IsNullOrWhiteSpace(ItemsUrl)) new ArgumentNullException("items-url");
            if (string.IsNullOrWhiteSpace(UrlToken)) new ArgumentNullException("url-token");
            if (string.IsNullOrWhiteSpace(DataSetName)) new ArgumentNullException("max-results");
            var currProvider = ViewContext.TagHelperProvider();
            var options = new AutocompleteOptions
            {
                Generator = generator

            };
            await currProvider.GetTagProcessor(TagName)(context, output, this, options, null);
        }
    }
}
