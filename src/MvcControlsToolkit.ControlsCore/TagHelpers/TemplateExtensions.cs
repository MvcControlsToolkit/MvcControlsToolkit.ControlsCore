using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.DataAnnotations;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.Core.Views;
using System.Text.Encodings.Web;
using System.Text;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public static class TemplateExtensions
    {
        public static IEnumerable<Column> ColumnsToRender(this RowType row, QueryDescription query)
        {
            if (query == null) return row.Columns;
            return row.Columns.Where(m => m.For == null || query.CompatibleProperty(m.For.Name)); 
        }
        public static string FilterSettings(this Column col, int place, QueryDescription query, ref object filterObject)
        {
            if (col.For == null || query == null) return null;
            var expression = col.ColumnConnection != null && col.ColumnConnection.QueryDisplay ?
                 col.ColumnConnection.DisplayProperty :
                 col.For;
            return query.GetFilterCondition(expression.Metadata.ModelType,
                expression.Name, place, ref filterObject);


        }
        public static Tuple<HtmlString, bool> FilterOperatorHtml(this Column col, int place, IStringLocalizer localizer, string selection, string selectCss=null, string displayCss=null)
        {
            if (col.FilterClauses == null || place >= col.FilterClauses.Length || place < 0) return new HtmlString(string.Empty);
            if (displayCss == null) displayCss = selectCss;
            var selections = QueryAttribute.QueryOptionsToEnum(col.FilterClauses[place]);
            var name = (col.ColumnConnection != null && col.ColumnConnection.QueryDisplay ?
                 col.ColumnConnection.DisplayProperty.Name :
                 col.For.Name)+".operator";
            if (selections.Count() == 1)
            {
                var res = selections.First();
                if (string.IsNullOrEmpty(displayCss))
                    return Tuple.Create(new HtmlString(string.Format("<span data-name ='{0}' data-value='{1}'>{2}</span>",
                        name, HtmlEncoder.Default.Encode(res.Key), HtmlEncoder.Default.Encode(localizer[res.Value]))), true);
                else
                    return Tuple.Create(new HtmlString(string.Format("<span data-name ='{0}' data-value='{1}' class='{3}'>{2}</span>",
                        name, HtmlEncoder.Default.Encode(res.Key), 
                        HtmlEncoder.Default.Encode(localizer[res.Value]),
                        displayCss)), true);
            }
            StringBuilder sb = new StringBuilder();
            sb.Append("<select name ='");
            sb.Append(name);
            sb.Append("' ");
            if (!string.IsNullOrEmpty(selectCss))
            {
                sb.Append("css='");
                sb.Append(selectCss);
                sb.Append("' ");
            }
            sb.Append(">");
            foreach(var option in selections)
            {
                sb.Append("<option value='");
                sb.Append(HtmlEncoder.Default.Encode(option.Key));
                sb.Append("' ");
                if (option.Key == selection)
                    sb.Append("selected ");
                sb.Append(">");
                sb.Append(HtmlEncoder.Default.Encode(localizer[option.Value]));
                sb.Append("</option>");
            }
            sb.Append("</select>");
            return Tuple.Create(new HtmlString(sb.ToString()), false);
        }
        public static bool RowToRender(this RowType row, QueryDescription query, Type groupingType)
        {
            if (query == null || query.Grouping == null || query.Grouping.Keys == null || query.Grouping.Keys.Count ==0) return true;
            return row.For.Metadata.ModelType==groupingType;
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
