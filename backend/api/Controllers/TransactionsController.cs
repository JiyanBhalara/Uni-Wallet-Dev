// Controllers/TransactionsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;
using SmartCampusWallet.Api.Services;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BudgetAlertService _budgetAlerts;

    public TransactionsController(AppDbContext db, BudgetAlertService budgetAlerts)
    {
        _db = db;
        _budgetAlerts = budgetAlerts;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
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

        var txs = await _db.Transactions
            .Where(t => t.UserId == user.Id)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(txs);
    }

    public record CreateTransactionRequest(
        int WalletId,
        decimal Amount,
        string Merchant,
        string PaymentMethod,
        string Location,
        string Category
    );

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest req)
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

        var wallet = await _db.Wallets.FirstOrDefaultAsync(
            w => w.Id == req.WalletId && w.UserId == user.Id);
        if (wallet == null) return BadRequest("Invalid wallet");

        var tx = new Transaction
        {
            UserId = user.Id,
            WalletId = wallet.Id,
            Amount = req.Amount,
            Merchant = req.Merchant,
            PaymentMethod = req.PaymentMethod,
            Location = req.Location,
            Date = DateTime.UtcNow,
            Category = string.IsNullOrWhiteSpace(req.Category) ? "Other" : req.Category
        };

        // Update wallet balance (positive adds, negative subtracts)
        wallet.Balance += req.Amount;

        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        // Trigger budget alerts (if you wired this earlier)
        await _budgetAlerts.CheckAndNotifyAsync(user.Id, user.Email, tx);

        return Ok(tx);
    }

    [HttpPost("upload-csv")]
    public async Task<IActionResult> UploadCsv([FromForm] IFormFile file, [FromForm] string userEmail)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null) return NotFound("User not found");

        using var reader = new StreamReader(file.OpenReadStream());
        string? header = await reader.ReadLineAsync();
        // Expecting: Date,Merchant,Amount,Category,PaymentMethod,Location,WalletId

        var created = new List<Transaction>();
        var errors = new List<string>();

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) continue;

            try
            {
                var parts = line.Split(',', StringSplitOptions.TrimEntries);
                if (parts.Length < 7)
                {
                    errors.Add($"Line skipped (insufficient columns): {line}");
                    continue;
                }

                if (!DateTime.TryParse(parts[0], out var date))
                {
                    errors.Add($"Invalid date in line: {line}");
                    date = DateTime.UtcNow;
                }
                var merchant = parts[1];
                if (!decimal.TryParse(parts[2], out var amount))
                {
                    errors.Add($"Invalid amount in line: {line}");
                    continue;
                }
                var category = string.IsNullOrWhiteSpace(parts[3]) ? "Other" : parts[3];
                var paymentMethod = parts[4];
                var location = parts[5];
                if (!int.TryParse(parts[6], out var walletId))
                {
                    errors.Add($"Invalid walletId in line: {line}");
                    continue;
                }

                var wallet = await _db.Wallets.FirstOrDefaultAsync(
                    w => w.Id == walletId && w.UserId == user.Id);
                if (wallet == null)
                {
                    errors.Add($"Wallet not found for line: {line}");
                    continue;
                }

                var tx = new Transaction
                {
                    UserId = user.Id,
                    WalletId = wallet.Id,
                    Amount = amount,
                    Merchant = merchant,
                    PaymentMethod = paymentMethod,
                    Location = location,
                    Date = date,
                    Category = category
                };

                wallet.Balance += amount;
                _db.Transactions.Add(tx);
                created.Add(tx);
            }
            catch (Exception ex)
            {
                errors.Add($"Error processing line '{line}': {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();

        // Optionally loop and check alerts per transaction
        foreach (var tx in created)
        {
            await _budgetAlerts.CheckAndNotifyAsync(user.Id, user.Email, tx);
        }

        return Ok(new { count = created.Count, errors = errors });
    }
}
