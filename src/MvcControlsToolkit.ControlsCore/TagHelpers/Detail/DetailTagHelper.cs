using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.Views;
using MvcControlsToolkit.Core.OptionsParsing;
using MvcControlsToolkit.ControlsCore;
namespace MvcControlsToolkit.Core.TagHelpers
{
    [HtmlTargetElement(TagName, Attributes = ForAttributeName + "," + TypeAttributeName)]
    public class DetailTagHelper : RowTypeTagHelper
    {
        private const string ForAttributeName = "asp-for";
        private const string TypeAttributeName = "type";
        private const string TagName = "detail-form";
        private const string ModelNullRowName = "model-null-row";
        private const string ModeName = "edit-mode";
        [HtmlAttributeName("id")]
        public string OverrideId { get; set; }
        [HtmlAttributeName("class")]
        public string CssClass { get; set; }
        [HtmlAttributeName("server-row-selection")]
        public Func<object, int> ServerRowSelection { get; set; }
        [HtmlAttributeName("client-row-selection")]
        public string ClientRowSelection { get; set; }
        [HtmlAttributeName("layout-template")]
        public string LayoutTemplate { get; set; }

        [HtmlAttributeName("edit-mode-default")]
        public bool ModeDefault { get; set; }

        [HtmlAttributeName(ModeName)]
        public ModelExplorer Mode { get; set; }

        [HtmlAttributeName("model-null-row-default")]
        public int ModelNullRowDefault { get; set; }

        [HtmlAttributeName(ModelNullRowName)]
        public ModelExplorer ModelNullRow { get; set; }

        [HtmlAttributeName("form-action")]
        public string FormAction { get; set; }

        [HtmlAttributeName("form-method")]
        public string FormMethod { get; set; }

        [HtmlAttributeName("asp-antiforgery")]
        public bool? Antiforgery { get; set; }

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }
        private string IdAttributeDotReplacement;
        private IHtmlHelper html;
        private IHttpContextAccessor httpAccessor;
        private IViewComponentHelper component;
        private IUrlHelperFactory urlHelperFactory;
        private IStringLocalizerFactory factory;

        public DetailTagHelper(Microsoft.Extensions.Options.IOptions<MvcViewOptions> optionsAccessor,
           IHtmlHelper html,
           IHttpContextAccessor httpAccessor, IViewComponentHelper component,
           IUrlHelperFactory urlHelperFactory,
           IStringLocalizerFactory factory)
        {
            IdAttributeDotReplacement = optionsAccessor.Value.HtmlHelperOptions.IdAttributeDotReplacement;
            this.html = html;
            this.httpAccessor = httpAccessor;
            this.component = component;
            this.urlHelperFactory = urlHelperFactory;
            this.factory = factory;
        }

        
        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            //estabilish context
            if (For == null) throw new ArgumentNullException(ForAttributeName);
            if (Mode != null && Mode.Metadata.UnderlyingOrModelType != typeof(bool))
                throw new ArgumentException(ModeName, string.Format(Resources.MustBeBool, ModeName));
            if (ModelNullRow != null && Mode.Metadata.UnderlyingOrModelType != typeof(int))
                throw new ArgumentException(ModelNullRowName, string.Format(Resources.MustBeInt, ModelNullRowName));
            string fullName = ViewContext.ViewData.TemplateInfo.GetFullHtmlFieldName(For.Name);
            string id = OverrideId ?? TagBuilder.CreateSanitizedId(fullName, IdAttributeDotReplacement);
            var currProvider = ViewContext.TagHelperProvider();
            var defaultTemplates = currProvider.GetDefaultTemplates(TagName);
            var ctx = new Core.Templates.ContextualizedHelpers(ViewContext, html, httpAccessor, component, urlHelperFactory, factory);
            //

            //get row definitions
            var nc = new Core.OptionsParsing.ReductionContext(Core.OptionsParsing.TagTokens.RowContainer, 0, defaultTemplates);
            context.SetChildrenReductionContext(nc);
            await output.GetChildContentAsync();
            var collector = new Core.OptionsParsing.RowContainerCollector(nc);
            var res = collector.Process(this, defaultTemplates) as Tuple<IList<Core.Templates.RowType>, IList<KeyValuePair<string, Microsoft.AspNetCore.Html.IHtmlContent>>>;
            var rows = res.Item1;
            var toolbars = res.Item2;
            //Prepare detail options
            var options = new Core.TagHelpers.Internals.GridOptions(rows, toolbars, GridType.Batch, id, fullName)
            {
                CssClass = CssClass,
                ErrorMessages = null,
                ClientRowSelection = ClientRowSelection,
                ServerRowSelection = ServerRowSelection,
                LayoutTemplate = defaultTemplates.GetLayoutTemplate(LayoutTemplate),
                SubTemplates = null
            };
            //finally process!
            await currProvider.GetTagProcessor(TagName)(context, output, this, options, ctx);
        }

    }
}
