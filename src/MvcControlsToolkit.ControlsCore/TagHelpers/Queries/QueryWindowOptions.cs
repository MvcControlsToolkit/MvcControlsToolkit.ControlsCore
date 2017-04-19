using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class QueryWindowOptions: TagProcessorOptions
    {
        
        public QueryWindowOptions(IList<RowType> rows, IList<KeyValuePair<string, string>> toolbars) : base(rows)
        {
            this.Toolbars = toolbars;
        }
        public IList<KeyValuePair<string, string>> Toolbars { get; protected set; }
        public Type GroupingOutput { get; set; }
        public ModelExpression For { get; set; }
        public ModelExpression CollectionFor { get; set; }
        public ModelExplorer SourceFor { get; set; }
        public ModelExplorer ClientCustomProcessorFor { get; set; }
        public Template<LayoutTemplateOptions> LayoutTemplate { get; set; }
        public string Header { get; set; }
        public ModelExpression TotalPagesContainer { get; set; }
        public void UpdateRows(IList<RowType> rows, IList<KeyValuePair<string, string>> toolbars)
        {
            Rows = rows;
            Toolbars = toolbars;
        } 
        public IHtmlContent Result { get; set; }
    }
}
