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
            infos.Add("data-url", tag.ItemsUrl);
            infos.Add("data-url-token", tag.UrlToken);
            infos.Add("data-operation", string.Format("autocomplete {0} {1} {2} {3}",
                tag.ItemsValueProperty,
                tag.ItemsDisplayProperty,
                tag.DataSetName,
                tag.MaxResults.ToString(CultureInfo.InvariantCulture)
                ));
            
            var hidden = options.Generator.GenerateHidden(
                tag.ViewContext,
                tag.For.ModelExplorer,
                tag.ForExpressionOverride ?? tag.For.Name,
                tag.For.Model,
                false,
                null);
            
            var search = options.Generator.GenerateTextBox(tag.ViewContext,
                tag.DisplayProperty.ModelExplorer,
                tag.DisplayPropertyExpressionOverride ?? tag.DisplayProperty.Name,
                tag.DisplayProperty.Model,
                tag.For.Metadata.HasNonDefaultEditFormat ? tag.For.Metadata.EditFormatString: tag.DisplayProperty.Metadata.EditFormatString,
                infos);
            output.TagName = string.Empty;
            var result = new StringWriter();
            search.WriteTo(result, HtmlEncoder.Default);
            hidden.WriteTo(result, HtmlEncoder.Default);
            output.Content.SetHtmlContent(result.ToString());
            
        }
    }
}
