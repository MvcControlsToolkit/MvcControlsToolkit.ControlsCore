using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.ModelBinding.DerivedClasses;
using MvcControlsToolkit.Core.TagHelpers.Internals;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
    public class DefaultServerGridProcessor
    {
        private static GridErrorMessages defaultMessages = new GridErrorMessages
        {
            AddFailed = "add operation failed",
            DeleteConfirmation = "are you sure you want to delete this item?",
            DeleteFailed= "delete operation failed",
            ModificationFailed = "modification failed",
            ShowDetailFailed= "operation failed"
        };
        TagHelperContext context; TagHelperOutput output; GridTagHelper tag;
        GridOptions options; ContextualizedHelpers helpers;
        string basePrefix;
        public DefaultServerGridProcessor(TagHelperContext context, TagHelperOutput output, GridTagHelper tag, GridOptions options, ContextualizedHelpers helpers)
        {
            this.context = context; this.output = output; this.tag = tag;
            this.options = options; this.helpers = helpers;
            basePrefix = tag.For.Name;
            AdjustColumns();
        }
        public static IHtmlContent RenderHiddenFields(IEnumerable<Column> columns, ContextualizedHelpers helpers, object rowModel)
        {
            StringBuilder sb = new StringBuilder();
            if (columns != null)
            {
                foreach (var col in columns)
                {
                    var o = col.For.Metadata.PropertyGetter(rowModel);
                    sb.Append(helpers.Html.Hidden(col.For.Name, o, null));
                }
                var rowPrefix = helpers.Context.ViewData.TemplateInfo.HtmlFieldPrefix;
                if(rowPrefix.Length>0 && rowPrefix[rowPrefix.Length - 1] == ']')
                {
                    var index = rowPrefix.LastIndexOf('[');
                    sb.Append(helpers.Html.Hidden(combinePrefixes(rowPrefix.Substring(0, index), "index"), 
                        rowPrefix.Substring(index+1, rowPrefix.Length-index-2), null));
                }
            }
            return new HtmlString(sb.ToString());
        }
        protected static string combinePrefixes(string p1, string p2)
        {
            return (string.IsNullOrEmpty(p1) ? p2 : (string.IsNullOrEmpty(p2) ? p1 : p1 + "." + p2));

        }
        protected string RowPrefix(int i, RowType row)
        {
            return string.Format("{0}[{1}]", basePrefix, i);
            
        }
        protected void AdjustColumns()
        {
            if (!options.NeedsRunTimeTypeCheck) return;
            var typeInfos=tag.For.Metadata.ElementType.GetTypeInfo();
            foreach (var row in options.Rows)
            {
                foreach(var col in row.Columns)
                {
                    if (col.AdditionalPrefix != null) continue;
                    if (typeInfos.GetProperty(col.For.Metadata.PropertyName) == null)
                    {
                        col.AdditionalPrefix=DerivedClassesRegister.GetCodeFromType(row.For.Metadata.ModelType);
                    }
                    else col.AdditionalPrefix = string.Empty;
                }
            }
        }
        public async Task Process()
        {
            //create content
            IHtmlContent res = null;
            var model = tag.For.Model as IEnumerable;
            if (model == null) res = new HtmlString(string.Empty);
            else
            {
                int i = 0;
                StringBuilder sb = new StringBuilder();
                 
                foreach (var row in model)
                {
                    var rowType = options.GetServerRow(row);
                    if (rowType == null) continue;
                    if (options.Type == GridType.Immediate)
                        sb.Append(await rowType.InvokeDisplay(row, RowPrefix(i, rowType), helpers));
                    else
                        sb.Append(await rowType.InvokeEdit(row, RowPrefix(i, rowType), helpers));
                    i++;
                }
                res = new HtmlString(sb.ToString());
            }
            //

            //Create Layout options
            var layoutOptions = new DefaultServerGridLayoutOptions(
                helpers,
                options.Rows,
                options.Toolbars,
                options.LayoutTemplate,
                options.SubTemplates,
                res,
                options.Type,
                options.Id,
                options.FullName,
                options.ErrorMessages??defaultMessages,
                options.CssClass,
                tag.Caption,
                tag.LocalizationType);
            //

            //Invoke Layout
            var fres = await options.LayoutTemplate.Invoke(tag.For, layoutOptions, helpers);
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(fres);

        }
    }
}
