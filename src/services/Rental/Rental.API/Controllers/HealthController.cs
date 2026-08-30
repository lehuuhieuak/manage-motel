using Microsoft.AspNetCore.Mvc;

namespace Rental.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet("live")]
        public IActionResult GetLive()
        {
            return Ok(new
            {
                Status = "ok"
            });
        }

        [HttpGet("ready")]
        public IActionResult GetReady()
        {
            return Ok(new
            {
                Status = "ready"
            });
        }
    }
}
