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

        private static string headerDisplay = "header-display";
        public static string HeaderDisplay
        {
            get
            {
                return headerDisplay;
            }
        }
        private static string headerEdit = "header-edit";
        public static string HeaderEdit
        {
            get
            {
                return headerEdit;
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
        private static string footerDisplay = "footer-display";
        public static string FooterDisplay
        {
            get
            {
                return footerDisplay;
            }
        }
        private static string footerEdit = "footer-edit";
        public static string FooterEdit
        {
            get
            {
                return footerEdit;
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
        private static string submitBar = "submit-bar";
        public static string SubmitBar
        {
            get
            {
                return submitBar;
            }
        }
    }
}
