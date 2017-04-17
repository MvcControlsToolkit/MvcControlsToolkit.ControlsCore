using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
    public class DefaultServerQueryButtonProcessor
    {
        private TagHelperOutput output;
        private QueryButtonOptions options;
        private ContextualizedHelpers helpers;
        public DefaultServerQueryButtonProcessor(TagHelperOutput output, ContextualizedHelpers helpers, QueryButtonOptions options)
        {
            this.output = output;
            this.options = options;
            this.helpers = helpers;
        }
        private IHtmlContent buttonAttributes()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("data-operation='");
            sb.Append(
            options.Type == QueryWindowType.Filtering ? "query-filtering " :
                (options.Type == QueryWindowType.Sorting ? "query-sorting " : "query-grouping "));
            sb.Append(helpers.Context.ViewData.GetFullHtmlFieldName(this.options.For.Name));
            if(options.Url != null)
            {
                sb.Append(" ");
                sb.Append(HtmlEncoder.Default.Encode(options.Url));
            }
            if(options.AjaxId != null)
            {
                sb.Append(" ");
                sb.Append("."+options.AjaxId);
            }
            sb.Append("'");
            return new HtmlString(sb.ToString());
        }
        public async Task Process()
        {
            var layoutOptions = new DefaultServerQueryButtonLayoutOptions(
                this.options.ButtonTemplate,
                buttonAttributes(),
                helpers.Context.ViewData.GetFullHtmlFieldName(this.options.For.Name),
                this.options.For.Model as QueryDescription,
                this.options.ButtonText, this.options.ButtonTitle, this.options.ButtonIcon,
                this.options.ButtonCss,
                this.options.Type);
            output.TagName = string.Empty;
            var fres = await options.ButtonTemplate.Invoke(options.For, layoutOptions, helpers);
            output.Content.SetHtmlContent(fres);


        }
    }
}
