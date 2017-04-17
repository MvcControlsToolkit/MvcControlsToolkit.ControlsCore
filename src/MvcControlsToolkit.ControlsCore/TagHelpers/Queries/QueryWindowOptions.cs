using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class QueryWindowOptions: TagProcessorOptions
    {
        public QueryWindowOptions(IList<RowType> rows) : base(rows)
        {
        }

        public Type GroupingOutput { get; set; }
        public ModelExpression For { get; set; }
        public ModelExpression CollectionFor { get; set; }
        public ModelExplorer SourceFor { get; set; }
        public string Source { get; set; }
        public ModelExplorer ClientCustomProcessorFor { get; set; }
        public string LayoutTemplate { get; set; }
        public string Header { get; set; }
        public ModelExpression TotalPagesContainer { get; set; }
        public void UpdateRows(IList<RowType> rows)
        {
            Rows = rows;
        } 
        public string Result { get; set; }
    }
}
