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
using ControlsTest.Data;

namespace ControlsTest.Controllers
{
    public class GridTestController : ServerCrudController<ProductViewModel, ProductViewModel, int?>
    {
        static GridTestController()
        {
            DefaultCRUDRepository<ApplicationDbContext, Product>
                .DeclareProjection<ProductViewModel>(
                    m => m.MaintenanceId.HasValue ?
                    new ProductMaintenanceViewModel
                    {
                        Available = m.Available,
                        ChosenCurrency = m.ChosenCurrency,
                        Description = m.Description,
                        Id = m.Id,
                        Name = m.Name,
                        Price = m.Price,
                        TypeId = m.TypeId,
                        TypeName = m.Type.Name,
                        MaintenanceYearlyRate = (decimal)m.Maintenance.YearlyRate
                    }
                    :
                    new ProductViewModel
                    {
                        Available = m.Available,
                        ChosenCurrency = m.ChosenCurrency,
                        Description = m.Description,
                        Id = m.Id,
                        Name = m.Name,
                        Price = m.Price,
                        TypeId = m.TypeId,
                        TypeName = m.Type.Name

                    } 
                    
                );
        }
        private ApplicationDbContext db;
        public GridTestController(Data.ApplicationDbContext db, IStringLocalizerFactory factory, IHttpContextAccessor accessor) :base(factory, accessor)
        {
            //in actual 3 layers applications repository inherit from DefaultCRUDRepository
            //and then it is DI injected
            Repository = DefaultCRUDRepository.Create(db, db.Products);
            this.db = db;
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
            return View(model);
            
            
        }
        public async Task<IActionResult> IndexPartial(int? page)
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
            return PartialView("_gridIndex", model);


        }
    }
}