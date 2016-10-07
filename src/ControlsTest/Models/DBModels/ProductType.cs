using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ControlsTest.Models
{
    public class ProductType
    {
        public int Id { get; set; }
        [MaxLength(128)]
        public string Name { get; set; }
        public virtual ICollection<Product> Products { get; set; }
    }
}
