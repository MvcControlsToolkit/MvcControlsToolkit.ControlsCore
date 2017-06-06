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
    public class DefaultServerDetailProcessor
    {
        TagHelperContext context; TagHelperOutput output; DetailTagHelper tag;
        GridOptions options; ContextualizedHelpers helpers;
        string basePrefix;
        public DefaultServerDetailProcessor(TagHelperContext context, TagHelperOutput output, DetailTagHelper tag, GridOptions options, ContextualizedHelpers helpers)
        {
            this.context = context; this.output = output; this.tag = tag;
            this.options = options; this.helpers = helpers;
            basePrefix = tag.For.Name;
            if (basePrefix == "Model")
                basePrefix = string.Empty;
            AdjustColumns();
        }
        protected void AdjustColumns()
        {
            if (!options.NeedsRunTimeTypeCheck) return;
            var typeInfos = tag.For.Metadata.ModelType.GetTypeInfo();
            foreach (var row in options.Rows)
            {
                foreach (var col in row.Columns)
                {
                    if (col.AdditionalPrefix != null) continue;
                    if (typeInfos.GetProperty(col.For.Metadata.PropertyName) == null)
                    {
                        col.AdditionalPrefix = DerivedClassesRegister.GetCodeFromType(row.For.Metadata.ModelType);
                    }
                    else col.AdditionalPrefix = string.Empty;
                }
            }
        }
        public async Task Process()
        {
            //Create content
            IHtmlContent res = null;
            var model = tag.For.Model;
            bool mode = tag.ModeDefault;
            if (tag.Mode != null && tag.Mode.Model != null)
                mode = (bool)tag.Mode.Model;
            RowType rowType;
            if (model == null)
            {
                int rowIndex = tag.ModelNullRowDefault;
                if (tag.ModelNullRow != null && tag.ModelNullRow.Model != null)
                    rowIndex = (int)tag.ModelNullRow.Model;
                rowType = options.Rows[rowIndex];
            }
            else rowType = options.GetServerRow(model);
            if (mode) res = await rowType.InvokeEdit(model, basePrefix, helpers);
            else res = await rowType.InvokeDisplay(model, basePrefix, helpers);

            //Create Layout options
            var layoutOptions = new DefaultServerDetailLayoutOptions(
                helpers, 
                options.Rows, 
                options.Toolbars?? new List<KeyValuePair<string, string>>(),
                options.LayoutTemplate,
                null,
                res,
                options.Id,
                options.FullName,
                options.CssClass,
                tag.LocalizationType,
                mode,
                tag.FormAction,
                tag.FormMethod,
                tag.Antiforgery,
                tag.NoSubmit
                );
            //Invoke Layout
            var fres = await options.LayoutTemplate.Invoke(tag.For, layoutOptions, helpers);
            output.TagName = string.Empty;
            output.Content.SetHtmlContent(fres);
        }
    }
}
