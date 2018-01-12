using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using MvcControlsToolkit.Core.DataAnnotations;
using MvcControlsToolkit.Core.Business.Utilities;
using ControlsTest.Data;
using System.Security.Claims;
using System.Collections;
using MvcControlsToolkit.Core.Business;
using MvcControlsToolkit.Core.Types;
using ControlsTest.Services;

namespace ControlsTest.Models
{

    public class ProductViewModelBase
    {
        
        public int? Id { get; set; }
        [MaxLength(256)]
        [Display(Name = "Description", Order = 100)]
        [DisplayFormat(NullDisplayText = "no description available")]
        [Query]
        [FilterLayout(QueryOptions.StartsWith |QueryOptions.EndsWith )]
        public string Description { get; set; }
        [MaxLength(128)]
        [ColumnLayout(DetailWidthsAsString = "100 60")]
        [Display(Name = "Name", Order = 400)]
        [Query]
        [FilterLayout(QueryOptions.StartsWith)]
        public string Name { get; set; }
        [ColumnLayout(DetailWidthsAsString = "60 30")]
        [Display(Name = "Price", Order = 300)]
        [DisplayFormat(DataFormatString = "{0:N3}")]
        [Query]
        [FilterLayout(QueryOptions.AllFilters, QueryOptions.AllFilters)]
        public decimal Price { get; set; }
        [Display(Name = "Cur", Order = 280)]
        [ColumnLayout(WidthsAsString = "5", DetailWidthsAsString = "40 10")]
        [Query]
        public Currency ChosenCurrency { get; set; }
        [ColumnLayout(DetailWidthsAsString = "30")]
        [Display(Name = "Av", Order = 230)]
        [Query]
        public bool Available { get; set; }
        [Display(Name = "Type", Order = 250)]
        [Query]
public string TypeName { get; set; }

    [ColumnConnection("TypeName", "Display", "Value", 
        typeof(ProductTypesProvider))]
    public int? TypeId { get; set; }
            [Display(Name = "Valid till", Order = 50)]
            [ColumnLayout(DetailWidthsAsString = "100")]
            [Query]
            public Month? DateValid { get; set; }
        }
    public class ProductViewModel: ProductViewModelBase
    {
    }
    [RunTimeType]
    public class ProductViewModelGrouping: ProductViewModel
    {
        public int ChosenCurrencyCount { get; set; }
        public int TypeIdCount { get; set; }
        public int AvailableCount { get; set; }
        public int DateValidCount { get; set; }
    }
    [RunTimeType]
    public class ProductMaintenanceViewModel: ProductViewModel, IUpdateConnections
    {
        [Display(Name = "Price/Year", Order = 299)]
        
        public decimal MaintenanceYearlyRate { get; set; }

        public bool MayUpdate(string prefix)
        {
            return prefix == "Maintenance";
        }
    }
    public class ProductViewModelDetail: ProductViewModel
    {

    }
    [RunTimeType]
    public class ProductMaintenanceViewModelDetail : ProductViewModelDetail, IUpdateConnections
    {
        [Display(Name = "Price/Year", Order = 299)]
        [ColumnLayout(DetailWidthsAsString = "30 15")]
        public decimal MaintenanceYearlyRate { get; set; }
            
        public bool MayUpdate(string prefix)
        {
            return prefix == "Maintenance";
        }
    }
}
