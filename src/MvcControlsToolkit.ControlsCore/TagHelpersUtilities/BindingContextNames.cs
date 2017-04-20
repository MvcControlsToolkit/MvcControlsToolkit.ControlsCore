﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcControlsToolkit.Core.TagHelpersUtilities
{
    public static class BindingContextNames
    {
        public static string Collection { get { return "collection"; } }
        public static string Query { get { return "filter"; } }

        public static string CollectionToQuery { get { return "collection_to_filter"; } }
    }
}
