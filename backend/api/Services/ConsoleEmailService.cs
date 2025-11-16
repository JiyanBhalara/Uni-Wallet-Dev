// Services/ConsoleEmailService.cs
using Microsoft.Extensions.Logging;

namespace SmartCampusWallet.Api.Services;

public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;

    public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendBudgetAlertAsync(
        string toEmail,
        string userName,
        string category,
        decimal limit,
        decimal spent,
        decimal ratio,
        List<TransactionSummary> recentTransactions)
    {
        // In real world, plug in SendGrid / SMTP here.
        _logger.LogInformation(
            "Budget alert to {Email} ({UserName}): Category {Category} is at {Ratio:P0} ({Spent}/{Limit}). {TransactionCount} recent transactions.",
            toEmail, userName, category, ratio, spent, limit, recentTransactions?.Count ?? 0);

        return Task.CompletedTask;
    }
}
