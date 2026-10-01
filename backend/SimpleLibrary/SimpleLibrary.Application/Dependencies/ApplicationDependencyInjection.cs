using Microsoft.Extensions.DependencyInjection;

namespace SimpleLibrary.Application.Dependencies
{
    public static class ApplicationDependencyInjection
    {
        public static IServiceCollection AddApplicationLogic(this IServiceCollection services)
        {
            //services.AddScoped<, >();

            return services;
        }
    }
}
