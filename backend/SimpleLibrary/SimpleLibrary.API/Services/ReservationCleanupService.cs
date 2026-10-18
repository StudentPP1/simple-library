using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.DataAccess.Postgres;

namespace SimpleLibrary.API.Services
{
    public class ReservationCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReservationCleanupService> _logger;

        public ReservationCleanupService(IServiceProvider serviceProvider, ILogger<ReservationCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Фоновий сервіс очищення бронювань запущено.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var loanService = scope.ServiceProvider.GetRequiredService<ILoanService>();

                    await loanService.CancelExpiredReservationsAsync();

                    _logger.LogInformation("Цикл перевірки прострочених бронювань завершено.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Помилка під час фонового очищення бронювань.");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
