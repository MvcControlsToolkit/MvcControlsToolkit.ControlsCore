using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MvcControlsToolkit.Controllers;
using MvcControlsToolkit.Core.Business.Utilities;
using ControlsTest.Models;
using Microsoft.Extensions.Localization;
using Microsoft.AspNetCore.Http;

namespace ControlsTest.Controllers
{
    public class GridTestController : ServerCrudController<ProductViewModel, ProductViewModel, int?>
    {
        public GridTestController(Data.ApplicationDbContext db, IStringLocalizerFactory factory, IHttpContextAccessor accessor) :base(factory, accessor)
        {
            //in actual 3 layers applications repository inherit from DefaultCRUDRepository
            //and then it is DI injected
            Repository = DefaultCRUDRepository.Create(db, db.Products);
        }
        public async Task<IActionResult> Index(int? page)
        {
            int pg = page.HasValue ? page.Value : 1;
            if (pg < 1) pg = 1;
            var model = new ProductlistViewModel
            {
                Products = await Repository.GetPage<ProductViewModel>(
                null,
                q => q.OrderBy(m => m.Name),
                pg, 3)
            };
            return View();
        }
    }
}