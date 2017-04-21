using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
    public class DefaultServerQueryWindowProcessor
    {
        QueryWindowOptions options;
        ContextualizedHelpers helpers;
        DefaultServerQueryWindowLayoutOptions layoutOptions;
        public DefaultServerQueryWindowProcessor(QueryWindowOptions options, ContextualizedHelpers helpers)
        {
            this.options = options;
            this.helpers = helpers;
            layoutOptions = new DefaultServerQueryWindowLayoutOptions(
                options.Rows,
                options.Toolbars,
                options.LayoutTemplate,
                helpers.Context.ViewData.GetFullHtmlFieldName(options.For.Name),
                options.Header,
                options.GroupingOutput
                );
        }

        public async Task ProcessFilter()
        {
            layoutOptions.SetParameters(new HtmlString(string.Empty),
                StandardButtons.FilterWindow,
                "server-query-filter",
                LayoutStandardPlaces.HeaderFilter,
                LayoutStandardPlaces.FooterFilter,
                LayoutStandardPlaces.SubmitBarFilter,
                layoutOptions.OperationParameters+"_filter"
                );
            options.Result = (await options.LayoutTemplate.Invoke(options.For, layoutOptions, helpers));
        }
        public async Task ProcessSorting()
        {
            layoutOptions.SetParameters(new HtmlString(string.Empty),
                StandardButtons.SortWindow,
                "server-query-sorting",
                LayoutStandardPlaces.HeaderSorting,
                LayoutStandardPlaces.FooterSorting,
                LayoutStandardPlaces.SubmitBarSorting,
                layoutOptions.OperationParameters + "_sorting"
                );
            options.Result = (await options.LayoutTemplate.Invoke(options.For, layoutOptions, helpers));
        }
        public async Task ProcessGrouping()
        {
            layoutOptions.SetParameters(new HtmlString(string.Empty),
                StandardButtons.GroupWindow,
                "server-query-grouping",
                LayoutStandardPlaces.HeaderGrouping,
                LayoutStandardPlaces.FooterGrouping,
                LayoutStandardPlaces.SubmitBarGrouping,
                layoutOptions.OperationParameters + "_grouping"
                );
            options.Result = (await options.LayoutTemplate.Invoke(options.For, layoutOptions, helpers));
        }
    }
}
