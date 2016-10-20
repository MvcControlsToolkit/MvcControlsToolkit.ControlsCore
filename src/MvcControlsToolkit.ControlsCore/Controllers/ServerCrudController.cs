using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Localization;
using MvcControlsToolkit.ControlsCore;
using MvcControlsToolkit.Core.Business.Utilities;
using MvcControlsToolkit.Core.TagHelpers;
using MvcControlsToolkit.Core.Templates;

namespace MvcControlsToolkit.Controllers
{
    public abstract class ServerCrudController : Controller
    {
    }
    public abstract class ServerCrudController<VMD, VMS, D> : ServerCrudController
    {
        private RowType row;
        private Functionalities requiredFunctionalities;
        private IStringLocalizerFactory factory;
        private IStringLocalizer localizer;
        private IHttpContextAccessor accessor;
        private static string[] defaultMessages = new string[] {
            "wrong call",
            "internal server error",
            "item not found",
            "unauthorized",
            "unable to delete item (maybe already deleted)",
            "unable to update item (maybe it has been deleted)"
        };
        private void getRow(string id)
        {
            row = ControllerHelpers.GetRowType(this.GetType(), id??string.Empty);
            if (row != null)
            {
                requiredFunctionalities = requiredFunctionalities & row.RequiredFunctionalities(User);
            }
            
        }
        public ServerCrudController(IStringLocalizerFactory factory, IHttpContextAccessor accessor)
        {
            requiredFunctionalities=Permissions(User);
            this.factory = factory;
            if (factory != null) localizer = factory.Create(typeof(ServerCrudController));
            this.accessor = accessor;
        }
        private string localize(string x)
        {
            return localizer != null ? localizer[x] : x;
        }
        protected async Task<IActionResult> Invoke(object model, bool edit, string prefix=null)
        {
            
            Template<RowType> template = edit ? row.EditTemplate : row.DisplayTemplate;
            
            if (template.Type == Core.TagHelpers.TemplateType.Partial)
            {
                ViewData["Options"] = row;
                ViewData["LocalizerFactory"] = factory;
                if (!edit)
                {
                    ViewData.TemplateInfo.HtmlFieldPrefix = "_" + Guid.NewGuid().ToString("N");
                }
                else if(edit && prefix != null)
                {
                    ViewData.TemplateInfo.HtmlFieldPrefix = prefix+"[_" + Guid.NewGuid().ToString("N")+"]";
                }
                ViewData.ModelExplorer = row.For.ModelExplorer.GetExplorerForModel(model);
                return PartialView(template.TemplateName, model);
            }
            else if (template.Type == Core.TagHelpers.TemplateType.ViewComponent)
            {
                return ViewComponent(template.TemplateName, new {
                    model = model,
                    options = row,
                    prefix = edit ? 
                        (prefix==null ? string.Empty: prefix + "[_" + Guid.NewGuid().ToString("N") + "]") 
                        : "_" + Guid.NewGuid().ToString("N"),
                    modelState = this.ModelState,
                    localizerFactory=factory
                });
            }
            else if(template.Type == Core.TagHelpers.TemplateType.InLine)
            {
                var content = (await template.Invoke(new ModelExpression(row.For.Name, row.For.ModelExplorer.GetExplorerForModel(model)),
                    row, 
                    //just pass the HttpContext accessor that is the only 
                    //helper needed by the in-line template, 
                    //since all other helpers are available in the original page
                    new ContextualizedHelpers(null, null, accessor, null, null, null),
                    edit ?
                        (prefix == null ? string.Empty : prefix + "[_" + Guid.NewGuid().ToString("N") + "]")
                        : "_" + Guid.NewGuid().ToString("N")
                    )).ToString();
                return Content(content, "text/html");
            }
            else
            {
                throw new NotImplementedException(Resources.NotImplementetControllerTemplates);
            }
        }
        protected virtual Functionalities Permissions(System.Security.Principal.IPrincipal user)
        {
            return Functionalities.All;
        }
        public ICRUDRepository Repository { get; protected set; }
        public virtual bool DetailFull{get{ return false; }}
        public virtual bool InLineFull { get { return false; } }
        public virtual bool UseAntiForgery { get { return false; } }
        public virtual string DeatailView  { get { return "DefaultServerItemDetail"; } }
        public virtual string DeatailColumnAdjustView { get { return null; } }
        public virtual string DeatailTitle { get { return "Item detail"; } }
        public virtual string DeatailKeyName { get { return null; } }
        protected IEnumerable<ModelError> PackErrors(ModelStateDictionary ms)
        {
            return ms
                .Where(m => m.Value.Errors != null && m.Value.Errors.Count > 0)
                .Select(m => new ModelError
                {
                    Prefix = m.Key,
                    Errors = m.Value.Errors.Select(n => n.ErrorMessage)
                });
        }
        //0: Wrong Call
        //1: Internal server error
        //2: Record not found
        //3: Unauthorized
        //4: already deletes
        //5: deleted
        protected virtual string ErrorMessage(int i)
        {
            return localize(defaultMessages[i]);
        }
        [ResponseCache(Duration =0, NoStore =true)]
        public async Task<IActionResult> Delete(D key)
        {
            if ((requiredFunctionalities& Functionalities.Delete)==0) return Json(new ModelError[1] { new ModelError(ErrorMessage(3)) });
            if (!ModelState.IsValid) return 
                    Json(new ModelError[] {
                        new ModelError
                        {
                            Prefix="",
                            Errors=new string[] { ErrorMessage(0) }
                        }
                    });
            try
            {
                if (key != null)
                {
                    Repository.Delete(key);
                    await Repository.SaveChanges();
                    return Json(new ModelError[0]);
                }
                else return Json(new ModelError[] {
                        new ModelError
                        {
                            Prefix="",
                            Errors=new string[] { ErrorMessage(0) }
                        }
                    });

            }
            catch
            {
                return Json(new ModelError[] {
                        new ModelError
                        {
                            Prefix="",
                            Errors=new string[] { ErrorMessage(4) }
                        }
                    });
            }

        }
        [HttpGet]
        [ResponseCache(Duration = 0, NoStore = true)]
        public async Task<IActionResult> InLineEdit(D key, string rowId, bool? undo)
        {
            getRow(rowId);
            var display = undo.HasValue && undo.Value;
            if (key != null && (requiredFunctionalities & Functionalities.AnyEdit) == 0) return Content("#" + ErrorMessage(3), "text/plain");
            else if (key == null && (requiredFunctionalities & Functionalities.AnyAdd) == 0) return Content("#" + ErrorMessage(3), "text/plain");
            if (!ModelState.IsValid || row == null) return Content("#"+ ErrorMessage(0), "text/plain");
            if (key == null) return await Invoke(null, true, null);
            try
            {
                
                var res = await Repository.GetById<VMS, D>(key);
                if (res == null) return Content("#" + ErrorMessage(2), "text/plain");
                var result = await Invoke(res, !display, null);
                return result;
            }
            catch
            {
                return Content("#"+ ErrorMessage(1), "text/plain");
            }
        }
        [HttpPost]
        public async Task<IActionResult> InLineEdit(VMS vm, string rowId, bool isAdd)
        {
            getRow(rowId);
            if (!isAdd && (requiredFunctionalities & Functionalities.AnyEdit) == 0) return Json(new ModelError[1] { new ModelError(ErrorMessage(3)) });
            if (isAdd && (requiredFunctionalities & Functionalities.AnyAdd) == 0) return Json(new ModelError[1] { new ModelError(ErrorMessage(3)) });
            if(row == null) return Json(new ModelError[1] {new ModelError(ErrorMessage(0)) });
            ModelState.AddModelError("", "fake message");
            if (ModelState.IsValid)
            {
                try
                {
                    if(isAdd)
                        Repository.Add(InLineFull, vm);
                    else
                        Repository.Update(InLineFull, vm);
                    await Repository.SaveChanges();
                    ViewBag.ReadOnly = false;
                    return await Invoke(vm, false);
                }
                catch
                {
                    ModelState.AddModelError("", isAdd ? ErrorMessage(1) : ErrorMessage(1));
                    return Json(PackErrors(ModelState));
                }
            }
            else return Json(PackErrors(ModelState));
        }
        [HttpGet]
        [ResponseCache(Duration = 0, NoStore = true)]
        public async Task<IActionResult> EditDetail(D key, bool? readOnly)
        {
            if ((readOnly==null || !readOnly.Value) && key != null &&(requiredFunctionalities & Functionalities.AnyEdit) == 0) return Content("#" + ErrorMessage(3), "text/plain");
            else if (key == null && (requiredFunctionalities & Functionalities.AnyAdd) == 0) return Content("#" + ErrorMessage(3), "text/plain");
            
            if (!ModelState.IsValid || row == null) return Content("#"+ErrorMessage(0), "text/plain");
            if (key == null)
            {
                ViewData.ModelExplorer = row.For.ModelExplorer.GetExplorerForExpression(typeof(VMD), null);
                ViewData["id"] = "_" + Guid.NewGuid().ToString("N");
                ViewData["localizer"] = new Func<string, string>(localize);
                ViewData["title"] = DeatailTitle;
                ViewData["KeyName"] = DeatailKeyName;
                ViewData["ColumnAdjust"] = DeatailColumnAdjustView;
                ViewBag.ReadOnly = false;
                return PartialView(DeatailView);
            }
            try
            {
                var res = await Repository.GetById<VMD, D>(key);
                if (res == null) return Content("#"+ ErrorMessage(2), "text/plain");
                ViewData.ModelExplorer = row.For.ModelExplorer.GetExplorerForExpression(typeof(VMD), res);
                ViewData["id"] = "_" + Guid.NewGuid().ToString("N");
                ViewData["localizer"] = new Func<string, string>(localize);
                ViewData["title"]=DeatailTitle;
                ViewData["KeyName"] = DeatailKeyName;
                ViewData["ColumnAdjust"] = DeatailColumnAdjustView;
                ViewBag.ReadOnly = readOnly.HasValue && readOnly.Value;
                return PartialView(DeatailView, res);
            }
            catch
            {
                return Content("#"+ ErrorMessage(1), "text/plain");
            }
        }
        [HttpPost]
        public async Task<IActionResult> EditDetail(VMD vm, string rowId, bool isAdd)
        {
            getRow(rowId);
            if (!isAdd && (requiredFunctionalities & Functionalities.AnyEdit) == 0) return Json(new ModelError[1] { new ModelError(ErrorMessage(3)) });
            if (isAdd && (requiredFunctionalities & Functionalities.AnyAdd) == 0) return Json(new ModelError[1] { new ModelError(ErrorMessage(3)) });
            if (ModelState.IsValid)
            {
                try
                {
                    if (isAdd)
                        Repository.Add(DetailFull, vm);
                    else
                        Repository.Update(DetailFull, vm);
                    await Repository.SaveChanges();
                    return await Invoke(vm, false);
                }
                catch
                {
                    ModelState.AddModelError("", isAdd ? ErrorMessage(1) : ErrorMessage(5));
                    return Json(PackErrors(ModelState));
                }
            }
            else return Json(PackErrors(ModelState));
        }
    }
}
