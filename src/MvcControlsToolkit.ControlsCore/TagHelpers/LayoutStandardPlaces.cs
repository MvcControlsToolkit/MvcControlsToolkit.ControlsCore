using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcControlsToolkit.Core.TagHelpers
{
    public static class LayoutStandardPlaces
    {
        private static string header = "header";
        public static string Header
        {
            get
            {
                return header;
            }
        }

        private static string footer = "footer";
        public static string Footer
        {
            get
            {
                return footer;
            }
        }
        private static string leftAside = "left-aside";
        public static string LeftAside
        {
            get
            {
                return leftAside;
            }
        }
        private static string rightAside = "right-aside";
        public static string RightAside
        {
            get
            {
                return rightAside;
            }
        }
    }
}
