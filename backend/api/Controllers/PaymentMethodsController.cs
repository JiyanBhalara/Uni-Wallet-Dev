// Controllers/PaymentMethodsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentMethodsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PaymentMethodsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine()
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

        var methods = await _db.PaymentMethods
            .Where(pm => pm.UserId == user.Id)
            .OrderByDescending(pm => pm.CreatedAt)
            .ToListAsync();
        return Ok(methods);
    }

    public record CreatePaymentMethodRequest(
        PaymentMethodType Type,
        string Label,
        string CardOrAccountNumber,
        string? Brand,
        bool IsDefault
    );

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentMethodRequest req)
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

        var userId = user.Id;

        // Mask number – don’t store full PAN in real prod
        var last4 = req.CardOrAccountNumber[^4..];
        var masked = "**** **** **** " + last4;

        var method = new PaymentMethod
        {
            UserId = userId,
            Type = req.Type,
            Label = req.Label,
            MaskedNumber = masked,
            Last4 = last4,
            Brand = req.Brand,
            IsDefault = req.IsDefault
        };

        if (req.IsDefault)
        {
            var others = await _db.PaymentMethods
                .Where(pm => pm.UserId == userId && pm.IsDefault)
                .ToListAsync();
            foreach (var m in others) m.IsDefault = false;
        }

        _db.PaymentMethods.Add(method);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMine), new { id = method.Id }, method);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
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

        var method = await _db.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == id && pm.UserId == user.Id);

        if (method == null) return NotFound();

        _db.PaymentMethods.Remove(method);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
