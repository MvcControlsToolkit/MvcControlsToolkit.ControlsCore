using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers.Internals
{
    public class GridOptions: TagProcessorOptions
    {
        public GridOptions(IList<RowType> rows, IList<KeyValuePair<string, string>> toolbars, GridType type, string id, string fullName): base(rows)
        {
            Toolbars = toolbars;
            Type = type;
            Id = id;
            FullName = fullName;
        }
        public IList<KeyValuePair<string, string>> Toolbars { get; private set; }
        private IEnumerable<RowType> _ReverseRows=null;
        public IEnumerable<RowType> ReverseRows
        {
            get
            {
                if (_ReverseRows == null)
                {
                    _ReverseRows = Rows.Reverse();
                }
                return _ReverseRows;
            }
        }
        public GridErrorMessages ErrorMessages { get; set; }
        public GridType Type { get; private set; }
        public string CssClass { get; set; }
        public string Id { get; private set; }
        public string FullName { get; private set; }
        public Func<object, int> ServerRowSelection { get; set; }
        public string ClientRowSelection { get; set; }
        public Template<LayoutTemplateOptions> LayoutTemplate { get; set; }
        public IEnumerable<Template<LayoutTemplateOptions>> SubTemplates { get; set; }

        bool? _NeedsRunTimeTypeCheck = null;
        public bool NeedsRunTimeTypeCheck
        {
            get
            {
                if(!_NeedsRunTimeTypeCheck.HasValue)
                {
                    
                var refType = Rows[0].For.Metadata.ModelType;
                _NeedsRunTimeTypeCheck = Rows.Any(m => m.For.Metadata.ModelType != refType);
                    
                }
                return _NeedsRunTimeTypeCheck.Value;
            }
        }
        public RowType GetServerRow(object o)
        {
            if (ServerRowSelection != null) {
                var index = ServerRowSelection(o);
                if (index < 0) index = 0;
                else if (index >= Rows.Count) index = Rows.Count - 1;
                return Rows[index];
            }
            else
            {
                if (o == null || Rows.Count<=1) return Rows[0];
                foreach (var row in ReverseRows)
                {
                    if (row.TypeInfos.IsAssignableFrom(o.GetType())) return row;
                }
                return Rows[0];
            }
        }

    }

}
