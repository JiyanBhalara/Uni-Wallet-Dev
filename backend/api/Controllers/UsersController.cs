using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public IActionResult GetMe()
    {
        var user = _db.Users.FirstOrDefault();
        return Ok(user);
    }
}
