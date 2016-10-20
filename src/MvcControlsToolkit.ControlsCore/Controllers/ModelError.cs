using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcControlsToolkit.Controllers
{
    public class ModelError
    {
        public ModelError()
        {

        }
        public ModelError(string x)
        {
            Errors = new string[1] { x };
            Prefix = string.Empty;
        }
        public string Prefix { get; set; }
        public IEnumerable<string> Errors { get; set; }
    }
}
