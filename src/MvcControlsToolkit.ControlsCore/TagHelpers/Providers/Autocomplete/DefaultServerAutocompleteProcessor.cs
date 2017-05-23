using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.TagHelpers;
using MvcControlsToolkit.Core.TagHelpers.Internals;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
    public class DefaultServerAutocompleteProcessor
    {
        //private static IDictionary<string, object> hiddenAttributes = new Dictionary<string, object>()
        //{
        //    {"id", null }
        //};
        private TagHelperContext context;
        private TagHelperOutput output;
        private AutocompleteOptions options;
        private AutocompleteTagHelper tag;
        public DefaultServerAutocompleteProcessor(TagHelperContext context, TagHelperOutput output, AutocompleteTagHelper tag, AutocompleteOptions options)
        {
            this.context = context;
            this.output = output;
            this.tag = tag;
            this.options = options;
        }
        public async Task Process()
        {
            var infos =  new Dictionary<string, object>();
            if(output.Attributes != null)
            {
                foreach (var pair in output.Attributes) infos.Add(pair.Name, pair.Value);
            }
            if(!infos.ContainsKey("name")) infos.Add("name", options.ForcedDisplayName);
            if (options.NoId && !infos.ContainsKey("id")) infos.Add("id", null);
            infos.Add("data-url", tag.ItemsUrl);
            infos.Add("data-url-token", tag.UrlToken);
            infos.Add("data-operation", string.Format("autocomplete {0} {1} {2} {3} {4} {5}",
                options.PropertyResolver(tag.ItemsValueProperty),
                options.PropertyResolver(tag.ItemsDisplayProperty),
                tag.DataSetName,
                tag.MaxResults.ToString(CultureInfo.InvariantCulture),
                tag.MinChars.ToString(CultureInfo.InvariantCulture),
                tag.PartialSelection ? "tolerate" : (tag.DefaultToempty ? "true" : "false")
                ));
            infos.Add("autocomplete", "off");
            IDictionary<string, object> hiddenAttributes = new Dictionary<string, object>();
            if (options.NoId) hiddenAttributes.Add("id", null);
            var hiddenExplorer = tag.ForPropertyExplorer ?? tag.For.ModelExplorer;
            hiddenAttributes.Add("data-original-type", ClientSideHelpers.getClientType(hiddenExplorer?.Metadata));
            var hidden = options.Generator.GenerateHidden(
                tag.ViewContext,
                hiddenExplorer,
                tag.ForExpressionOverride ?? tag.For.Name,
                tag.ForPropertyExplorer != null ? tag.ForPropertyExplorer.Model : tag.For.Model,
                false,
                options.NoId ? hiddenAttributes : null);
            var metadata = tag.DisplayPropertyExplorer != null ? tag.DisplayPropertyExplorer.Metadata : tag.For.ModelExplorer.Metadata;

            var search = options.Generator.GenerateTextBox(tag.ViewContext,
                tag.DisplayPropertyExplorer??tag.DisplayProperty.ModelExplorer,
                tag.DisplayPropertyExpressionOverride ?? tag.DisplayProperty.Name,
                tag.DisplayPropertyExplorer != null ? tag.DisplayPropertyExplorer.Model : tag.DisplayProperty.Model,
                metadata.HasNonDefaultEditFormat ? metadata.EditFormatString: metadata.EditFormatString,
                infos);
            output.TagName = string.Empty;
            var result = new StringWriter();
            search.WriteTo(result, HtmlEncoder.Default);
            hidden.WriteTo(result, HtmlEncoder.Default);
            output.Content.SetHtmlContent(result.ToString());
            
        }
    }
}
