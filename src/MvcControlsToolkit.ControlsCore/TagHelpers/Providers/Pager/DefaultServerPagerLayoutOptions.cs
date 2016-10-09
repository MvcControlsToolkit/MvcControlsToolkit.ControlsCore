using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Localization;
using Microsoft.AspNetCore.Html;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class DefaultServerPagerLayoutOptions: Templates.LayoutTemplateOptions
    {
        public bool HasPages { get; private set; }
        public int PageSize { get; private set; }
        public PagerMode Mode { get; private set; }
        public int PagesBeforeStart { get; private set; }
        public int CurrentPage { get; private set; }
        public int PagesAfterStop { get; private set; }
        public string CssClass { get; private set; }
        public Type LocalizerType { get; private set; }
        private string skipToken;
        private string takeToken;
        private string url;
        private string operation;
        public DefaultServerPagerLayoutOptions(
            bool hasPages,
            int pageSize,
            PagerMode mode,
            int pagesBeforeStart,
            int currentPage,
            int pagesAfterStop,
            string url, string skipToken, string takeToken,
            Type localizerType,
            string cssClass,
            Templates.Template<Templates.LayoutTemplateOptions> layoutTemplate,
            string operation
            ) :base(null, null, layoutTemplate, null, null)
        {
            HasPages = hasPages;
            PagesBeforeStart = pagesBeforeStart;
            CurrentPage = currentPage;
            PagesAfterStop = pagesAfterStop;
            Mode = mode;
            PageSize = pageSize;
            this.skipToken = skipToken;
            this.takeToken = takeToken;
            this.url = url;
            CssClass = cssClass;
            LocalizerType = localizerType;
            this.operation = operation;
        }
        public string PageUrl(int i)
        {
            if (i < PagesBeforeStart || i > PagesAfterStop) return "javascript:void(0)";
            var res = url.Replace(skipToken, (Mode == PagerMode.OData ? PageSize * (i - 1) : i).ToString(CultureInfo.InvariantCulture));
            if(takeToken != null) res= res.Replace(takeToken, PageSize.ToString(CultureInfo.InvariantCulture));
            return res;
        }
        public HtmlString Operation(int i)
        {
            if (i < PagesBeforeStart || i > PagesAfterStop) return new HtmlString(string.Empty);
            return new HtmlString(operation ?? string.Empty);
        }  
        public bool HasPagesBefore
        {
            get
            {
                return
                    PagesBeforeStart < CurrentPage;
            }
        }
        public bool HasPagesAfter
        {
            get
            {
                return
                    PagesAfterStop > CurrentPage;
            }
        }
        public Func<string, string> GetLocalizerFunction(IStringLocalizerFactory factory)
        {
            if (LocalizerType != null)
            {
                var localizer = factory.Create(LocalizerType);
                return x => localizer[x];
            }
            else return x => x;
        }
    }
}
