using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace ControlsTest.Models
{
    public enum Currency
    {
        Dollar,
        Euro,
        Pound,
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
        public Currency ChosenCurrency { get; set; }
    }
}
