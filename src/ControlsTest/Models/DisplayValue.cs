using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ControlsTest.Models
{
    public class DisplayValue<D,V>
    {
        public D Display { get; set; }
        public V Value { get; set; }
    }
    public class DisplayValue: DisplayValue<string, int>
    {
    }

}
