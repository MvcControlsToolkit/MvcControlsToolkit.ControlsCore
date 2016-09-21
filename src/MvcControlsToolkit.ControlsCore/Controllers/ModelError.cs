using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcControlsToolkit.Controllers
{
    public class ModelError
    {
        public string Prefix { get; set; }
        public IEnumerable<string> Errors { get; set; }
    }
}
