using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using MvcControlsToolkit.Core.DataAnnotations;
using MvcControlsToolkit.Core.Business.Utilities;
using ControlsTest.Data;

namespace ControlsTest.Models
{
    
    public class ProductViewModel
    {
        
        public int? Id { get; set; }
        [MaxLength(256)]
        [Display(Name = "Description", Order = 100)]
        [DisplayFormat(NullDisplayText = "no description available")]
        public string Description { get; set; }
        [MaxLength(128)]
        [Display(Name = "Name", Order = 400)]
        public string Name { get; set; }
        [Display(Name = "Price", Order = 300)]
        [DisplayFormat(DataFormatString ="{0:N3}")]
        public decimal Price { get; set; }
        [Display(Name = "Currency", Order = 200)]
        [ColumnLayout(WidthsAsString = "5")]
        public Currency ChosenCurrency { get; set; }

        public bool Available { get; set; }

        public string TypeName { get; set; }
        public int? TypeId { get; set; }
    }
    public class ProductMaintenanceViewModel: ProductViewModel
    {
        [Display(Name = "Price/Year", Order = 299)]
        public decimal MaintenanceYearlyRate { get; set; }
    }
}
