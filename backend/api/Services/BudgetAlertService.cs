// Services/BudgetAlertService.cs
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Services;

public class BudgetAlertService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;

    public BudgetAlertService(AppDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

    public async Task CheckAndNotifyAsync(int userId, string userEmail, Transaction transaction)
    {
        // Only care about spending (negative amounts)
        if (transaction.Amount >= 0) return;

        var category = (transaction.Category ?? "Other").Trim();
        if (string.IsNullOrEmpty(category)) category = "Other";

        var budgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.IsActive && b.Category == category)
            .ToListAsync();

        if (!budgets.Any()) return;

        foreach (var budget in budgets)
        {
            var (periodStart, periodEnd) = GetCurrentPeriodRange(budget.PeriodType);

            var spentInPeriod = await _db.Transactions
                .Where(t =>
                    t.UserId == userId &&
                    t.Category == category &&
                    t.Date >= periodStart &&
                    t.Date < periodEnd &&
                    t.Amount < 0)
                .SumAsync(t => t.Amount);

            var spentPositive = Math.Abs(spentInPeriod);
            if (spentPositive <= 0) continue;

            var ratio = spentPositive / budget.LimitAmount;

            // Only send once per period once they cross 80%
            if (ratio >= 0.8m &&
                (budget.LastAlertSentAt == null || budget.LastAlertSentAt < periodStart))
            {
                await _email.SendBudgetAlertAsync(
                    userEmail,
                    category,
                    budget.LimitAmount,
                    spentPositive,
                    ratio
                );

                budget.LastAlertSentAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
    }

    private static (DateTime start, DateTime end) GetCurrentPeriodRange(BudgetPeriodType type)
    {
        var now = DateTime.UtcNow;

        if (type == BudgetPeriodType.Weekly)
        {
            // start of week = Monday UTC
            int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
            var start = now.Date.AddDays(-diff);
            var end = start.AddDays(7);
            return (start, end);
        }
        else
        {
            // Monthly
            var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);
            return (start, end);
        }
    }
}
