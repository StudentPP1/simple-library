using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleLibrary.API;
using SimpleLibrary.API.Dependencies;
using SimpleLibrary.Application.Dependencies;
using SimpleLibrary.DataAccess.Postgres;
using SimpleLibrary.DataAccess.Postgres.Dependencies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationLogic();
builder.Services.AddDataAccess(builder.Configuration);
builder.Services.AddApiServices(builder.Configuration);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            var response = new ApiResponse<Dictionary<string, string[]>>(false, "Помилка валідації.", errors);

            return new BadRequestObjectResult(response);
        };
    });
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<LibraryDbContext>();

        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogCritical(ex, "Сталася помилка під час застосування міграцій до бази даних. Запуск застосунку зупинено.");

        throw;
    }
}

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(ApiDependencyInjection.CorsPolicyName);

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
