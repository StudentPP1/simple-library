using SimpleLibrary.Core.Interfaces.Services;
using System.Net;
using System.Net.Mail;

namespace SimpleLibrary.API.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var host = _configuration["SmtpSettings:Host"];
                var port = int.Parse(_configuration["SmtpSettings:Port"]!);
                var user = _configuration["SmtpSettings:User"];
                var pass = _configuration["SmtpSettings:Password"];
                var from = _configuration["SmtpSettings:FromEmail"];

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage(from!, to, subject, body)
                {
                    IsBodyHtml = true
                };

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Лист успішно відправлено на {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка при відправці листа на {Email}", to);
            }
        }
    }
}
