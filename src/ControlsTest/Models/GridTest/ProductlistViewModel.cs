using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MvcControlsToolkit.Core.Business.Utilities;
using MvcControlsToolkit.Core.Views;

namespace ControlsTest.Models
{
    public class ProductlistViewModel
    {
        public DataPage<ProductViewModel> Products { get; set; }
        public QueryDescription Query { get; set; }
    }
    public class ProductlistBatchViewModel: ProductlistViewModel
    {
        public IEnumerable<ProductViewModel> ModifiedProducts { get; set; }
    }
}
