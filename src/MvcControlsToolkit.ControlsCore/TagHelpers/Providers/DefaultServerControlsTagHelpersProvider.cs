using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.TagHelpers.Internals;
using MvcControlsToolkit.Core.Templates;
using System.Globalization;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.Core.TagHelpers.Providers
{
     
    public class DefaultServerControlsTagHelpersProvider : ITagHelpersProvider
    {
        private const string buttonTemplate = @"
<button data-operation='{0} {1}' class='btn {2}' aria-label='{3}' title='{3}' type='button' {5}>
<span class='glyphicon {4}' aria-hidden='true'></span>
</button>";
        private const string buttonTemplateWithText = @"
<button data-operation='{0} {1}' class='btn {2}' title='{3}' type='button' {5}>
<span class='glyphicon {4}' aria-hidden='true'></span> {3}
</button>";
        private const string buttonTemplateSubmit = @"
<button  class='btn {0}' aria-label='{1}' title='{1}' type='submit'>
<span class='glyphicon {2}' aria-hidden='true'></span>
</button>";
        private const string buttonTemplateWithTextSubmit = @"
<button  class='btn {0}' title='{1}' type='submit'>
<span class='glyphicon {2}' aria-hidden='true'></span> {1}
</button>";
        protected class ButtonProperties
        {
            public string ShowText;
            public string OperationName;
            public string IconClass;
        }
        //workaround forr issue https://github.com/aspnet/Mvc/issues/2430
        private static string getEnumDisplayName(Type type, string o, IHtmlHelper h)
        {
            string displayName = null;
            
            foreach (SelectListItem item in h.GetEnumSelectList(type))
            {
                if (o == item.Value)
                {
                    displayName = item.Text ?? item.Value;
                }
            }
            return displayName;
        }
        protected static IDictionary<string, Func<TagHelperContext, TagHelperOutput, TagHelper, TagProcessorOptions, ContextualizedHelpers, Task>> allTagProcessors =
            new Dictionary<string, Func<TagHelperContext, TagHelperOutput, TagHelper, TagProcessorOptions, ContextualizedHelpers, Task>>();
        protected static IDictionary<string, DefaultTemplates> allTagDefaultTemplates = new Dictionary<string, DefaultTemplates>();
        protected static IDictionary<StandardButtons, ButtonProperties> allButtonProperties = new Dictionary<StandardButtons, ButtonProperties>();
        protected static Template<Column> basicDisplayColumn = new Template<Column>(TemplateType.Function,
                    (o, col, helpers) =>
                    {
                        if (col.For.Metadata.IsNullableValueType && col.For.Metadata.UnderlyingOrModelType == typeof(bool))
                            return new HtmlString(
                                o == null || !((bool)o) ?
                                "<input class='check-box' disabled='disabled' type='checkbox'>"
                                :
                                "<input class='check-box' disabled='disabled' type='checkbox' checked>"
                                );
                        else if (o == null)
                            return new HtmlString(helpers.Html.Encode(col.NullDisplayText ?? string.Empty));
                        else if (o is IFormattable && !string.IsNullOrEmpty(col.DisplayFormat))
                            return new HtmlString(helpers.Html.Encode(string.Format(CultureInfo.CurrentCulture, col.DisplayFormat, (o as IFormattable)) ));
                        else if (col.For.Metadata.IsEnum) return new HtmlString(getEnumDisplayName(col.For.Metadata.UnderlyingOrModelType, ((int)o).ToString(CultureInfo.CurrentCulture), helpers.Html));
                        return helpers.Html.Display(helpers.Html.CurrentScope<object>().FatherPrefix.CleanPrefix());
                    }, null);
        static DefaultServerControlsTagHelpersProvider()
        {
            allTagProcessors["grid-batch"] =
            allTagProcessors["grid-immediate"] =
                (tc, to, th, tpo, ctx) =>
                {
                    return new DefaultServerGridProcessor(tc, to, th as GridTagHelper, tpo as GridOptions, ctx).Process();
                };
            allTagDefaultTemplates["grid-immediate"] = new DefaultTemplates(
                false,
                basicDisplayColumn,
                new Template<Column>(TemplateType.Partial, "DefaultColumnEditTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultGridRowDisplayTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultGridRowEditTemplate"),
                new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultGridLayoutTemplate"),
                new Template<LayoutTemplateOptions>[] { new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultGridHeaderTemplate") },
                DefaultServerGridProcessor.RenderHiddenFields
                );
            allTagDefaultTemplates["grid-batch"] = new DefaultTemplates(
                false,
                basicDisplayColumn,
                new Template<Column>(TemplateType.Partial, "DefaultColumnEditTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultGridRowDisplayTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultEditOnlyGridRowTemplate"),
                new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultGridLayoutTemplate"),
                new Template<LayoutTemplateOptions>[] { new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultEditOnlyGridHeaderTemplate") },
                DefaultServerGridProcessor.RenderHiddenFields
                );

            allTagProcessors["detail-form"] =
                (tc, to, th, tpo, ctx) =>
                {
                    return new DefaultServerDetailProcessor(tc, to, th as DetailTagHelper, tpo as GridOptions, ctx).Process();
                };
            allTagDefaultTemplates["detail-form"] = new DefaultTemplates(
                true,
                new Template<Column>(TemplateType.Partial, "DefaultDetailColumnDisplayTemplate"),
                new Template<Column>(TemplateType.Partial, "DefaultDetailColumnEditTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultDetailRowDisplayTemplate"),
                new Template<RowType>(TemplateType.Partial, "DefaultDetailRowEditTemplate"),
                new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultDetailLayoutTemplate"),
                null,
                DefaultServerGridProcessor.RenderHiddenFields
                );
            allTagProcessors["autocomplete"] =
                (tc, to, th, tpo, ctx) =>
                {
                    return new DefaultServerAutocompleteProcessor(tc, to, th as AutocompleteTagHelper, tpo as AutocompleteOptions).Process();
                };
            allTagProcessors["pager"] =
                (tc, to, th, tpo, ctx) =>
                {
                    return new DefaultServerPagerProcessor(tc, to, th as PagerTagHelper, tpo as PagerOptions, ctx).Process();
                };
            allTagDefaultTemplates["pager"] = new DefaultTemplates(
                true,
                null,
                null,
                null,
                null,
                new Template<LayoutTemplateOptions>(TemplateType.Partial, "DefaultPagerTemplate"),
                null,
                null
                );
            DefineButtonProperies();
        }
        protected static void DefineButtonProperies()
        {
            allButtonProperties.Add(StandardButtons.AddAfter, 
                new ButtonProperties {
                    IconClass= "glyphicon-plus",
                    OperationName="add after",
                    ShowText="add after"
                });
            allButtonProperties.Add(StandardButtons.AddAfterDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add-detail after",
                    ShowText = "add after"
                });
            allButtonProperties.Add(StandardButtons.AddBefore,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add before",
                    ShowText = "add before"
                });
            allButtonProperties.Add(StandardButtons.AddBeforeDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add-detail before",
                    ShowText = "add before"
                });
            allButtonProperties.Add(StandardButtons.Append,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add append",
                    ShowText = "add at end"
                });
            allButtonProperties.Add(StandardButtons.Prepend,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add prepend",
                    ShowText = "add at beginning"
                });
            allButtonProperties.Add(StandardButtons.AppendDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add-detail append",
                    ShowText = "add at end"
                });
            allButtonProperties.Add(StandardButtons.PrependDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-plus",
                    OperationName = "add-detail prepend",
                    ShowText = "add at beginning"
                });
            allButtonProperties.Add(StandardButtons.Delete,
                new ButtonProperties
                {
                    IconClass = "glyphicon-remove",
                    OperationName = "delete",
                    ShowText = "delete"
                });
            allButtonProperties.Add(StandardButtons.Edit,
                new ButtonProperties
                {
                    IconClass = "glyphicon-edit",
                    OperationName = "edit",
                    ShowText = "edit"
                });
            allButtonProperties.Add(StandardButtons.EditDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-edit",
                    OperationName = "edit-detail",
                    ShowText = "edit"
                });
            allButtonProperties.Add(StandardButtons.ShowDetail,
                new ButtonProperties
                {
                    IconClass = "glyphicon-modal-window",
                    OperationName = "show-detail",
                    ShowText = "show detail"
                });
            allButtonProperties.Add(StandardButtons.Save,
                new ButtonProperties
                {
                    IconClass = "glyphicon-floppy-disk",
                    OperationName = "save",
                    ShowText = "save changes"
                });
            allButtonProperties.Add(StandardButtons.FirstPage,
                new ButtonProperties
                {
                    IconClass = "glyphicon-fast-backward",
                    OperationName = "go-first",
                    ShowText = "first page"
                });
            allButtonProperties.Add(StandardButtons.PreviousPage,
                new ButtonProperties
                {
                    IconClass = "glyphicon-step-backward",
                    OperationName = "go-previous",
                    ShowText = "previous page"
                });
            allButtonProperties.Add(StandardButtons.LastPage,
                new ButtonProperties
                {
                    IconClass = "glyphicon-fast-forward",
                    OperationName = "go-last",
                    ShowText = "last page"
                });
            allButtonProperties.Add(StandardButtons.NextPage,
                new ButtonProperties
                {
                    IconClass = "glyphicon-step-forward",
                    OperationName = "go-next",
                    ShowText = "next page"
                });
            allButtonProperties.Add(StandardButtons.Undo,
                new ButtonProperties
                {
                    IconClass = "glyphicon-menu-left",
                    OperationName = "undo",
                    ShowText = "undo"
                });
            allButtonProperties.Add(StandardButtons.UndoAll,
                new ButtonProperties
                {
                    IconClass = "glyphicon-triangle-left",
                    OperationName = "undo-all",
                    ShowText = "undo all"
                });
            allButtonProperties.Add(StandardButtons.Redo,
                new ButtonProperties
                {
                    IconClass = "glyphicon-menu-right",
                    OperationName = "redo",
                    ShowText = "redo"
                });
            allButtonProperties.Add(StandardButtons.RedoAll,
                new ButtonProperties
                {
                    IconClass = "glyphicon-triangle-right",
                    OperationName = "redo-all",
                    ShowText = "redo all"
                });
            allButtonProperties.Add(StandardButtons.FilterWindow,
                new ButtonProperties
                {
                    IconClass = "glyphicon-filter",
                    OperationName = "filter-window",
                    ShowText = "change filter"
                });
            allButtonProperties.Add(StandardButtons.SortWindow,
                new ButtonProperties
                {
                    IconClass = "glyphicon-list-alt",
                    OperationName = "sort-window",
                    ShowText = "change sorting"
                });
            allButtonProperties.Add(StandardButtons.GroupWindow,
                new ButtonProperties
                {
                    IconClass = "glyphicon glyphicon-th",
                    OperationName = "grouping-window",
                    ShowText = "change grouping"
                });
            allButtonProperties.Add(StandardButtons.SortAscending,
                new ButtonProperties
                {
                    IconClass = "glyphicon-filter",
                    OperationName = "sort-ascending",
                    ShowText = "sort ascending"
                });
            allButtonProperties.Add(StandardButtons.SortDescending,
                new ButtonProperties
                {
                    IconClass = "glyphicon-filter",
                    OperationName = "sort-descending",
                    ShowText = "sort descending"
                });
            allButtonProperties.Add(StandardButtons.Close,
                new ButtonProperties
                {
                    IconClass = "glyphicon-remove",
                    OperationName = "close",
                    ShowText = "close"
                });
        }
        public  IHtmlContent RenderButton(StandardButtons buttonType, 
            string arguments, 
            string cssClass, 
            ContextualizedHelpers helpers, 
            IStringLocalizer localizer, 
            bool visibleText=false, 
            bool isSubmit=false,
            string controlType = null)
        {
            ButtonProperties currentButton = null;
            allButtonProperties.TryGetValue(buttonType, out currentButton);
            if(currentButton == null) return new HtmlString(string.Empty);
            if(isSubmit)
                return new HtmlString(string.Format(visibleText ? buttonTemplateWithTextSubmit: buttonTemplateSubmit,
                    cssClass??string.Empty,
                    localizer != null ?
                        localizer[currentButton.ShowText] : currentButton.ShowText,
                    currentButton.IconClass
                    ));
            else
                return new HtmlString(string.Format(visibleText ? buttonTemplateWithText : buttonTemplate,
                    currentButton.OperationName,
                    arguments ?? string.Empty,
                    cssClass ?? string.Empty,
                    localizer != null ?
                        localizer[currentButton.ShowText] : currentButton.ShowText,
                    currentButton.IconClass,
                    controlType==null ? string.Empty : "data-control-type='"+ controlType + "'"
                    ));
        }
        public bool GenerateNames
        {
            get
            {
                return true;
            }
        }

        public Action<TagHelperContext, TagHelperOutput, TagHelper> InputProcess
        {
            get
            {
                return null;
            }
        }

        public bool RequireUnobtrusiveValidation
        {
            get
            {
                return true;
            }
        }

        public DefaultTemplates GetDefaultTemplates(string tagName)
        {
            DefaultTemplates res = null;
            allTagDefaultTemplates.TryGetValue(tagName, out res);
            return res;
        }

        public Func<TagHelperContext, TagHelperOutput, TagHelper, TagProcessorOptions, ContextualizedHelpers, Task> GetTagProcessor(string tagName)
        {
            Func<TagHelperContext, TagHelperOutput, TagHelper, TagProcessorOptions, ContextualizedHelpers, Task> res = null;
            allTagProcessors.TryGetValue(tagName, out res);
            return res;
        }

        public void PrepareViewContext(ViewContext context)
        {
            
        }

        public void UnPrepareViewContext(ViewContext context)
        {
            
        }
    }
}
