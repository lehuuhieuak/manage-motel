using System.Diagnostics;

namespace Gateway.Middlewares
{
    public sealed class CorrelationIdMiddleware(
        RequestDelegate next,
        ILogger<CorrelationIdMiddleware> logger)
    {
        private const string HeaderName = "X-Correlation-Id";

        public async Task InvokeAsync(HttpContext context)
        {
            var values = context.Request.Headers[HeaderName];
            var correlationId = values.Count == 1 ? values[0] : null;

            if (string.IsNullOrWhiteSpace(correlationId))
            {
                correlationId = Guid.NewGuid().ToString("D");
            }

            context.Request.Headers[HeaderName] = correlationId;

            context.Items["CorrelationId"] = correlationId;

            context.Response.OnStarting(() =>
            {
                context.Response.Headers[HeaderName] = correlationId;
                return Task.CompletedTask;
            });

            Activity.Current?.SetTag("correlation.id", correlationId);

            using var scope = logger.BeginScope(
                new Dictionary<string, object>
                {
                    ["CorrelationId"] = correlationId
                });

            var stopwatch = Stopwatch.StartNew();

            try
            {
                await next(context);

                logger.LogInformation(
                    "HTTP {Method} {Path} returned {StatusCode} in {ElapsedMs} ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.Elapsed.TotalMilliseconds);
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "HTTP {Method} {Path} failed after {ElapsedMs} ms",
                    context.Request.Method,
                    context.Request.Path,
                    stopwatch.Elapsed.TotalMilliseconds);

                throw;
            }
        }
    }
}
