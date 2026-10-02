using Microsoft.EntityFrameworkCore;
using SimpleLibrary.API.Dependencies;
using SimpleLibrary.Application.Dependencies;
using SimpleLibrary.DataAccess.Postgres;
using SimpleLibrary.DataAccess.Postgres.Dependencies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationLogic();
builder.Services.AddDataAccess(builder.Configuration);
builder.Services.AddApiServices(builder.Configuration);

builder.Services.AddControllers();
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
        logger.LogError(ex, "Сталася помилка під час застосування міграцій до бази даних.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
