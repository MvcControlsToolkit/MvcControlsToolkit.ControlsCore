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
using System.Reflection;
using System.Globalization;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public static class TemplateExtensions
    {
        private static KeyValuePair<string, string>[] sortingRypes =
            { 
              new KeyValuePair<string, string>("asc", "asc"),
              new KeyValuePair<string, string>("desc", "desc")
            };
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
            return query.GetFilterCondition(expression.Metadata.ContainerType,
                expression.Name, place, ref filterObject);


        }
        public static Tuple<string, string> GroupSettings(this Column col, QueryDescription query)
        {
            if (col.For == null || query == null) return null;
            var expression = col.ColumnConnection != null && col.ColumnConnection.QueryDisplay ?
                 col.ColumnConnection.DisplayProperty :
                 col.For;
            return query.GetAggregationOperation(expression.Name);


        }
        private static bool canCount(Type t)
        {
            t = Nullable.GetUnderlyingType(t) ?? t;
            return t == typeof(long) || t == typeof(int);
        }
        public static IHtmlContent AggregationOperatorHtml(this Column col, Type destinationType, IStringLocalizer localizer, string selection, string selectCss = null)
        {
            if (!col.CanAggregate) return null;
            var expression = col.ColumnConnection != null  ?
                 col.ColumnConnection.DisplayProperty :
                 col.For;
            Type sourceType = expression.Metadata.ContainerType;
            Type propertyType = expression.Metadata.ModelType;
            if (destinationType == null) destinationType = sourceType;
            else if (!sourceType.GetTypeInfo().IsAssignableFrom(destinationType)) return null;
            var path = expression.Name;
            bool simple = path.IndexOf('.') < 0;
            string countDistinctAlias = null;
            var operations = QueryAttribute.AllowedAggregationsForType(propertyType, col.Queries.Value);
            if (!simple) operations = operations & (GroupingOptions.Group );
            else if((operations & GroupingOptions.CountDistinct) == GroupingOptions.CountDistinct)
            {
                var ti = destinationType.GetTypeInfo();
                var prop = ti.GetProperty(path + "Count");
                if (prop == null || !canCount(prop.PropertyType)){
                    prop = ti.GetProperty(path);
                }
                if (prop != null && canCount(prop.PropertyType)) countDistinctAlias = prop.Name;
            }
            if (countDistinctAlias == null) operations = operations & (~GroupingOptions.CountDistinct);
            if (operations == GroupingOptions.None) return null;
            var selections = QueryAttribute.GroupOptionsToEnum(operations);
            StringBuilder sb = new StringBuilder();
            sb.Append("<select name ='");
            sb.Append(path);
            sb.Append("' ");
            if (!string.IsNullOrEmpty(selectCss))
            {
                sb.Append("class='");
                sb.Append(selectCss);
                sb.Append("' ");
            }
            if (countDistinctAlias != null)
            {
                sb.Append("data-count-distinct='");
                sb.Append(countDistinctAlias);
                sb.Append("' ");
            }
            sb.Append(">");
            foreach (var option in selections)
            {
                sb.Append("<option value='");
                sb.Append(HtmlEncoder.Default.Encode(option.Key));
                sb.Append("' ");
                if (option.Key == selection)
                    sb.Append("selected ");
                sb.Append(">");
                sb.Append(HtmlEncoder.Default.Encode(localizer == null ? option.Value : localizer[option.Value]));
                sb.Append("</option>");
            }
            sb.Append("</select>");
            return new HtmlString(sb.ToString());
        }
        public static Tuple<HtmlString, bool> FilterOperatorHtml(this Column col, int place, IStringLocalizer localizer, string selection, string selectCss=null, string displayCss=null)
        {
            if (col.FilterClauses == null || place >= col.FilterClauses.Length || place < 0) return Tuple.Create(new HtmlString(string.Empty), false);
            if (displayCss == null) displayCss = selectCss;
            var options = col.FilterClauses[place];
            bool isBool = false;
            bool isEnum = false;
            if ((col.ColumnConnection != null && !col.ColumnConnection.QueryDisplay) ||
                (isEnum = col.For.Metadata.IsEnum))
            {
                options = options & (QueryOptions.Equal | QueryOptions.NotEqual);
            }
            else if (col.For.Metadata.UnderlyingOrModelType == typeof(bool)) isBool = true;
            var selections = QueryAttribute.QueryOptionsToEnum(options);
            var name =place.ToString(CultureInfo.InvariantCulture) +"."+ 
                (col.ColumnConnection != null && col.ColumnConnection.QueryDisplay ?
                 col.ColumnConnection.DisplayProperty.Name :
                 col.For.Name)+".Operator";
            if (selections.Count() == 1 && !isBool && !isEnum)
            {
                var res = selections.First();
                if (string.IsNullOrEmpty(displayCss))
                    return Tuple.Create(new HtmlString(string.Format("<span data-name ='{0}' data-value='{1}'>{2}</span>",
                        name, HtmlEncoder.Default.Encode(res.Key), HtmlEncoder.Default.Encode(localizer == null ? res.Value :localizer[res.Value]))), true);
                else
                    return Tuple.Create(new HtmlString(string.Format("<span data-name ='{0}' data-value='{1}' class='{3}'>{2}</span>",
                        name, HtmlEncoder.Default.Encode(res.Key), 
                        HtmlEncoder.Default.Encode(localizer == null ? res.Value : localizer[res.Value]),
                        displayCss)), true);
            }
            StringBuilder sb = new StringBuilder();
            sb.Append("<select name ='");
            sb.Append(name);
            sb.Append("' ");
            if (!string.IsNullOrEmpty(selectCss))
            {
                sb.Append("class='");
                sb.Append(selectCss);
                sb.Append("' ");
            }
            sb.Append(">");
            if(isBool || isEnum)
            {
                sb.Append("<option value=''>");
                sb.Append(HtmlEncoder.Default.Encode(localizer == null ? "none" : localizer["none"]));
                sb.Append("</option>");
            }
            foreach (var option in selections)
            {
                sb.Append("<option value='");
                sb.Append(HtmlEncoder.Default.Encode(option.Key));
                sb.Append("' ");
                if (option.Key == selection)
                    sb.Append("selected ");
                sb.Append(">");
                sb.Append(HtmlEncoder.Default.Encode(localizer == null ? option.Value : localizer[option.Value]));
                sb.Append("</option>");
            }
            sb.Append("</select>");
            return Tuple.Create(new HtmlString(sb.ToString()), false);
        }
        public static IEnumerable<KeyValuePair<string,string>> FieldsToSort(this RowType row)
        {
            return row.Columns.Where(m => m.CanSort).
                Select(m => new KeyValuePair<string, string>(
                    m.ColumnConnection != null && m.ColumnConnection.QueryDisplay ?
                        m.ColumnConnection.DisplayProperty.Name : m.For.Name,
                    m.ColumnTitle));
        }
        public static Tuple<string, bool>[] SelectedSorting(this RowType row, QueryDescription query)
        {
            if (query == null || query.Sorting == null || query.Sorting.Count == 0) return null;
            return query.Sorting.Select(m => Tuple.Create(m.Property, m.Down)).ToArray();
        }
        public static IHtmlContent SortingFieldHtml(this RowType row,
            int place,
            IStringLocalizer localizer,
            IEnumerable<KeyValuePair<string, string>> selections,
            Tuple<string, bool>[] selectedSorting,
            string selectCss)
        {
            string selection = null;
            if (selectedSorting != null && selectedSorting.Length > place) selection = selectedSorting[place].Item1;
            StringBuilder sb = new StringBuilder();
            sb.Append("<select name ='sorting_");
            sb.Append(place.ToString(CultureInfo.InvariantCulture));
            sb.Append("' ");
            if (!string.IsNullOrEmpty(selectCss))
            {
                sb.Append("class='");
                sb.Append(selectCss);
                sb.Append("' ");
            }
            sb.Append(">");
            sb.Append("<option value=''>");
            sb.Append(localizer == null ? "none" : localizer["none"]);
            sb.Append("</option>");
            foreach (var option in selections)
            {
                sb.Append("<option value='");
                sb.Append(HtmlEncoder.Default.Encode(option.Key));
                sb.Append("' ");
                if (option.Key == selection)
                    sb.Append("selected ");
                sb.Append(">");
                sb.Append(HtmlEncoder.Default.Encode(localizer == null ? option.Value : localizer[option.Value]));
                sb.Append("</option>");
            }
            sb.Append("</select>");
            return new HtmlString(sb.ToString());
        }
        public static IHtmlContent SortingTypedHtml(this RowType row,
            int place,
            IStringLocalizer localizer,
            Tuple<string, bool>[] selectedSorting,
            string selectCss)
        {
            string selection = null;
            if (selectedSorting != null && selectedSorting.Length > place) selection = selectedSorting[place].Item2 ?
                    "desc" : "asc";
            else selection = "asc";
            StringBuilder sb = new StringBuilder();
            sb.Append("<select name ='sorting.type_");
            sb.Append(place.ToString(CultureInfo.InvariantCulture));
            sb.Append("' ");
            if (!string.IsNullOrEmpty(selectCss))
            {
                sb.Append("class='");
                sb.Append(selectCss);
                sb.Append("' ");
            }
            sb.Append(">");
            sb.Append("<option value=''>");
            sb.Append(localizer == null ? "none" : localizer["none"]);
            sb.Append("</option>");
            foreach (var option in sortingRypes)
            {
                sb.Append("<option value='");
                sb.Append(HtmlEncoder.Default.Encode(option.Key));
                sb.Append("' ");
                if (option.Key == selection)
                    sb.Append("selected ");
                sb.Append(">");
                sb.Append(HtmlEncoder.Default.Encode(localizer == null ? option.Value : localizer[option.Value]));
                sb.Append("</option>");
            }
            sb.Append("</select>");
            return new HtmlString(sb.ToString());
        }
        public static bool RowToRender(this RowType row, QueryDescription query, Type groupingType)
        {
            if (query == null || query.Grouping == null || query.Grouping.Keys == null || query.Grouping.Keys.Count ==0)  return row.For.Metadata.ModelType != groupingType;
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
