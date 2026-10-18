using SimpleLibrary.Core.Interfaces.Services;

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

                    int cancelledCount = await loanService.CancelExpiredReservationsAsync();

                    if (cancelledCount > 0)
                    {
                        _logger.LogInformation("Автоматично скасовано {Count} прострочених бронювань.", cancelledCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Критична помилка під час фонового очищення бронювань.");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
