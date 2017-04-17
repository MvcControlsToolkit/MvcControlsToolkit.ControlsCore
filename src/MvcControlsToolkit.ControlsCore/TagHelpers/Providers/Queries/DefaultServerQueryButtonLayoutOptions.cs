using Microsoft.AspNetCore.Html;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
    public class DefaultServerQueryButtonLayoutOptions: LayoutTemplateOptions
    {
       
        public IHtmlContent OperationAttributes { get; protected set; }
        public string ButtonText { get; protected set; }
        public string ButtonTitle { get; protected set; }
        public string ButtonIcon { get; protected set; }
        public string QueryName { get; protected set; }
        public QueryDescription Query { get; protected set; }
        public string ButtonCss { get; protected set; }
        public QueryWindowType Type { get; protected set; }

        public DefaultServerQueryButtonLayoutOptions(Template<LayoutTemplateOptions> template,
           IHtmlContent operationAttributes,
           string queryName,
           QueryDescription query,
           string buttonText,
           string buttonTitle,
           string buttonIcon,
           string buttonCss,
           QueryWindowType type

           ) :base(null, null, template, null, null)
        {
            OperationAttributes = operationAttributes;
            QueryName = queryName;
            Query = query;
            ButtonText = buttonText;
            ButtonTitle = buttonTitle;
            ButtonCss = buttonCss;this.Type = type;
        }
    }
}
