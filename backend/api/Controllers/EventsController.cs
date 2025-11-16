// Controllers/EventsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

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

    private async Task<User?> GetUserByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public record EventDto(
        int Id,
        string EventCode,
        string Name,
        string Category,
        string Location,
        DateTime StartTime,
        DateTime EndTime,
        string Tags,
        decimal Cost,
        bool Rsvped,
        bool CheckedIn
    );

    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] string userEmail)
    {
        var user = await GetUserByEmailAsync(userEmail);
        if (user == null) return NotFound("User not found");

        var events = await _db.Events
            .OrderBy(e => e.StartTime)
            .ToListAsync();

        var attendanceLookup = await _db.EventAttendances
            .Where(a => a.UserId == user.Id)
            .ToDictionaryAsync(a => a.EventId, a => a);

        var dtos = events.Select(e =>
        {
            attendanceLookup.TryGetValue(e.Id, out var att);

            return new EventDto(
                e.Id,
                e.EventCode,
                e.Name,
                e.Category,
                e.Location,
                e.StartTime,
                e.EndTime,
                e.Tags,
                e.Cost,
                Rsvped: att?.Rsvped ?? false,
                CheckedIn: att?.CheckedIn ?? false
            );
        });

        return Ok(dtos);
    }

    public record RsvpRequest(string UserEmail);

    [HttpPost("{eventId:int}/rsvp")]
    public async Task<IActionResult> Rsvp(int eventId, [FromBody] RsvpRequest req)
    {
        var user = await GetUserByEmailAsync(req.UserEmail);
        if (user == null) return NotFound("User not found");

        var ev = await _db.Events.FindAsync(eventId);
        if (ev == null) return NotFound("Event not found");

        var att = await _db.EventAttendances
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == user.Id);

        if (att == null)
        {
            att = new EventAttendance
            {
                EventId = ev.Id,
                UserId = user.Id,
                Rsvped = true,
                RsvpedAt = DateTime.UtcNow
            };
            _db.EventAttendances.Add(att);
        }
        else
        {
            att.Rsvped = true;
            att.RsvpedAt ??= DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    public record PayAndRsvpRequest(string UserEmail, int WalletId);

    [HttpPost("{eventId:int}/pay-and-rsvp")]
    public async Task<IActionResult> PayAndRsvp(int eventId, [FromBody] PayAndRsvpRequest req)
    {
        var user = await GetUserByEmailAsync(req.UserEmail);
        if (user == null) return NotFound("User not found");

        var ev = await _db.Events.FindAsync(eventId);
        if (ev == null) return NotFound("Event not found");

        var wallet = await _db.Wallets.FindAsync(req.WalletId);
        if (wallet == null) return NotFound("Wallet not found");

        if (wallet.UserId != user.Id)
            return BadRequest("Wallet does not belong to user");

        // Check sufficient balance
        if (wallet.Balance < ev.Cost)
            return BadRequest("Insufficient wallet balance");

        // Start transaction
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Deduct from wallet
            wallet.Balance -= ev.Cost;

            // Create transaction record
            var txn = new Transaction
            {
                UserId = user.Id,
                WalletId = wallet.Id,
                Merchant = ev.Name,
                Category = "Events",
                Amount = -ev.Cost, // Negative for deduction
                PaymentMethod = wallet.DisplayName,
                Location = ev.Location,
                Date = DateTime.UtcNow
            };
            _db.Transactions.Add(txn);

            // Create or update RSVP
            var att = await _db.EventAttendances
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == user.Id);

            if (att == null)
            {
                att = new EventAttendance
                {
                    EventId = ev.Id,
                    UserId = user.Id,
                    Rsvped = true,
                    RsvpedAt = DateTime.UtcNow
                };
                _db.EventAttendances.Add(att);
            }
            else
            {
                att.Rsvped = true;
                att.RsvpedAt ??= DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { success = true, transactionId = txn.Id });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Payment failed: {ex.Message}");
        }
    }

    public record CheckInRequest(string UserEmail);

    [HttpPost("{eventId:int}/checkin")]
    public async Task<IActionResult> CheckIn(int eventId, [FromBody] CheckInRequest req)
    {
        var user = await GetUserByEmailAsync(req.UserEmail);
        if (user == null) return NotFound("User not found");

        var ev = await _db.Events.FindAsync(eventId);
        if (ev == null) return NotFound("Event not found");

        var now = DateTime.Now;
        if (now < ev.StartTime || now > ev.EndTime)
        {
            return BadRequest($"Check-in is only available during the event window. Event runs from {ev.StartTime:g} to {ev.EndTime:g}. Current time: {now:g}");
        }

        var att = await _db.EventAttendances
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == user.Id);

        if (att == null || !att.Rsvped)
        {
            // auto-RSVP if they show up without RSVPing
            if (att == null)
            {
                att = new EventAttendance
                {
                    EventId = ev.Id,
                    UserId = user.Id,
                    Rsvped = true,
                    RsvpedAt = DateTime.UtcNow
                };
                _db.EventAttendances.Add(att);
            }
            else
            {
                att.Rsvped = true;
                att.RsvpedAt ??= DateTime.UtcNow;
            }
        }

        att.CheckedIn = true;
        att.CheckedInAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok();
    }

    // Summary for activity page: RSVP vs attended
    [HttpGet("attendance-summary")]
    public async Task<IActionResult> GetAttendanceSummary([FromQuery] string userEmail)
    {
        var user = await GetUserByEmailAsync(userEmail);
        if (user == null) return NotFound("User not found");

        var attendances = await _db.EventAttendances
            .Where(a => a.UserId == user.Id && a.Rsvped)
            .ToListAsync();

        var totalRsvped = attendances.Count;
        var attended = attendances.Count(a => a.CheckedIn);

        return Ok(new
        {
            totalRsvped,
            attended,
            missed = totalRsvped - attended
        });
    }
}
