using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

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

    // GET: api/wallets
    [HttpGet]
    public async Task<IActionResult> GetWallets()
    {
        var wallets = await _db.Wallets.ToListAsync();
        return Ok(wallets);
    }

    // ---- NEW: Top-up endpoint ----

    public record TopUpRequest(decimal Amount, string SourceType, string? SourceLabel);

    // POST: api/wallets/{walletId}/topup
    [HttpPost("{walletId:int}/topup")]
    public async Task<IActionResult> TopUp(int walletId, [FromBody] TopUpRequest req)
    {
        if (req is null || req.Amount <= 0)
        {
            return BadRequest("Amount must be greater than 0.");
        }

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.Id == walletId);
        if (wallet == null)
        {
            return NotFound($"Wallet {walletId} not found.");
        }

        // increase balance
        wallet.Balance += req.Amount;

        // create a transaction record so it shows in Recent Activity
        var tx = new Transaction
        {
          UserId = wallet.UserId,
          WalletId = wallet.Id,
          Amount = req.Amount,                      // positive top-up
          Currency = wallet.Currency,
          Timestamp = DateTime.UtcNow,
          Description = BuildTopUpDescription(req),
          Category = "Top-up",
          IsOnCampus = false
        };

        _db.Transactions.Add(tx);

        await _db.SaveChangesAsync();

        // You can return the updated wallet or the transaction; frontend only
        // checks status code right now, so either is fine.
        return Ok(new
        {
            wallet.Id,
            wallet.Balance,
            wallet.Currency
        });
    }

    private static string BuildTopUpDescription(TopUpRequest req)
    {
        var label = string.IsNullOrWhiteSpace(req.SourceLabel)
            ? req.SourceType
            : $"{req.SourceType} ({req.SourceLabel})";

        return $"Wallet top-up via {label}";
    }
}
