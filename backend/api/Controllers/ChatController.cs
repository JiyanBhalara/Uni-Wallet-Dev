// Controllers/ChatController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Services;
using System.Text.Json;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AIChatService _aiChatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(AppDbContext db, AIChatService aiChatService, ILogger<ChatController> logger)
    {
        _db = db;
        _aiChatService = aiChatService;
        _logger = logger;
    }

    public record ChatRequest(string Message, int? UserId = null);

    public record ChatResponse(
        bool Success,
        string Response,
        string? Model = null,
        string? Error = null,
        DateTime? Timestamp = null
    );

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        try
        {
            // Get user from header or request
            var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
            
            int userId;
            if (request.UserId.HasValue)
            {
                userId = request.UserId.Value;
            }
            else if (!string.IsNullOrEmpty(userEmail))
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }
                userId = user.Id;
            }
            else
            {
                return BadRequest(new { message = "User identification required (email header or userId)" });
            }

            // Validate message
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message cannot be empty" });
            }

            _logger.LogInformation($"Chat request from user {userId}: {request.Message}");

            // Get user data
            var userData = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.UniversityName,
                    u.Semester
                })
                .FirstOrDefaultAsync();

            if (userData == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Get user's recent transactions
            var transactions = await _db.Transactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .Take(50)
                .Select(t => new
                {
                    t.Date,
                    t.Amount,
                    t.Merchant,
                    t.Category,
                    Type = t.Amount > 0 ? "credit" : "debit"
                })
                .ToListAsync();

            // Call Python AI chat service
            var result = await _aiChatService.GetChatResponseAsync(userData, request.Message, transactions);

            if (result.Success)
            {
                _logger.LogInformation($"AI Response: {result.Response?.Substring(0, Math.Min(100, result.Response?.Length ?? 0))}...");
                
                return Ok(new ChatResponse(
                    Success: true,
                    Response: result.Response ?? "No response",
                    Model: result.Model,
                    Timestamp: result.Timestamp
                ));
            }
            else
            {
                _logger.LogError($"AI Chat Error: {result.Error}");
                
                return Ok(new ChatResponse(
                    Success: false,
                    Response: result.Response ?? "Sorry, I couldn't process your request.",
                    Error: result.Error
                ));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat request");
            
            return StatusCode(500, new ChatResponse(
                Success: false,
                Response: "An error occurred while processing your request. Please try again.",
                Error: ex.Message
            ));
        }
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new
        {
            status = "success",
            message = "Chat API is running",
            timestamp = DateTime.UtcNow,
            pythonScriptPath = _aiChatService.GetPythonScriptPath()
        });
    }
}
