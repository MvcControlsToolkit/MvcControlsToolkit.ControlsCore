using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class DefaultServerQueryWindowLayoutOptions: LayoutTemplateOptions
    {
        public Type GroupingOutput { get; protected set; }
        public string Header { get; protected set; }
        public string OperationParameters { get; protected set; }
        public StandardButtons SubmitButton { get; protected set; }
        public string HeaderBarName { get; protected set; }
        public string FooterBarName { get; protected set; }
        public string SubmitBarName { get; protected set; }
        public string Name { get; protected set; }
        public string ControlType { get; protected set; }

        public DefaultServerQueryWindowLayoutOptions(
            IList<RowType> rows, 
            IList<KeyValuePair<string, string>> 
            toolbars, Template<LayoutTemplateOptions> layoutTemplate, 
            string operationParameters,
            string header, Type groupingOutput
             ) : 
            base(rows, toolbars, layoutTemplate, null, null)
        {
            OperationParameters = operationParameters;
            Header = header;
            GroupingOutput = groupingOutput;
            

        }
        public void SetParameters(IHtmlContent content,
            StandardButtons submitButton,
            string controlType,
            string headerBarName,
            string footerBarName,
            string submitBarName,
            string name)
        {
            MainContent = content;
            SubmitButton = submitButton;
            ControlType = controlType;
            HeaderBarName = headerBarName;
            FooterBarName = footerBarName;
            SubmitButton = submitButton;
            Name = name;
        }
    }
}
