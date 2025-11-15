using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly AppDbContext _db;

    public WalletsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetWallets()
    {
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        
        if (string.IsNullOrEmpty(userEmail))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var wallets = await _db.Wallets
            .Where(w => w.UserId == user.Id)
            .ToListAsync();
        return Ok(wallets);
    }
}
