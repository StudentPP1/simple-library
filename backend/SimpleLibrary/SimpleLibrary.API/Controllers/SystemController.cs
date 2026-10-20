using Microsoft.AspNetCore.Mvc;
using SimpleLibrary.DataAccess.Postgres;

namespace SimpleLibrary.API.Controllers
{
    /// <summary>
    /// Системний контролер для технічних перевірок інфраструктури (тимчасовий для Спринту 1).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public SystemController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpGet("test-db")]
        public async Task<IActionResult> TestDatabaseConnection()
        {
            try
            {
                bool canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    return Ok(new
                    {
                        Status = "Success",
                        Message = "БД працює! Міграції застосовано."
                    });
                }

                return StatusCode(500, new
                {
                    Status = "Error",
                    Message = "Не вдалося підключитися до БД."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Status = "Exception", Message = ex.Message });
            }
        }
    }
}