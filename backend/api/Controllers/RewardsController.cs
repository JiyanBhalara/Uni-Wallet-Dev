// Controllers/RewardsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RewardsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RewardsController(AppDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetUserByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    // GET: api/rewards/balance?userEmail=...
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance([FromQuery] string userEmail)
    {
        var user = await GetUserByEmailAsync(userEmail);
        if (user == null) return NotFound("User not found");

        var summary = await _db.RewardSummaries
            .FirstOrDefaultAsync(r => r.UserId == user.Id);

        if (summary == null)
        {
            // Create default summary
            summary = new RewardSummary
            {
                UserId = user.Id,
                Points = 0,
                Tier = "Bronze",
                NextTierAt = 500
            };
            _db.RewardSummaries.Add(summary);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            points = summary.Points,
            tier = summary.Tier,
            nextTierAt = summary.NextTierAt
        });
    }

    // GET: api/rewards/history?userEmail=...
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string userEmail)
    {
        var user = await GetUserByEmailAsync(userEmail);
        if (user == null) return NotFound("User not found");

        var events = await _db.RewardEvents
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.OccurredAt)
            .Take(50)
            .ToListAsync();

        return Ok(events);
    }

    // GET: api/rewards/recommendations?userEmail=...
    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations([FromQuery] string userEmail)
    {
        var user = await GetUserByEmailAsync(userEmail);
        if (user == null) return NotFound("User not found");

        // Get user's attended events to find their preferences
        var attendedEvents = await _db.EventAttendances
            .Where(a => a.UserId == user.Id && a.CheckedIn)
            .Include(a => a.Event)
            .Select(a => a.Event)
            .ToListAsync();

        if (attendedEvents.Count == 0)
        {
            // No history, return popular upcoming events
            var popularEvents = await _db.Events
                .Where(e => e.StartTime > DateTime.UtcNow)
                .OrderBy(e => e.StartTime)
                .Take(5)
                .ToListAsync();

            return Ok(popularEvents.Select(e => new
            {
                e.Id,
                e.EventCode,
                e.Name,
                e.Category,
                e.Location,
                e.StartTime,
                e.EndTime,
                e.Cost,
                recommendationReason = "Popular upcoming event"
            }));
        }

        // Find user's preferred categories
        var categoryFrequency = attendedEvents
            .GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();

        var topCategories = categoryFrequency.Take(3).Select(c => c.Category).ToList();

        // Get events in those categories that user hasn't RSVPed to
        var rsvpedEventIds = await _db.EventAttendances
            .Where(a => a.UserId == user.Id && a.Rsvped)
            .Select(a => a.EventId)
            .ToListAsync();

        var recommendedEvents = await _db.Events
            .Where(e => topCategories.Contains(e.Category) 
                     && e.StartTime > DateTime.UtcNow
                     && !rsvpedEventIds.Contains(e.Id))
            .OrderBy(e => e.StartTime)
            .Take(5)
            .ToListAsync();

        return Ok(recommendedEvents.Select(e => new
        {
            e.Id,
            e.EventCode,
            e.Name,
            e.Category,
            e.Location,
            e.StartTime,
            e.EndTime,
            e.Cost,
            recommendationReason = $"Based on your interest in {e.Category} events"
        }));
    }

    public record RedeemRequest(string UserEmail, int WalletId, int PointsToRedeem);

    // POST: api/rewards/redeem
    [HttpPost("redeem")]
    public async Task<IActionResult> RedeemPoints([FromBody] RedeemRequest req)
    {
        var user = await GetUserByEmailAsync(req.UserEmail);
        if (user == null) return NotFound("User not found");

        var wallet = await _db.Wallets.FindAsync(req.WalletId);
        if (wallet == null) return NotFound("Wallet not found");

        if (wallet.UserId != user.Id)
            return BadRequest("Wallet does not belong to user");

        if (req.PointsToRedeem <= 0)
            return BadRequest("Points to redeem must be positive");

        // Get or create reward summary
        var summary = await _db.RewardSummaries
            .FirstOrDefaultAsync(r => r.UserId == user.Id);

        if (summary == null)
        {
            summary = new RewardSummary
            {
                UserId = user.Id,
                Points = 0,
                Tier = "Bronze",
                NextTierAt = 500
            };
            _db.RewardSummaries.Add(summary);
            await _db.SaveChangesAsync();
        }

        if (summary.Points < req.PointsToRedeem)
            return BadRequest($"Insufficient points. You have {summary.Points} points.");

        // Conversion rate: 10 points = $1
        var cashbackAmount = req.PointsToRedeem / 10.0m;

        if (cashbackAmount <= 0)
            return BadRequest("Minimum redemption is 10 points ($1.00)");

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Deduct points
            summary.Points -= req.PointsToRedeem;

            // Update tier if needed
            UpdateTier(summary);

            // Add cashback to wallet
            wallet.Balance += cashbackAmount;

            // Create reward event for redemption
            var rewardEvent = new RewardEvent
            {
                UserId = user.Id,
                OccurredAt = DateTime.UtcNow,
                PointsDelta = -req.PointsToRedeem,
                Reason = $"Redeemed {req.PointsToRedeem} points for ${cashbackAmount:F2} cashback"
            };
            _db.RewardEvents.Add(rewardEvent);

            // Create transaction record
            var txn = new Transaction
            {
                UserId = user.Id,
                WalletId = wallet.Id,
                Merchant = "Smart Campus Wallet",
                Category = "Rewards Cashback",
                Amount = cashbackAmount,
                PaymentMethod = "Rewards Redemption",
                Location = "Campus",
                Date = DateTime.UtcNow
            };
            _db.Transactions.Add(txn);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                pointsRedeemed = req.PointsToRedeem,
                cashbackAmount = cashbackAmount,
                remainingPoints = summary.Points,
                newBalance = wallet.Balance
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Redemption failed: {ex.Message}");
        }
    }

    private void UpdateTier(RewardSummary summary)
    {
        if (summary.Points >= 2000)
        {
            summary.Tier = "Platinum";
            summary.NextTierAt = 5000;
        }
        else if (summary.Points >= 1000)
        {
            summary.Tier = "Gold";
            summary.NextTierAt = 2000;
        }
        else if (summary.Points >= 500)
        {
            summary.Tier = "Silver";
            summary.NextTierAt = 1000;
        }
        else
        {
            summary.Tier = "Bronze";
            summary.NextTierAt = 500;
        }
    }
}
