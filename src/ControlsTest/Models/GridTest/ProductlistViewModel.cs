using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MvcControlsToolkit.Core.Business.Utilities;

namespace ControlsTest.Models
{
    public class ProductlistViewModel
    {
       public DataPage<ProductViewModel>  Products { get; set; } 
    }
}
