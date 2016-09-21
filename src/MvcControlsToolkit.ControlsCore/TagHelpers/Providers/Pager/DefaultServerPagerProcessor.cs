using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.Templates;

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
            if (tag.PageSize.Model != null && tag.PageSize.Metadata.ModelType == typeof(int))
                pageSize = (int)tag.PageSize.Model;
            int page = tag.CurrentPageDefault;
            if (tag.CurrentPage.Model != null && tag.CurrentPage.Metadata.ModelType == typeof(int))
                page = (int)tag.CurrentPage.Model;
            int totalPages = tag.TotalPagesDefault.HasValue? tag.TotalPagesDefault.Value: int.MaxValue;
            if (tag.TotalPages.Model != null && tag.TotalPages.Metadata.ModelType == typeof(int))
                totalPages = (int)tag.CurrentPage.Model;


            var layoutOptions = new DefaultServerPagerLayoutOptions
                (totalPages != 0 && page > 0,
                pageSize,
                tag.Mode,
                Math.Max(1, page - tag.MaxPages),
                page,
                Math.Min(page + tag.MaxPages, totalPages),
                tag.Url.Model as string ?? tag.UrlDefault,
                tag.SkipUrlToken,
                tag.TakeUrlToken,
                tag.LocalizationType,
                tag.CssClass,
                options.LayoutTemplate
                );
            var fres = options.LayoutTemplate.Invoke(tag.CurrentPage, layoutOptions, helpers);
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(fres);

        }
    }
}
