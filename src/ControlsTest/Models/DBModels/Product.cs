using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace ControlsTest.Models
{
    public enum Currency
    {
        [Display(Name = "$")]
        Dollar,
        [Display(Name = "€")]
        Euro,
        [Display(Name = "£")]
        Pound,
        [Display(Name = "¥")]
        Yen
    };
    public class Product
    {
        public int Id { get; set; }
        [MaxLength(256)]
        public string Description { get; set; }
        [MaxLength(128)]
        public string Name { get; set; }
        public decimal Price { get; set; }

        public DateTime? DateValid { get; set; }
        public Currency ChosenCurrency { get; set; }
        public bool Available { get; set; }

        public int? TypeId { get; set; }
        public virtual ProductType Type { get; set; }
        public virtual ProductWithMaintenance Maintenance{get; set;}
        

    }

    public class ProductWithMaintenance
    {
        public int Id { get; set; }
        public decimal YearlyRate { get; set; }
        public int? ProductId { get; set; }
        public virtual Product Base { get; set; }
    }
}
