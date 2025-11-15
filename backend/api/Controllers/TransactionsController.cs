using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TransactionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
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

        var tx = await _db.Transactions
            .Where(t => t.UserId == user.Id)
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();

        return Ok(tx);
    }
}
