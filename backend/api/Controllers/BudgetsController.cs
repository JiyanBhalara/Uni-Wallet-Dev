// Controllers/BudgetsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;
using SmartCampusWallet.Api.Services;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BudgetAlertService _budgetAlertService;

    public BudgetsController(AppDbContext db, BudgetAlertService budgetAlertService)
    {
        _db = db;
        _budgetAlertService = budgetAlertService;
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

        var budgets = await _db.Budgets
            .Where(b => b.UserId == user.Id && b.IsActive)
            .ToListAsync();
        return Ok(budgets);
    }

    public record BudgetUpsertDto(
        string Category,
        decimal LimitAmount,
        BudgetPeriodType PeriodType
    );

    public record SaveBudgetsRequest(List<BudgetUpsertDto> Budgets);

    [HttpPost]
    public async Task<IActionResult> SaveBudgets([FromBody] SaveBudgetsRequest request)
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

        // Soft-disable any existing budgets not present anymore
        var existing = await _db.Budgets
            .Where(b => b.UserId == userId)
            .ToListAsync();

        var incomingCategories = request.Budgets
            .Select(b => b.Category.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var old in existing)
        {
            if (!incomingCategories.Contains(old.Category))
            {
                old.IsActive = false;
            }
        }

        foreach (var dto in request.Budgets)
        {
            var category = dto.Category.Trim();
            if (string.IsNullOrWhiteSpace(category) || dto.LimitAmount <= 0)
                continue;

            var existingBudget = existing.FirstOrDefault(
                b => b.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            if (existingBudget == null)
            {
                _db.Budgets.Add(new Budget
                {
                    UserId = userId,
                    Category = category,
                    LimitAmount = dto.LimitAmount,
                    PeriodType = dto.PeriodType,
                    IsActive = true
                });
            }
            else
            {
                existingBudget.LimitAmount = dto.LimitAmount;
                existingBudget.PeriodType = dto.PeriodType;
                existingBudget.IsActive = true;
            }
        }

        await _db.SaveChangesAsync();

        var updated = await _db.Budgets
            .Where(b => b.UserId == userId && b.IsActive)
            .ToListAsync();

        return Ok(updated);
    }

    // Test endpoint to manually trigger budget check
    [HttpPost("test-alert/{userId}")]
    public async Task<IActionResult> TestAlert(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Get the most recent transaction for this user
        var transaction = await _db.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .FirstOrDefaultAsync();

        if (transaction == null)
        {
            return NotFound(new { message = "No transactions found for this user" });
        }

        // Trigger the budget alert check
        await _budgetAlertService.CheckAndNotifyAsync(userId, user.Email, transaction);

        return Ok(new
        {
            message = "Budget alert check triggered. Check console logs for details.",
            userId = userId,
            userEmail = user.Email,
            transaction = new
            {
                id = transaction.Id,
                amount = transaction.Amount,
                category = transaction.Category,
                date = transaction.Date
            }
        });
    }
}
