using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.TagHelpers;

namespace MvcControlsToolkit.ControlsCore.TagHelpers
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
    }
}
