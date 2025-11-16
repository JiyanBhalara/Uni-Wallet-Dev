// Services/BudgetAlertService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Services;

public class BudgetAlertService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<BudgetAlertService> _logger;

    public BudgetAlertService(AppDbContext db, IEmailService email, ILogger<BudgetAlertService> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task CheckAndNotifyAsync(int userId, string userEmail, Transaction transaction)
    {
        _logger.LogInformation("🔍 CheckAndNotifyAsync called for UserId={UserId}, Email={Email}, Amount={Amount}, Category={Category}",
            userId, userEmail, transaction.Amount, transaction.Category);

        // Only care about spending (negative amounts)
        if (transaction.Amount >= 0)
        {
            _logger.LogInformation("⏭️ Skipping: Amount is positive (income), not spending");
            return;
        }

        var category = (transaction.Category ?? "Other").Trim();
        if (string.IsNullOrEmpty(category)) category = "Other";

        _logger.LogInformation("📂 Category: {Category}", category);

        // Get user name for email personalization
        var user = await _db.Users.FindAsync(userId);
        var userName = user?.FullName ?? "User";

        _logger.LogInformation("👤 User: {UserName}", userName);

        var budgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.IsActive && b.Category == category)
            .ToListAsync();

        _logger.LogInformation("💰 Found {BudgetCount} active budget(s) for category {Category}", budgets.Count, category);

        if (!budgets.Any())
        {
            _logger.LogInformation("⏭️ No active budgets found for this category. Skipping.");
            return;
        }

        foreach (var budget in budgets)
        {
            _logger.LogInformation("📊 Checking budget: Id={BudgetId}, Limit={Limit}, Period={Period}",
                budget.Id, budget.LimitAmount, budget.PeriodType);

            var (periodStart, periodEnd) = GetCurrentPeriodRange(budget.PeriodType);

            _logger.LogInformation("📅 Period: {Start} to {End}", periodStart, periodEnd);

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

            _logger.LogInformation("🧾 Found {TransactionCount} transactions in period", periodTransactions.Count);

            var spentInPeriod = periodTransactions.Sum(t => t.Amount);
            var spentPositive = Math.Abs(spentInPeriod);

            _logger.LogInformation("💸 Spent in period: ${Spent} / ${Limit} = {Ratio:P1}",
                spentPositive, budget.LimitAmount, spentPositive / budget.LimitAmount);

            if (spentPositive <= 0)
            {
                _logger.LogInformation("⏭️ No spending in this period. Skipping.");
                continue;
            }

            var ratio = spentPositive / budget.LimitAmount;

            _logger.LogInformation("🚦 Ratio check: {Ratio:P1} >= 80%? {IsOver80}. LastAlert: {LastAlert}",
                ratio, ratio >= 0.8m, budget.LastAlertSentAt);

            // Only send once per period once they cross 80%
            if (ratio >= 0.8m &&
                (budget.LastAlertSentAt == null || budget.LastAlertSentAt < periodStart))
            {
                _logger.LogWarning("⚠️ ALERT THRESHOLD CROSSED! Preparing to send email...");

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

                _logger.LogInformation("📧 Sending email to {Email} with {TransactionCount} transactions",
                    userEmail, recentTransactionSummaries.Count);
                _logger.LogWarning("📮 EMAIL RECIPIENT: {Email}", userEmail);
                _logger.LogWarning("👤 USER NAME: {UserName}", userName);

                try
                {
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
                    _logger.LogInformation("✅ Email sent successfully! LastAlertSentAt updated to {Time}", budget.LastAlertSentAt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to send budget alert email");
                    throw;
                }
            }
            else
            {
                _logger.LogInformation("⏭️ Alert condition not met. Skipping email.");
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
