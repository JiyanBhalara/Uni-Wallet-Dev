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

        // Get user name for email personalization
        var user = await _db.Users.FindAsync(userId);
        var userName = user?.FullName ?? "User";

        var budgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.IsActive && b.Category == category)
            .ToListAsync();

        if (!budgets.Any()) return;

        foreach (var budget in budgets)
        {
            var (periodStart, periodEnd) = GetCurrentPeriodRange(budget.PeriodType);

            // Reset flags if we're in a new period
            if (budget.LastAlertSentAt != null && budget.LastAlertSentAt < periodStart)
            {
                budget.OverBudgetAlertSent = false;
            }

            // Get all transactions in this period for this category
            var periodTransactions = await _db.Transactions
                .Where(t =>
                    t.UserId == userId &&
                    t.Category == category &&
                    t.Date >= periodStart &&
                    t.Date < periodEnd &&
                    t.Amount < 0)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            var spentInPeriod = periodTransactions.Sum(t => t.Amount);
            var spentPositive = Math.Abs(spentInPeriod);
            if (spentPositive <= 0) continue;

            var ratio = spentPositive / budget.LimitAmount;

            // Determine if we should send an alert
            bool shouldSendAlert = false;
            bool isOver100 = ratio >= 1.0m;

            // Send alert if:
            // 1. Over 80% and no alert sent this period yet, OR
            // 2. Over 100% and haven't sent 100% alert this period yet
            if (ratio >= 0.8m && (budget.LastAlertSentAt == null || budget.LastAlertSentAt < periodStart))
            {
                // First alert (80%+)
                shouldSendAlert = true;
            }
            else if (isOver100 && budget.LastAlertSentAt != null && !budget.OverBudgetAlertSent)
            {
                // Second alert (100%+) - only if we haven't sent 100% alert yet
                shouldSendAlert = true;
            }

            if (shouldSendAlert)
            {
                // Prepare transaction summaries for email
                var recentTransactionSummaries = periodTransactions
                    .Take(10)
                    .Select(t => new TransactionSummary
                    {
                        Merchant = t.Merchant,
                        Amount = t.Amount,
                        Date = t.Date,
                        Location = t.Location
                    })
                    .ToList();

                await _email.SendBudgetAlertAsync(
                    userEmail,
                    userName,
                    category,
                    budget.LimitAmount,
                    spentPositive,
                    ratio,
                    recentTransactionSummaries
                );

                budget.LastAlertSentAt = DateTime.UtcNow;
                
                // Mark that we've sent the 100% alert
                if (isOver100)
                {
                    budget.OverBudgetAlertSent = true;
                }
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
