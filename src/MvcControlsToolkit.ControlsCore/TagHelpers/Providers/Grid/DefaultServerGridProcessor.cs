﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Encodings.Web;
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
            StringWriter sb = new StringWriter();
            if (columns != null)
            {
                foreach (var col in columns)
                {
                    var o = col.For.Metadata.PropertyGetter(rowModel);
                    helpers.Html.Hidden(combinePrefixes(col.AdditionalPrefix, col.For.Name), o??string.Empty, null).WriteTo(sb, HtmlEncoder.Default);
                }
                var rowPrefix = helpers.Context.ViewData.TemplateInfo.HtmlFieldPrefix;
                if(rowPrefix.Length>0 && rowPrefix[rowPrefix.Length - 1] == ']')
                {
                    var index = rowPrefix.LastIndexOf('[');
                    helpers.Context.ViewData.TemplateInfo.HtmlFieldPrefix=string.Empty;
                    helpers.Html.Hidden(combinePrefixes(rowPrefix.Substring(0, index), "index"), 
                        rowPrefix.Substring(index+1, rowPrefix.Length-index-2), null).WriteTo(sb, HtmlEncoder.Default);
                    helpers.Context.ViewData.TemplateInfo.HtmlFieldPrefix = rowPrefix;
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
                foreach(var col in row.VisibleAndHiddenColumns)
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
                var sb = new StringWriter();
                 
                foreach (var row in model)
                {
                    var rowType = options.GetServerRow(row);
                    if (rowType == null) continue;
                    if (options.Type == GridType.Immediate)
                        (await rowType.InvokeDisplay(row, RowPrefix(i, rowType), helpers)).WriteTo(sb, HtmlEncoder.Default);
                    else
                        (await rowType.InvokeEdit(row, RowPrefix(i, rowType), helpers)).WriteTo(sb, HtmlEncoder.Default);
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
                tag.LocalizationType,
                tag.QueryFor);
            //

            //Invoke Layout
            var fres = await options.LayoutTemplate.Invoke(tag.For, layoutOptions, helpers);
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(fres);

        }
    }
}
