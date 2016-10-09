using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Text.Encodings.Web;

namespace MvcControlsToolkit.Core.TagHelpers
{
    [HtmlTargetElement(TagName, Attributes = NameName, TagStructure = TagStructure.NormalOrSelfClosing)]
    public class CopyHtmlTagHelper : TagHelper
    {
        private const string TagName = "copy-html";
        private const string NameName = "name";
        [HtmlAttributeName(NameName)]
        public string Name { get; set; }
        [HtmlAttributeName("remove")]
        public bool Remove { get; set; }

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }
        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (string.IsNullOrEmpty(Name))
                throw new ArgumentNullException(NameName);
            output.TagName = string.Empty;
            var fres = await output.GetChildContentAsync(true);
            var iores = new System.IO.StringWriter();
            fres.WriteTo(iores, HtmlEncoder.Default);
            var res = iores.ToString();
            ViewContext.ViewData["copied-html-" + Name]= res;

            output.Content.SetHtmlContent( Remove ? string.Empty : res);
        }
    }
    [HtmlTargetElement(TagName, Attributes = NameName, TagStructure = TagStructure.WithoutEndTag)]
    public class PastHtmlTagHelper : TagHelper
    {
        private const string TagName = "paste-html";
        private const string NameName = "name";
        [HtmlAttributeName(NameName)]
        public string Name { get; set; }

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }
        public override  void Process(TagHelperContext context, TagHelperOutput output)
        {
            if (string.IsNullOrEmpty(Name))
                throw new ArgumentNullException(NameName);
            output.TagName = string.Empty;
            var res = ViewContext.ViewData["copied-html-" + Name] as string;
            
            output.Content.SetHtmlContent(res);
        }
    }
}
