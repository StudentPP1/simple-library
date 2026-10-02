using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.DataAccess.Postgres.Repositories;
using SimpleLibrary.DataAccess.Postgres.UnitsOfWork;

namespace SimpleLibrary.DataAccess.Postgres.Dependencies
{
    public static class DataAccessDependencyInjection
    {
        public static IServiceCollection AddDataAccess(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<LibraryDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
