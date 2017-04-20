using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public static class TemplateExtensions
    {
        public static IEnumerable<Column> ColumnsToRender(this RowType row, QueryDescription query)
        {
            if (query == null) return row.Columns;
            return row.Columns.Where(m => m.For == null || query.CompatibleProperty(m.For.Name)); 
        }
        public static bool RowToRender(this RowType row, QueryDescription query)
        {
            if (query == null || query.Grouping == null || query.Grouping.Keys == null || query.Grouping.Keys.Count ==0) return true;
            return row.GroupingRow;
        }
        public static Functionalities RequiredFunctionalitiesExt(this RowType row, IPrincipal user, QueryDescription query)
        {
            var res = row.RequiredFunctionalities(user);
            if (query == null || query.Grouping == null || query.Grouping.Keys == null || query.Grouping.Keys.Count == 0) return res;
            return res & Functionalities.ShowDetail;
        }
        public static bool MustAddButtonColumn(this RowType row, ContextualizedHelpers helpers, QueryDescription query, bool editOnly = false)
        {
            return !row.CustomButtons && ((row.RequiredFunctionalities(helpers.User) & (editOnly ? Functionalities.EditOnlyHasRowButtons : Functionalities.HasRowButtons)) != 0);
        }
        public static int VisibleColumns(this RowType row, ContextualizedHelpers helpers, QueryDescription query, bool editOnly = false)
        {
            return row.MustAddButtonColumn(helpers, query, editOnly) ? row.ColumnsCount + 1 : row.ColumnsCount;
        }
    }
}
