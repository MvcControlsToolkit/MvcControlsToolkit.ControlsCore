using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using MvcControlsToolkit.Core.TagHelpers;
using MvcControlsToolkit.Core.TagHelpers.Providers;

namespace MvcControlsToolkit.Core.Extensions
{
    public static class ControlsDIExtensions
    {
        public static IServiceCollection AddMvcControlsToolkitControls(this IServiceCollection services, 
            Action<MvcControlsToolkitOptions> setupAction = null,
            Type defaultTagHelpersProviderType=null, 
            ITagHelpersProvider defaultTagHelpersProviderInstance=null
        )
        {
            services.AddLocalization();
            if (defaultTagHelpersProviderType == null)
            {
                defaultTagHelpersProviderInstance = null;
                defaultTagHelpersProviderType = typeof(DefaultServerControlsTagHelpersProvider);
            }
            if (defaultTagHelpersProviderInstance == null)
                defaultTagHelpersProviderInstance = Activator.CreateInstance(defaultTagHelpersProviderType) as ITagHelpersProvider;
            services.AddTagHelpersProvider(defaultTagHelpersProviderType, defaultTagHelpersProviderInstance);

            services.AddMvcControlsToolkit((o) => { o.DefaultProvider = defaultTagHelpersProviderInstance; });
            
            services.Configure<RazorViewEngineOptions>(options =>
                 {
                     options.FileProviders.Add(
                       new EmbeddedFileProvider(typeof(ControlsDIExtensions).GetTypeInfo().Assembly,
                       "MvcControlsToolkit.ControlsCore"));
                  }
            );
            if (setupAction != null)
                services.Configure(setupAction);
            return services;
        }
    }
}
