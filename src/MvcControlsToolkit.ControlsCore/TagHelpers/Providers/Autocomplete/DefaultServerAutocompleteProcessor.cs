using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
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
            var infos = new Dictionary<object, string>();
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
                infos);
            
            var search = options.Generator.GenerateTextBox(tag.ViewContext,
                tag.DisplayProperty.ModelExplorer,
                tag.ForExpressionOverride ?? tag.DisplayProperty.Name,
                tag.DisplayProperty.Model,
                tag.For.Metadata.HasNonDefaultEditFormat ? tag.For.Metadata.EditFormatString: tag.DisplayProperty.Metadata.EditFormatString,
                output.Attributes);
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(search.ToString());
            output.Content.AppendHtml(hidden.ToString());
        }
    }
}
