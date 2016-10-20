using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class DefaultServerGridLayoutOptions : LayoutTemplateOptions
    {
        public GridType Type { get; private set; }

        public GridErrorMessages Messages { get; private set; }

        public string CssClass { get; private set; }

        public string Id { get; private set; }

        public string Prefix { get; private set; }
        public KeyValuePair<string, IHtmlContent> CurrentToolbar { get;  set; }
        public RowType CurrentRow { get; set; }
        public Type LocalizerType { get; private set; }
        public IStringLocalizer Localizer { get; private set; }
        public bool MustAddButtonColumn { get; private set; }
        public int VisibleColumns { get; private set; }
        public string Caption { get; private set; }
        private ContextualizedHelpers helpers;
        public DefaultServerGridLayoutOptions(
            ContextualizedHelpers helpers,
            IList<RowType> rows,
            IList<KeyValuePair<string, string>> toolbars,
            Template<LayoutTemplateOptions> layoutTemplate,
            IEnumerable<Template<LayoutTemplateOptions>> subTemplates, 
            IHtmlContent mainContent,
            GridType type,
            string id,
            string prefix,
            GridErrorMessages messages,
            string cssClass,
            string caption,
            Type localizerType
            ) : base(rows, toolbars, layoutTemplate, subTemplates, mainContent)
        {
            this.helpers = helpers;
            Type = type;
            Messages = messages;
            Id = id;
            Prefix = prefix;
            CssClass = cssClass;
            Caption = caption;
            var first = rows.FirstOrDefault();
            MustAddButtonColumn = first.MustAddButtonColumn(helpers, Type== GridType.Batch);
            VisibleColumns = first.VisibleColumns(helpers, Type == GridType.Batch);
            LocalizerType = localizerType;
            Localizer = LocalizerType != null ? helpers.LocalizerFactory.Create(LocalizerType) : null;
        }
        protected string Localize(string x)
        {
            return Localizer != null ? Localizer[x] : x;
        }
        public IHtmlContent RenderTopContainerAttributes()
        {
            return new HtmlString(string.Format("id='{0}' class='{1}' data-control-type='{2}'",
                Id, CssClass, Type == GridType.Batch ? "server-batch-grid" : "server-immediate-grid"));
        }
        public IHtmlContent RenderRowsContainerAttributes()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("id='");
            sb.Append(Id);
            sb.Append("_container' ");

            
            if (Messages != null)
            {
                if (Messages.AddFailed != null)
                {
                    sb.Append("data-add-failed='");
                    sb.Append(HtmlEncoder.Default.Encode(Localize(Messages.AddFailed)));
                    sb.Append("' ");
                }
                if (Messages.DeleteConfirmation != null)
                {
                    sb.Append("data-delete-confirmation='");
                    sb.Append(HtmlEncoder.Default.Encode(Localize(Messages.DeleteConfirmation)));
                    sb.Append("' ");
                }
                if (Type == GridType.Immediate && Messages.DeleteFailed != null)
                {
                    sb.Append("data-delete-failed='");
                    sb.Append(HtmlEncoder.Default.Encode(Localize(Messages.DeleteFailed)));
                    sb.Append("' ");
                }
                if (Messages.ModificationFailed != null)
                {
                    sb.Append("data-modification-failed='");
                    sb.Append(HtmlEncoder.Default.Encode(Localize(Messages.ModificationFailed)));
                    sb.Append("' ");
                }
                if (Type==GridType.Immediate && Messages.ShowDetailFailed != null)
                {
                    sb.Append("data-record-not-found='");
                    sb.Append(HtmlEncoder.Default.Encode(Localize(Messages.ShowDetailFailed)));
                    sb.Append("' ");
                }
            }
            foreach (var row in Rows)
            {
                var requiredFunctionalities = row.RequiredFunctionalities(helpers.User);
                if (row.ControllerType != null && requiredFunctionalities != 0)
                {
                    if ((requiredFunctionalities & (Functionalities.AddAfter | Functionalities.AddBefore |
                        Functionalities.Append | Functionalities.Prepend | Functionalities.Edit)) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-add-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "InLineEdit", new {rowId = "_zzFzz_" }));
                    }
                    if ((requiredFunctionalities & (Functionalities.AddAfterDetail | Functionalities.AddBeforeDetail |
                        Functionalities.AppendDetail | Functionalities.PrependDetail |  Functionalities.EditDetail)) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-add-detail-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "EditDetail", null));
                    }
                    if (Type==GridType.Immediate && (requiredFunctionalities & Functionalities.Edit) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-edit-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "InLineEdit", new { key = "_zzFzz_", rowId = "_zzFzz_1" }));
                    }
                    if ((requiredFunctionalities & Functionalities.EditDetail) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-edit-detail-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "EditDetail", new { key = "_zzFzz_" }));
                    }
                    if ((requiredFunctionalities & Functionalities.ShowDetail) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-show-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "EditDetail", new { key = "_zzFzz_", readOnly = true }));
                    }
                    if (Type == GridType.Immediate && (requiredFunctionalities & Functionalities.Delete) != 0)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "data-delete-url-{0}='{1}' ",
                            row.Order,
                            row.RenderUrl(helpers, "Delete", new { key = "_zzFzz_" }));
                    }
                }
            }
            
            if(Type == GridType.Batch)
            {
                sb.Append("data-prefix='");
                sb.Append(Prefix);
                sb.Append("' ");  
            }
            return new HtmlString(sb.ToString());
        }
    }


}
