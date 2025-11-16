// Services/AIChatService.cs
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace SmartCampusWallet.Api.Services;

public class AIChatService
{
    private readonly ILogger<AIChatService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _pythonScriptPath;
    private readonly string _pythonExecutable;

    public AIChatService(ILogger<AIChatService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        // Get Python script path from configuration or use default
        var scriptPath = configuration["Python:ScriptPath"];
        if (string.IsNullOrEmpty(scriptPath))
        {
            // Default to backend/ai_chat.py relative to the API project
            var apiDirectory = Directory.GetCurrentDirectory();
            var backendDirectory = Directory.GetParent(apiDirectory)?.FullName ?? apiDirectory;
            scriptPath = Path.Combine(backendDirectory, "ai_chat.py");
        }
        _pythonScriptPath = scriptPath;

        // Get Python executable from configuration or use default
        _pythonExecutable = configuration["Python:Executable"] ?? "python";
        
        _logger.LogInformation($"AIChatService initialized with Python script: {_pythonScriptPath}");
        _logger.LogInformation($"Python executable: {_pythonExecutable}");
    }

    public string GetPythonScriptPath() => _pythonScriptPath;

    public async Task<AIChatResult> GetChatResponseAsync(object userData, string message, object transactions)
    {
        try
        {
            // Verify Python script exists
            if (!File.Exists(_pythonScriptPath))
            {
                _logger.LogError($"Python script not found at: {_pythonScriptPath}");
                return new AIChatResult
                {
                    Success = false,
                    Error = "AI chat service not configured properly",
                    Response = "The AI chat service is currently unavailable. Please contact support."
                };
            }

            // Prepare input data for Python script
            var ollamaConfig = new
            {
                host = Environment.GetEnvironmentVariable("OLLAMA_HOST") ?? "https://ollama.com",
                apiKey = Environment.GetEnvironmentVariable("OLLAMA_API_KEY") ?? "",
                model = Environment.GetEnvironmentVariable("OLLAMA_MODEL") ?? "gpt-oss:20b-cloud"
            };

            // Validate API key
            if (string.IsNullOrEmpty(ollamaConfig.apiKey))
            {
                _logger.LogError("OLLAMA_API_KEY is not configured");
                return new AIChatResult
                {
                    Success = false,
                    Error = "Ollama API key not configured",
                    Response = "The AI service is not properly configured. Please contact support."
                };
            }

            var inputData = new
            {
                user = userData,
                message = message,
                transactions = transactions,
                ollamaConfig = ollamaConfig
            };

            var inputJson = JsonSerializer.Serialize(inputData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Execute Python script
            var result = await ExecutePythonScriptAsync(inputJson);

            if (result.Success && !string.IsNullOrEmpty(result.Output))
            {
                // Parse JSON response from Python
                try
                {
                    var response = JsonSerializer.Deserialize<AIChatResult>(result.Output, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    });

                    return response ?? new AIChatResult
                    {
                        Success = false,
                        Error = "Failed to parse AI response",
                        Response = "Sorry, I couldn't understand the AI's response."
                    };
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, $"Failed to parse Python output: {result.Output}");
                    return new AIChatResult
                    {
                        Success = false,
                        Error = $"Failed to parse response: {ex.Message}",
                        Response = "Sorry, there was an error processing the AI response."
                    };
                }
            }
            else
            {
                _logger.LogError($"Python script execution failed: {result.Error}");
                return new AIChatResult
                {
                    Success = false,
                    Error = result.Error,
                    Response = "Sorry, the AI service encountered an error. Please try again."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Python AI service");
            return new AIChatResult
            {
                Success = false,
                Error = ex.Message,
                Response = "An unexpected error occurred. Please try again later."
            };
        }
    }

    public async Task<AIChatResult> GenerateFinancialPlanAsync(object userData, object budgets, object transactions)
    {
        try
        {
            if (!File.Exists(_pythonScriptPath))
            {
                _logger.LogError($"Python script not found at: {_pythonScriptPath}");
                return new AIChatResult
                {
                    Success = false,
                    Error = "AI service not configured",
                    Response = "The AI service is currently unavailable."
                };
            }

            var ollamaConfig = new
            {
                host = Environment.GetEnvironmentVariable("OLLAMA_HOST") ?? "https://ollama.com",
                apiKey = Environment.GetEnvironmentVariable("OLLAMA_API_KEY") ?? "",
                model = Environment.GetEnvironmentVariable("OLLAMA_MODEL") ?? "gpt-oss:20b-cloud"
            };

            if (string.IsNullOrEmpty(ollamaConfig.apiKey))
            {
                _logger.LogError("OLLAMA_API_KEY is not configured");
                return new AIChatResult
                {
                    Success = false,
                    Error = "API key not configured",
                    Response = "The AI service is not properly configured."
                };
            }

            var inputData = new
            {
                action = "generate_plan",
                user = userData,
                budgets = budgets,
                transactions = transactions,
                ollamaConfig = ollamaConfig
            };

            var inputJson = JsonSerializer.Serialize(inputData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var result = await ExecutePythonScriptAsync(inputJson);

            if (result.Success && !string.IsNullOrEmpty(result.Output))
            {
                try
                {
                    var response = JsonSerializer.Deserialize<AIChatResult>(result.Output, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    });

                    return response ?? new AIChatResult
                    {
                        Success = false,
                        Error = "Failed to parse response",
                        Response = "Sorry, I couldn't process the financial plan."
                    };
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, $"Failed to parse output: {result.Output}");
                    return new AIChatResult
                    {
                        Success = false,
                        Error = ex.Message,
                        Response = "Sorry, there was an error generating your plan."
                    };
                }
            }
            else
            {
                _logger.LogError($"Python execution failed: {result.Error}");
                return new AIChatResult
                {
                    Success = false,
                    Error = result.Error,
                    Response = "Sorry, I couldn't generate your financial plan."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating financial plan");
            return new AIChatResult
            {
                Success = false,
                Error = ex.Message,
                Response = "An unexpected error occurred."
            };
        }
    }

    public async Task<AIChatResult> ChatAboutFinancialPlanAsync(object userData, string message, object conversationHistory, object transactions)
    {
        try
        {
            if (!File.Exists(_pythonScriptPath))
            {
                return new AIChatResult
                {
                    Success = false,
                    Error = "AI service not configured",
                    Response = "The AI service is currently unavailable."
                };
            }

            var ollamaConfig = new
            {
                host = Environment.GetEnvironmentVariable("OLLAMA_HOST") ?? "https://ollama.com",
                apiKey = Environment.GetEnvironmentVariable("OLLAMA_API_KEY") ?? "",
                model = Environment.GetEnvironmentVariable("OLLAMA_MODEL") ?? "gpt-oss:20b-cloud"
            };

            if (string.IsNullOrEmpty(ollamaConfig.apiKey))
            {
                return new AIChatResult
                {
                    Success = false,
                    Error = "API key not configured",
                    Response = "The AI service is not properly configured."
                };
            }

            var inputData = new
            {
                action = "chat_about_plan",
                user = userData,
                message = message,
                conversationHistory = conversationHistory,
                transactions = transactions,
                ollamaConfig = ollamaConfig
            };

            var inputJson = JsonSerializer.Serialize(inputData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var result = await ExecutePythonScriptAsync(inputJson);

            if (result.Success && !string.IsNullOrEmpty(result.Output))
            {
                try
                {
                    var response = JsonSerializer.Deserialize<AIChatResult>(result.Output, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    });

                    return response ?? new AIChatResult
                    {
                        Success = false,
                        Error = "Failed to parse response",
                        Response = "Sorry, I couldn't process your question."
                    };
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, $"Failed to parse output: {result.Output}");
                    return new AIChatResult
                    {
                        Success = false,
                        Error = ex.Message,
                        Response = "Sorry, there was an error processing your message."
                    };
                }
            }
            else
            {
                return new AIChatResult
                {
                    Success = false,
                    Error = result.Error,
                    Response = "Sorry, I couldn't process your question."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in financial plan chat");
            return new AIChatResult
            {
                Success = false,
                Error = ex.Message,
                Response = "An unexpected error occurred."
            };
        }
    }

    private async Task<PythonExecutionResult> ExecutePythonScriptAsync(string inputJson)
    {
        try
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = _pythonExecutable,
                Arguments = $"\"{_pythonScriptPath}\"",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = Path.GetDirectoryName(_pythonScriptPath)
            };

            using var process = new Process { StartInfo = processStartInfo };
            
            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    outputBuilder.AppendLine(e.Data);
                }
            };

            process.ErrorDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    errorBuilder.AppendLine(e.Data);
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Write input JSON to stdin
            await process.StandardInput.WriteAsync(inputJson);
            await process.StandardInput.FlushAsync();
            process.StandardInput.Close();

            // Wait for process to complete with timeout
            var timeout = TimeSpan.FromSeconds(120); // 2 minutes timeout
            if (!process.WaitForExit((int)timeout.TotalMilliseconds))
            {
                process.Kill();
                _logger.LogError("Python script execution timed out");
                return new PythonExecutionResult
                {
                    Success = false,
                    Error = "Request timed out"
                };
            }

            var output = outputBuilder.ToString().Trim();
            var error = errorBuilder.ToString().Trim();

            if (process.ExitCode != 0)
            {
                _logger.LogError($"Python script exited with code {process.ExitCode}. Error: {error}");
                return new PythonExecutionResult
                {
                    Success = false,
                    Error = $"Script error (exit code {process.ExitCode}): {error}"
                };
            }

            if (!string.IsNullOrEmpty(error))
            {
                _logger.LogWarning($"Python script stderr: {error}");
            }

            return new PythonExecutionResult
            {
                Success = true,
                Output = output
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute Python script");
            return new PythonExecutionResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private class PythonExecutionResult
    {
        public bool Success { get; set; }
        public string? Output { get; set; }
        public string? Error { get; set; }
    }
}

public class AIChatResult
{
    public bool Success { get; set; }
    public string? Response { get; set; }
    public string? Model { get; set; }
    public string? Error { get; set; }
    public DateTime? Timestamp { get; set; }
}
