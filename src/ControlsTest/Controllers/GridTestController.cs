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
using MvcControlsToolkit.Core.OData;
using Microsoft.EntityFrameworkCore;
using MvcControlsToolkit.Core.Types;

namespace ControlsTest.Controllers
{
    public class GridTestController : ServerCrudController<ProductViewModelDetail, ProductViewModel, int?>
    {
        static GridTestController()
        {
            DefaultCRUDRepository<ApplicationDbContext, Product>
                .DeclareProjection<ProductViewModel>(
                    m => m.Maintenance == null ?
                    
                    new ProductViewModel
                    {
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value)

                    } :

                    new ProductMaintenanceViewModel
                    {
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value),
                        MaintenanceYearlyRate = (decimal)m.Maintenance.YearlyRate
                    }

                );
            DefaultCRUDRepository<ApplicationDbContext, Product>
               .DeclareQueryProjection(
                 m =>
                   new ProductViewModel()
                   {
                       DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value)

                   },
                   m => m.Id

               );
            DefaultCRUDRepository<ApplicationDbContext, Product>
                .DeclareProjection(
                    m => m.Maintenance != null ?
                    new ProductMaintenanceViewModelDetail
                    {
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value),
                        MaintenanceYearlyRate = (decimal)m.Maintenance.YearlyRate
                    } :
                    new ProductViewModelDetail
                    {
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value)

                    }

                );
            DefaultCRUDRepository<ApplicationDbContext, ProductType>
                .DeclareProjection<DisplayValue>(
                    m => new DisplayValue
                    {
                        Value = m.Id,
                        Display = m.Name
                    });

        }

        

        IWebQueryProvider queryProvider;
        private readonly ICRUDRepository TypesRepository;
        private IWebQueryable oDataRepository;
        public GridTestController(
            Data.ApplicationDbContext db, 
            IStringLocalizerFactory factory, 
            IHttpContextAccessor accessor, 
            IWebQueryProvider queryProvider) :base(factory, accessor)
        {
            //in actual 3 layers applications repository inherit 
            //from DefaultCRUDRepository
            //and then it is DI injected
            Repository = DefaultCRUDRepository.Create(db, db.Products);
            oDataRepository = new DefaultWebQueryRepository(Repository);
            TypesRepository = DefaultCRUDRepository.Create(db, db.ProductTypes);
            this.queryProvider = queryProvider;
        }
        public override string DetailColumnAdjustView
        {
            get
            {
                return "_DetailRows";
            }
        }
        public async Task<IActionResult> Index(int? page)
        {
            var query = queryProvider?.Parse<ProductViewModel>();
            int pg = page.HasValue ? page.Value : 1;
            if (pg < 1) pg = 1;

            var res = await Repository.GetPage<ProductViewModel>(
                query?.GetFilterExpression(),
                q => q.OrderBy(m => m.Name),
                pg, 3);
            var model = new ProductlistViewModel
            {
               

                Products = res
            };
            return View(model);
            
            
        }
        public async Task<IActionResult> IndexPartial(int? page)
        {
            var query = queryProvider?.Parse<ProductViewModel>();
            int pg = page.HasValue ? page.Value : 1;
            if (pg < 1) pg = 1;

            var model = new ProductlistViewModel
            {
                Products = await Repository.GetPage<ProductViewModel>(
                query?.GetFilterExpression(),
                q => q.OrderBy(m => m.Name),
                pg, 3)
            };
            var res = PartialView("_gridIndex", model);
            return res;


        }
        public async Task<IActionResult> IndexEdit()
        {
            var query=queryProvider.Parse<ProductViewModel>();
            
            int pg = (int)query.Page;
            var grouping = query.GetGrouping<ProductViewModelGrouping>();

            ProductlistViewModel model = new ProductlistViewModel
                {
                Query = query,
                Products =
                    grouping == null ?
                        await Repository.GetPage(
                            query.GetFilterExpression(),
                            query.GetSorting() ??
                                (q => q.OrderBy(m => m.Name)),
                            pg, 3)
                        :
                        await Repository.GetPageExtended(
                            query.GetFilterExpression(),
                            query.GetSorting<ProductViewModelGrouping>() ?? 
                                (q => q.OrderBy(m => m.Name)),
                            pg, 3,
                            query.GetGrouping<ProductViewModelGrouping>())
                };


            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;

            return View(model);
        }
        public async Task<IActionResult> IndexEditDA()
        {
            queryProvider.OrderBy =
                queryProvider.OrderBy ?? "Name asc";
            queryProvider.Top = 
                queryProvider.Top??"3";
            var query = queryProvider.Parse<ProductViewModel>();

            ProductlistViewModel model = new ProductlistViewModel
            {
                Query = query,
                Products = await oDataRepository
                    .ExecuteQuery<ProductViewModel, ProductViewModelGrouping>
                        (queryProvider)
                   
            };


            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;

            return View(model);
        }
        public async Task<IActionResult> IndexEditDetail(int? page)
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
        [HttpGet]
        public async Task<IActionResult> IndexBatch(int? page)
        {
            int pg = page.HasValue ? page.Value : 1;
            if (pg < 1) pg = 1;

            var model = new ProductlistBatchViewModel
            {
                Products = await Repository.GetPage<ProductViewModel>(
                null,
                q => q.OrderBy(m => m.Name),
                pg, 3)
            };
            model.ModifiedProducts = model.Products.Data;
            return View(model);
        }
        public async Task<IActionResult> IndexBatchDetail(int? page)
        {
            int pg = page.HasValue ? page.Value : 1;
            if (pg < 1) pg = 1;

            var model = new ProductlistBatchViewModel
            {
                Products = await Repository.GetPage<ProductViewModel>(
                null,
                q => q.OrderBy(m => m.Name),
                pg, 3)
            };
            model.ModifiedProducts = model.Products.Data;
            return View(model);
        }
        [HttpPost]
        public async Task<IActionResult> IndexBatch(ProductlistBatchViewModel model)
        {
            if (ModelState.IsValid)
            {
                Repository.UpdateList(false, model.Products.Data, model.ModifiedProducts);
                await Repository.SaveChanges();
                return RedirectToAction("IndexBatch", new { page = model.Products.Page });
            }
            else
            {
                return View(model);
            }
        }
        [HttpPost]
        public async Task<IActionResult> IndexBatchDetail(ProductlistBatchViewModel model)
        {
            if (ModelState.IsValid)
            {
                Repository.UpdateList(false, model.Products.Data, model.ModifiedProducts);
                await Repository.SaveChanges();
                return RedirectToAction("IndexBatchDetail", new { page = model.Products.Page });
            }
            else
            {
                return View(model);
            }
        }
    }
    public class DetailTestController : Controller
    {
        private readonly DefaultCRUDRepository<ApplicationDbContext, Product> Repository;
        private readonly ICRUDRepository TypesRepository;
        static DetailTestController()
        {
            DefaultCRUDRepository<ApplicationDbContext, Product>
                .DeclareProjection<ProductViewModelDetail>(
                    m => m.Maintenance != null ?
                    new ProductMaintenanceViewModelDetail
                    {
                        //DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value),
                        MaintenanceYearlyRate = (decimal)m.Maintenance.YearlyRate,
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value)
                    } :
                    new ProductViewModelDetail
                    {
                        DateValid = m.DateValid == null ? null : (Month?)Month.FromDateTime(m.DateValid.Value)

                    }

                );
            DefaultCRUDRepository<ApplicationDbContext, ProductType>
                .DeclareProjection<DisplayValue>(
                    m => new DisplayValue
                    {
                        Value=m.Id,
                        Display=m.Name
                    });
        }
        
        public DetailTestController(Data.ApplicationDbContext db)
        {
            Repository = DefaultCRUDRepository.Create(db, db.Products);
            TypesRepository = DefaultCRUDRepository.Create(db, db.ProductTypes);
            
        }
        public async Task<ActionResult> Detail(int? id)
        {
            if (!id.HasValue) id = 1;
            var model = await Repository.GetById<ProductViewModelDetail, int>(id.Value);
            return View(model);

        }
        [HttpGet]
        public async Task<ActionResult> Edit(int? id)
        {
            if (!id.HasValue) id = 1;
            var model = await Repository.GetById<ProductViewModelDetail, int>(id.Value);
           
            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;
            return View(model);

        }
        [HttpGet]
        public async Task<ActionResult> Create(int? row)
        {
            ViewBag.DefaultRow = row.HasValue ? Math.Max(Math.Min(row.Value, 1), 0) :0;
            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;
            return View();

        }
        [HttpPost]
        public async Task<ActionResult> Create(ProductViewModelDetail model)
        {
            
            if (ModelState.IsValid)
            {
                Repository.Add<ProductViewModelDetail>(false, model);
                await Repository.SaveChanges();
                return RedirectToAction("Edit", new { id = model.Id });
            }
            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;
            return View(model);
        }
        [HttpPost]
        public async Task<ActionResult> Edit(ProductViewModelDetail model)
        {
            ViewBag.AllTypes = (await TypesRepository.GetPage<DisplayValue>(null, m => m.OrderBy(n => n.Display), 1, 1000)).Data;
            if (ModelState.IsValid)
            {
                Repository.Update<ProductViewModelDetail>(false, model);
                await Repository.SaveChanges();
            }
            return View(model);
        }
        [HttpGet]
        public async Task<ActionResult> GetTypes(string search)
        {
            var res = search == null || search.Length<3 ? 
                new List<DisplayValue>():
               (await TypesRepository.GetPage<DisplayValue>(m => m.Display.StartsWith(search), m => m.OrderBy(n => n.Display), 1, 10)).Data;
            return Json(res);
        }

    }
}