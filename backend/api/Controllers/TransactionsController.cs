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
        var tx = await _db.Transactions
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();

        return Ok(tx);
    }
}
