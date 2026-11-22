var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.Identity_API>("identity-service")
    .WithHttpEndpoint(port: 8001)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

builder.AddProject<Projects.Billing_API>("billing-service")
    .WithHttpEndpoint(port: 8002)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

builder.AddProject<Projects.Rental_API>("rental-service")
    .WithHttpEndpoint(port: 8003)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

var gateway = builder.AddProject<Projects.Gateway>("gateway")
    .WithHttpEndpoint(port: 5241)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

builder.AddGoApp(
    name: "metering-service",
    appDirectory: "../services/Metering",
    packagePath: "./cmd/metering")
    .WithEnvironment("ENVIRONMENT", "Development")
    .WithHttpEndpoint(port: 8004, env: "HTTP_PORT")
    .WithExternalHttpEndpoints();

builder.AddGoApp(
    name: "payment-service",
    appDirectory: "../services/Payment",
    packagePath: "./cmd/payment")
    .WithEnvironment("ENVIRONMENT", "Development")
    .WithHttpEndpoint(port: 8005, env: "HTTP_PORT")
    .WithExternalHttpEndpoints();

builder.AddViteApp("frontend", "../frontend")
    .WithEnvironment("VITE_DEV_PROXY_TARGET", gateway.GetEndpoint("http"))
    .WithExternalHttpEndpoints();

builder.Build().Run();
