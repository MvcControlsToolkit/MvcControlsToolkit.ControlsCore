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
        private static IDictionary<KeyValuePair<Type, string>, RowType> serverTemplates = new ConcurrentDictionary<KeyValuePair<Type, string>, RowType>();
        public static void DeclareServerRowtype(Type controllerType, RowType row)
        {
            var pair = new KeyValuePair<Type, string>(controllerType, row.RowId);
            if (!serverTemplates.ContainsKey(pair))
            {
                if (!typeof(Controller).GetTypeInfo().IsAssignableFrom(controllerType))
                    throw new ArgumentException(string.Format(Resources.NotAController, controllerType.Name), nameof(controllerType));
                serverTemplates[pair] = row;
            }

        }
        public static RowType GetRowType(Type controllerType, string id)
        {
            RowType res = null;
            var pair = new KeyValuePair<Type, string>(controllerType, id);
            if (serverTemplates.TryGetValue(pair, out res)) return res;
            return null;
        }
    }
}
