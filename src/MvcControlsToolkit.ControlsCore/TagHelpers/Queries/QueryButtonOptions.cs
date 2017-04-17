using Microsoft.AspNetCore.Mvc.ViewFeatures;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class QueryButtonOptions: TagProcessorOptions
    {
        public QueryButtonOptions() : base(null)
        {
        }
        public QueryWindowType Type { get; set; }
        public ModelExpression CollectionFor { get; set; }
        public ModelExpression For { get; set; }
        public Template<LayoutTemplateOptions> ButtonTemplate { get; set; }
        public string ButtonText { get; set; }
        public string ButtonTitle { get; set; }
        public string ButtonIcon { get; set; }
        public ModelExpression TotalPagesContainer { get; set; }
        public string Url { get; set; }
        public string AjaxId { get; set; }
        public string ButtonCss { get; set; }
    }
}
