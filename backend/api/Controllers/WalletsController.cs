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
        var wallets = await _db.Wallets.ToListAsync();
        return Ok(wallets);
    }
}
