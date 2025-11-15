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

    public BudgetsController(AppDbContext db)
    {
        _db = db;
    }

    private int GetCurrentUserId() => 1; // TODO: hook into auth

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetCurrentUserId();
        var budgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.IsActive)
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
        var userId = GetCurrentUserId();

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
}
