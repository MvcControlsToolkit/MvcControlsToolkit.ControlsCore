using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using MvcControlsToolkit.Core.TagHelpersUtilities;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public class PermissionInfos
    {
        public Func<IPrincipal, Functionalities> UserPermissions { get; set; }
        public string ClientUserPermissions { get; set; }
    }
    public static class TagContextHelperAdvanced
    {
        private const string permissionBindingKeyPrefix = "__permission_binding__";
        public static void OpenPermissionBindingContext(HttpContext httpContext, PermissionInfos data)
        {
            RenderingContext.OpenContext<PermissionInfos>(httpContext, permissionBindingKeyPrefix, data);
        }
        public static void ClosePermissionBindingContext(HttpContext httpContext)
        {
            RenderingContext.CloseContext(httpContext, permissionBindingKeyPrefix);
        }
        public static PermissionInfos GetPermissionBindingContext(HttpContext httpContext)
        {
            return RenderingContext.CurrentData<PermissionInfos>(httpContext, permissionBindingKeyPrefix);
        }
    }
}
