namespace Web.Shared.Helpers;

public class ConnectionStrings(IConfiguration configuration, ILogger<ConnectionStrings> logger)
{
    // Pointing directly to the exact nested properties inside your JSON config structure
    public string Default => GetConnectionString("Database:MySqlConnectionString", "Default");
    public string Cmpl => GetConnectionString("Database:MySqlConnectionString_Cmpl", "CMPL");
    public string HodMaster => GetConnectionString("Database:MySqlConnectionString_HOD", "HOD Master"); // Fixed uppercase matching _HOD

    private string GetConnectionString(string configurationKey, string contextName)
    {
        // Accessing the exact configuration coordinate map location
        var connectionString = configuration[configurationKey];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError("{Context} connection string is not configured at path: {Path}", contextName, configurationKey);
            throw new InvalidOperationException($"{contextName} connection string is missing from configuration.");
        }

        return connectionString;
    }
}
