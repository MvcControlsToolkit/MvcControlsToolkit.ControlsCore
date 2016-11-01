using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ControlsTest.Models;

namespace ControlsTest.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult Error()
        {
            return View();
        }

        [HttpGet]
        public IActionResult AutocompleteTest()
        {
            var vm = new AutocompleteTestViewModel
            {
                SelectedId = 1,
                SelectedDisplay = "Ireland"
            };
            return View();
        }
        [HttpGet]
        [ResponseCache(Duration =0, NoStore =true)]
        public IActionResult AutocompleteItems(string search)
        {
            var vm = new List<AutoCompleteItem>();
            vm.Add(new AutoCompleteItem {
                Value=0,
                Display="Italy"
            });
            vm.Add(new AutoCompleteItem
            {
                Value = 1,
                Display = "Ireland"
            });
            vm.Add(new AutoCompleteItem
            {
                Value = 2,
                Display = "United States"
            });
            vm.Add(new AutoCompleteItem
            {
                Value = 3,
                Display = "Canada"
            });
            return Json(vm.Where(m => m.Display.StartsWith(search, StringComparison.CurrentCultureIgnoreCase)));
        }
        [HttpPost]
        public IActionResult AutocompleteTest(AutocompleteTestViewModel vm)
        {
            
            return View(vm);
        }
        

    }
}
