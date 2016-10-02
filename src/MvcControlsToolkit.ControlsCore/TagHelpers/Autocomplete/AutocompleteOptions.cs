using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace MvcControlsToolkit.Core.TagHelpers.Internals
{
    public class AutocompleteOptions: TagProcessorOptions
    {
        public AutocompleteOptions():base(null)
        {

        }
        public IHtmlGenerator Generator { get; set; }
        public Func<string, string > PropertyResolver { get; set; }
    }
}
