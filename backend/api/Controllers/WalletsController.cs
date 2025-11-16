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
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        if (string.IsNullOrEmpty(userEmail))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found" });
        }

        var wallets = await _db.Wallets.Where(w => w.UserId == user.Id).ToListAsync();
        return Ok(wallets);
    }

    // ---- NEW: Top-up endpoint ----

    public record TopUpRequest(decimal Amount, string SourceType, string? SourceLabel);

    // POST: api/wallets/{walletId}/topup
    [HttpPost("{walletId:int}/topup")]
    public async Task<IActionResult> TopUp(int walletId, [FromBody] TopUpRequest req)
    {
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        if (string.IsNullOrEmpty(userEmail))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found" });
        }

        if (req is null || req.Amount <= 0)
        {
            return BadRequest("Amount must be greater than 0.");
        }

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == user.Id);
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
          Merchant = BuildTopUpDescription(req),
          PaymentMethod = req.SourceType,
          Location = "Online",
          Date = DateTime.UtcNow,
          Category = "Top-up"
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
