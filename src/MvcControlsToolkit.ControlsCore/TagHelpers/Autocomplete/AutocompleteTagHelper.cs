using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Options;
using MvcControlsToolkit.Core.TagHelpers.Internals;
using MvcControlsToolkit.Core.Views;
using Newtonsoft.Json.Serialization;

namespace MvcControlsToolkit.Core.TagHelpers
{
    [HtmlTargetElement(TagName, TagStructure = TagStructure.WithoutEndTag)]
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
        [HtmlAttributeName("for-explorer")]
        public ModelExplorer ForPropertyExplorer { get; set; }
        [HtmlAttributeName("display-explorer")]
        public ModelExplorer DisplayPropertyExplorer { get; set; }
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
        [HtmlAttributeName("min-chars")]
        public uint MinChars { get; set; }
        [HtmlAttributeName("default-to-empty")]
        public bool DefaultToempty { get; set; }
        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }

        

        private IHtmlGenerator generator;
        private MvcJsonOptions jsonOptions;
        public AutocompleteTagHelper(IHtmlGenerator generator, IOptions<MvcJsonOptions> jsonOptions)
        {
            this.generator = generator;
            this.jsonOptions = jsonOptions.Value;
        }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (DisplayProperty == null && (DisplayPropertyExplorer == null || DisplayPropertyExpressionOverride==null))
                new ArgumentNullException("display-property/display-expression-override+display-explorer");
            if (For == null && (ForPropertyExplorer == null || ForExpressionOverride == null))
                new ArgumentNullException("asp-for/for-expression-override+for-explorer");
            if (string.IsNullOrWhiteSpace(ItemsDisplayProperty)) new ArgumentNullException("items-display-property");
            if (string.IsNullOrWhiteSpace(ItemsValueProperty)) new ArgumentNullException("items-value-property");
            if (string.IsNullOrWhiteSpace(ItemsUrl)) new ArgumentNullException("items-url");
            if (string.IsNullOrWhiteSpace(UrlToken)) new ArgumentNullException("url-token");
            if (string.IsNullOrWhiteSpace(DataSetName)) new ArgumentNullException("dataset-name");
            if (MaxResults == 0) MaxResults=20;
            if (MinChars == 0) MinChars = 3;
            var currProvider = ViewContext.TagHelperProvider();
            var resolver = jsonOptions.SerializerSettings.ContractResolver as DefaultContractResolver;
            var vd = ViewContext.ViewData;
            var options = new AutocompleteOptions
            {
                Generator = generator,
                PropertyResolver = resolver != null ? resolver.GetResolvedPropertyName : new Func<string, string>(x => x),
                ForcedValueName =  currProvider.GenerateNames ? vd.GetFullHtmlFieldName(ForExpressionOverride ?? For.Name) : null,
                ForcedDisplayName = currProvider.GenerateNames ? vd.GetFullHtmlFieldName(DisplayPropertyExpressionOverride ?? DisplayProperty.Name) : null,
                NoId= !currProvider.GenerateNames || ViewContext.IsFilterRendering()
            };
            await currProvider.GetTagProcessor(TagName)(context, output, this, options, null);
        }
    }
}
