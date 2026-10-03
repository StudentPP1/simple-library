using Microsoft.Extensions.DependencyInjection;
using SimpleLibrary.Application.Services;
using SimpleLibrary.Core.Interfaces.Services;

namespace SimpleLibrary.Application.Dependencies
{
    public static class ApplicationDependencyInjection
    {
        public static IServiceCollection AddApplicationLogic(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
    }
}
