using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MvcControlsToolkit.Core.Templates;
using MvcControlsToolkit.ControlsCore;

namespace MvcControlsToolkit.Controllers
{
    public static class ControllerHelpers
    {
        private static IDictionary<Type, RowType> serverTemplates = new ConcurrentDictionary<Type, RowType>();
        public static void DeclareServerRowtype(Type controllerType, RowType row)
        {
            if (!serverTemplates.ContainsKey(controllerType))
            {
                if (!typeof(Controller).GetTypeInfo().IsAssignableFrom(controllerType))
                    throw new ArgumentException(string.Format(Resources.NotAController, controllerType.Name), nameof(controllerType));
                serverTemplates[controllerType] = row;
            }

        }
        public static RowType GetRowType(Type controllerType)
        {
            RowType res = null;
            if (serverTemplates.TryGetValue(controllerType, out res)) return res;
            return null;
        }
    }
}
