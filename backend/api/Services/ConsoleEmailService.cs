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

    public Task SendBudgetAlertAsync(string toEmail, string category, decimal limit, decimal spent, decimal ratio)
    {
        // In real world, plug in SendGrid / SMTP here.
        _logger.LogInformation(
            "Budget alert to {Email}: Category {Category} is at {Ratio:P0} ({Spent}/{Limit})",
            toEmail, category, ratio, spent, limit);

        return Task.CompletedTask;
    }
}
