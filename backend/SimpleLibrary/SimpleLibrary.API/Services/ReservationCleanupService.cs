using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Enums;
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
                    var dbContext = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();

                    var expirationDate = DateTime.UtcNow.AddDays(-3);

                    var expiredLoans = await dbContext.Loans
                        .Include(l => l.BookCopy)
                        .Where(l => l.Status == LoanStatus.Pending && l.ReservedAt <= expirationDate)
                        .ToListAsync(stoppingToken);

                    if (expiredLoans.Any())
                    {
                        foreach (var loan in expiredLoans)
                        {
                            loan.Cancel();

                            if (loan.BookCopy != null)
                            {
                                loan.BookCopy.ChangeStatus(CopyStatus.Available);
                            }
                        }

                        await dbContext.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation($"Автоматично скасовано {expiredLoans.Count} прострочених бронювань.");
                    }
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
