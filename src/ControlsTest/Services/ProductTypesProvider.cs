using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ControlsTest.Data;
using ControlsTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MvcControlsToolkit.Core.Business.Utilities;
using MvcControlsToolkit.Core.DataAnnotations;

namespace ControlsTest.Services
{
    public class ProductTypesProvider : 
        IDispalyValueItemsProvider, IDispalyValueSuggestionsProvider
    {
        public string ClientDisplayValueItemsSelector => null;

        public string DisplayValueSuggestionsUrlToken
                { get; set; } = "_zzz_";

        ApplicationDbContext db;
        DefaultCRUDRepository<ApplicationDbContext, ProductType> repo;
        public ProductTypesProvider(ApplicationDbContext db)
        {
            repo = DefaultCRUDRepository.Create(db, db.ProductTypes);
        } 
        public async Task<IEnumerable> GetDisplayValuePairs(object x)
        {
            return (await repo.GetPage<DisplayValue>(null,
                m => m.OrderBy(n => n.Display), 1, 100)).Data;
        }

        public string GetDisplayValueSuggestionsUrl(IUrlHelper uri)
        {
            return uri.Action("GetTypes", "DetailTest", 
                new { search = "_zzz_" });
        }
    }
}
