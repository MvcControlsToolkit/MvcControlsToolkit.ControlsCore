using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MvcControlsToolkit.Core.TagHelpers;
using MvcControlsToolkit.Core.Views;

namespace MvcControlsToolkit.ControlsCore.TagHelpers
{
    [HtmlTargetElement(TagName, Attributes = PermissionAttributeName, TagStructure = TagStructure.NormalOrSelfClosing)]
    public class VerifyPermissionTagHelper : TagHelper
    {
        private const string TagName = "verify-permission";
        private const string PermissionAttributeName = "required-permissions";
        [HtmlAttributeName(PermissionAttributeName)]
        public Functionalities RequiredPermissions { get; set; }
        [HtmlAttributeName("permissions")]
        public Func<IPrincipal, Functionalities> UserPermissions { get; set; }
        [HtmlAttributeName("client-permissions")]
        public string ClientUserPermissions { get; set; }
        [HtmlAttributeName("query-for")]
        public ModelExpression QueryFor { get; set; }
        private IHttpContextAccessor httpAccessor;
        [HtmlAttributeNotBound]
        [ViewContext]
        public Microsoft.AspNetCore.Mvc.Rendering.ViewContext ViewContext { get; set; }
        public VerifyPermissionTagHelper(IHttpContextAccessor httpAccessor)
        {
            this.httpAccessor = httpAccessor;
        }
        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if(QueryFor == null)
            {
                QueryFor = TagContextHelper.GetBindingContext(httpAccessor.HttpContext, BindingContextNames.Query);
            }
            if(ClientUserPermissions == null || UserPermissions == null)
            {
                var permissionCtx = TagContextHelperAdvanced.GetPermissionBindingContext(httpAccessor.HttpContext);
                ClientUserPermissions = ClientUserPermissions ?? permissionCtx?.ClientUserPermissions;
                UserPermissions = UserPermissions ?? permissionCtx?.UserPermissions;
            }
            var currProvider = ViewContext.TagHelperProvider();
            var ctx = new Core.Templates.ContextualizedHelpers(ViewContext, null, httpAccessor, null, null, null);
            await currProvider.GetTagProcessor(TagName)(context, output, this, null, ctx);
        }
    }
}
