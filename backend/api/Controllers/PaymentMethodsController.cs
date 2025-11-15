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

    private int GetCurrentUserId() => 1; // TODO: replace with auth

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetCurrentUserId();
        var methods = await _db.PaymentMethods
            .Where(pm => pm.UserId == userId)
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
        var userId = GetCurrentUserId();

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
        var userId = GetCurrentUserId();
        var method = await _db.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == id && pm.UserId == userId);

        if (method == null) return NotFound();

        _db.PaymentMethods.Remove(method);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
