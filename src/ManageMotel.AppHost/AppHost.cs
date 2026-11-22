var builder = DistributedApplication.CreateBuilder(args);

var identity = builder.AddProject<Projects.Identity_API>("identity-service")
    .WithHttpEndpoint(port: 8001)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

var billing = builder.AddProject<Projects.Billing_API>("billing-service")
    .WithHttpEndpoint(port: 8002)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

var rental = builder.AddProject<Projects.Rental_API>("rental-service")
    .WithHttpEndpoint(port: 8003)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

var gateway = builder.AddProject<Projects.Gateway>("gateway")
    .WithHttpEndpoint(port: 5241)
    .WithEnvironment("DOTNET_ENVIRONMENT", "Development")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpHealthCheck("/health/ready");

var metering = builder.AddGoApp(
    name: "metering-service",
    appDirectory: "../services/Metering",
    packagePath: "./cmd/metering")
    .WithEnvironment("ENVIRONMENT", "Development")
    .WithHttpEndpoint(port: 8004, env: "HTTP_PORT")
    .WithExternalHttpEndpoints();

var payment = builder.AddGoApp(
    name: "payment-service",
    appDirectory: "../services/Payment",
    packagePath: "./cmd/payment")
    .WithEnvironment("ENVIRONMENT", "Development")
    .WithHttpEndpoint(port: 8005, env: "HTTP_PORT")
    .WithExternalHttpEndpoints();

gateway
    .WithEnvironment(
        "ReverseProxy__Clusters__identities-cluster__Destinations__identities-api__Address",
        ReferenceExpression.Create($"{identity.GetEndpoint("http")}/api/v1/"))
    .WithEnvironment(
        "ReverseProxy__Clusters__billings-cluster__Destinations__billings-api__Address",
        ReferenceExpression.Create($"{billing.GetEndpoint("http")}/api/v1/"))
    .WithEnvironment(
        "ReverseProxy__Clusters__rentals-cluster__Destinations__rentals-api__Address",
        ReferenceExpression.Create($"{rental.GetEndpoint("http")}/api/v1/"))
    .WithEnvironment(
        "ReverseProxy__Clusters__meterings-cluster__Destinations__meterings-api__Address",
        ReferenceExpression.Create($"{metering.GetEndpoint("http")}/api/v1/"))
    .WithEnvironment(
        "ReverseProxy__Clusters__payments-cluster__Destinations__payments-api__Address",
        ReferenceExpression.Create($"{payment.GetEndpoint("http")}/api/v1/"));

builder.AddViteApp("frontend", "../frontend")
    .WithEnvironment("VITE_DEV_PROXY_TARGET", gateway.GetEndpoint("http"))
    .WithExternalHttpEndpoints();

builder.Build().Run();
