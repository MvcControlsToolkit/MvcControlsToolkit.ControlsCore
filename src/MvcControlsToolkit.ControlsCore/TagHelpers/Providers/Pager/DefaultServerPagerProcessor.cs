using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.Templates;
using System.Text.Encodings.Web;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{

    public class DefaultServerPagerProcessor
    {
        private TagHelperContext context;
        private TagHelperOutput output;
        private PagerTagHelper tag;
        private Internals.PagerOptions options;
        private ContextualizedHelpers helpers;
        public DefaultServerPagerProcessor(
            TagHelperContext context,
            TagHelperOutput output,
            PagerTagHelper tag,
            Internals.PagerOptions options,
            ContextualizedHelpers helpers
            )
        {
            this.context = context;
            this.output = output;
            this.tag = tag;
            this.options = options;
            this.helpers = helpers;
        }
        public async Task Process()
        {
            //preparing options
            int pageSize = tag.PageSizeDefault;
            if (tag.PageSize?.Model != null && tag.PageSize.Metadata.ModelType == typeof(int))
                pageSize = (int)tag.PageSize.Model;
            int page = tag.CurrentPageDefault;
            if (tag.CurrentPage?.Model != null && tag.CurrentPage.Metadata.ModelType == typeof(int))
                page = (int)tag.CurrentPage.Model;
            int totalPages = tag.TotalPagesDefault.HasValue? tag.TotalPagesDefault.Value: int.MaxValue;
            if (tag.TotalPages?.Model != null && tag.TotalPages.Metadata.ModelType == typeof(int))
                totalPages = (int)tag.TotalPages.Model;


            var layoutOptions = new DefaultServerPagerLayoutOptions
                (totalPages != 0 && page > 0,
                pageSize,
                tag.Mode,
                Math.Max(1, page - tag.MaxPages),
                page,
                Math.Min(page + tag.MaxPages, totalPages),
                tag.Url?.Model as string ?? tag.UrlDefault,
                tag.SkipUrlToken,
                tag.TakeUrlToken,
                tag.LocalizationType,
                tag.CssClass,
                options.LayoutTemplate,
                options.Operation
                );
            output.TagName = string.Empty;
            var fres = await options.LayoutTemplate.Invoke(tag.CurrentPage, layoutOptions, helpers);
            if (tag.CopyHtml != null)
            {
                var iores = new System.IO.StringWriter();
                fres.WriteTo(iores, HtmlEncoder.Default);
                var sres = iores.ToString();
                helpers.Context.ViewData["copied-html-" + tag.CopyHtml] = sres;
                output.Content.SetHtmlContent(sres);
                return;
            }
            output.Content.SetHtmlContent(fres);

        }
    }
}
