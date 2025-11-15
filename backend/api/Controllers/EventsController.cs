using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EventsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetEvents()
    {
        var eventsList = await _db.Events.ToListAsync();
        return Ok(eventsList);
    }
}
