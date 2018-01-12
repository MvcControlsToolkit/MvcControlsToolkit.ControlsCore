using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.Templates;
using System.Text.Encodings.Web;
using MvcControlsToolkit.Core.Views;

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
            
            int totalPages = tag.TotalPagesDefault.HasValue ? tag.TotalPagesDefault.Value: int.MaxValue;
            if (tag.TotalPages?.Model != null )
                totalPages = (int)tag.TotalPages.Model;
            if (totalPages < 0) totalPages = int.MaxValue;
            QueryDescription query = tag.Query?.Model as QueryDescription;
            int page = tag.CurrentPageDefault;
            if (query != null && query.Page > 0) page = (int)query.Page;
            if (tag.CurrentPage?.Model != null && tag.CurrentPage.Metadata.ModelType == typeof(int))
                page = (int)tag.CurrentPage.Model;
            string url = tag.Url?.Model as string ?? tag.UrlDefault;
            if(query != null)
            {
                url = query.AddToUrl(url ?? query?.AttachedTo?.BaseUrl, true);
                if (!url.Contains(tag.TakeUrlToken))
                {
                    string toAdd;
                    if (PagerMode.OData == tag.Mode)
                    {
                        toAdd = string.Format("$skip={0}&$top={1}", 
                            tag.SkipUrlToken, 
                            tag.TakeUrlToken);
                    }
                    else
                    {
                        toAdd = string.Format("page={0}&pagesize={1}",
                            tag.SkipUrlToken,
                            tag.TakeUrlToken);
                    }
                    if (url.Contains('?')) url = url + "&" + toAdd;
                    else url = url + "?" + toAdd;
                }
            }
            var layoutOptions = new DefaultServerPagerLayoutOptions
                (totalPages != 0 && page > 0,
                pageSize,
                tag.Mode,
                Math.Max(1, page - tag.MaxPages),
                page,
                Math.Min(page + tag.MaxPages, totalPages),
                url,
                tag.SkipUrlToken,
                tag.TakeUrlToken,
                tag.LocalizationType,
                tag.CssClass,
                options.LayoutTemplate,
                options.Operation
                );
            
            output.TagName = string.Empty;
            var fres = await options.LayoutTemplate.Invoke(tag.CurrentPage??tag.Query, layoutOptions, helpers);
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
