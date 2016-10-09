using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcControlsToolkit.Core.TagHelpers.Internals
{
    public class PagerOptions: TagProcessorOptions
    {
        public Templates.Template<Templates.LayoutTemplateOptions> LayoutTemplate { get; private set; }
        public string Operation { get; private set; }
        public PagerOptions(Templates.Template<Templates.LayoutTemplateOptions> layoutTemplate, string operation = null) : base(null)
        {
            LayoutTemplate = layoutTemplate;
            Operation = operation;
        }
    }
}
