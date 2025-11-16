using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Services;
using System.Text.Json;

namespace SmartCampusWallet.Api.Controllers
{
    [ApiController]
    [Route("api/financial-plan")]
    public class FinancialPlanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AIChatService _aiChatService;
        private readonly ILogger<FinancialPlanController> _logger;

        public FinancialPlanController(
            AppDbContext context,
            AIChatService aiChatService,
            ILogger<FinancialPlanController> logger)
        {
            _context = context;
            _aiChatService = aiChatService;
            _logger = logger;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateFinancialPlan([FromBody] GenerateFinancialPlanRequest request)
        {
            try
            {
                // Fetch user data
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.UserId);

                if (user == null)
                {
                    return NotFound(new { success = false, error = "User not found" });
                }

                // Fetch active budgets
                var budgets = await _context.Budgets
                    .Where(b => b.UserId == request.UserId && b.IsActive)
                    .Select(b => new
                    {
                        b.Category,
                        LimitAmount = b.LimitAmount,
                        PeriodType = b.PeriodType.ToString(),
                        b.CreatedAt
                    })
                    .ToListAsync();

                // Fetch last 7 days transactions
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var recentTransactions = await _context.Transactions
                    .Where(t => t.UserId == request.UserId && t.Date >= sevenDaysAgo)
                    .OrderByDescending(t => t.Date)
                    .Select(t => new
                    {
                        Merchant = t.Merchant,
                        t.Amount,
                        t.Category,
                        t.Date,
                        t.Location
                    })
                    .ToListAsync();

                // Fetch wallet information
                var wallet = await _context.Wallets
                    .Where(w => w.UserId == request.UserId)
                    .Select(w => new
                    {
                        w.Balance,
                        w.Currency
                    })
                    .FirstOrDefaultAsync();

                // Prepare data for AI
                var userData = new
                {
                    name = user.FullName,
                    email = user.Email,
                    walletBalance = wallet?.Balance ?? 0,
                    currency = wallet?.Currency ?? "USD"
                };

                // Call AI service to generate financial plan
                var aiResponse = await _aiChatService.GenerateFinancialPlanAsync(
                    userData,
                    budgets,
                    recentTransactions
                );

                if (!aiResponse.Success)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        error = aiResponse.Error,
                        response = "Sorry, I couldn't generate your financial plan at this time. Please try again later."
                    });
                }

                return Ok(new
                {
                    success = true,
                    plan = aiResponse.Response,
                    userData = userData,
                    budgetSummary = new
                    {
                        totalBudget = budgets.Sum(b => b.LimitAmount),
                        budgetCount = budgets.Count
                    },
                    transactionSummary = new
                    {
                        totalTransactions = recentTransactions.Count,
                        totalSpent = recentTransactions.Sum(t => t.Amount)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating financial plan for user {UserId}", request.UserId);
                return StatusCode(500, new
                {
                    success = false,
                    error = "An error occurred while generating your financial plan",
                    response = "Sorry, something went wrong. Please try again later."
                });
            }
        }

        [HttpPost("chat")]
        public async Task<IActionResult> ChatAboutPlan([FromBody] ChatAboutPlanRequest request)
        {
            try
            {
                // Fetch user data
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.UserId);

                if (user == null)
                {
                    return NotFound(new { success = false, error = "User not found" });
                }

                // Fetch recent transactions for context
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var recentTransactions = await _context.Transactions
                    .Where(t => t.UserId == request.UserId && t.Date >= sevenDaysAgo)
                    .OrderByDescending(t => t.Date)
                    .Select(t => new
                    {
                        Merchant = t.Merchant,
                        t.Amount,
                        t.Category,
                        t.Date,
                        t.Location
                    })
                    .ToListAsync();

                // Call AI service
                var aiResponse = await _aiChatService.ChatAboutFinancialPlanAsync(
                    new { name = user.FullName, email = user.Email },
                    request.Message,
                    request.ConversationHistory,
                    recentTransactions
                );

                if (!aiResponse.Success)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        error = aiResponse.Error,
                        response = "Sorry, I couldn't process your question. Please try again."
                    });
                }

                return Ok(new
                {
                    success = true,
                    response = aiResponse.Response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in financial plan chat for user {UserId}", request.UserId);
                return StatusCode(500, new
                {
                    success = false,
                    error = "An error occurred while processing your message",
                    response = "Sorry, something went wrong. Please try again later."
                });
            }
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "Financial Plan API is running", timestamp = DateTime.UtcNow });
        }
    }

    public class GenerateFinancialPlanRequest
    {
        public int UserId { get; set; }
    }

    public class ChatAboutPlanRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ConversationMessage> ConversationHistory { get; set; } = new();
    }

    public class ConversationMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
