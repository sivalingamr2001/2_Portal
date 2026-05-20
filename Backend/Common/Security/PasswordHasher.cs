using System.Security.Cryptography;

namespace Web.Common.Security;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;

    public static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password must not be empty.", nameof(password));

        using var algorithm = new Rfc2898DeriveBytes(password, SaltSize, Iterations, HashAlgorithmName.SHA256);
        passwordSalt = algorithm.Salt;
        passwordHash = algorithm.GetBytes(HashSize);
    }

    public static bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
    {
        if (string.IsNullOrWhiteSpace(password))
            return false;

        if (passwordHash.Length != HashSize || passwordSalt.Length != SaltSize)
            return false;

        using var algorithm = new Rfc2898DeriveBytes(password, passwordSalt, Iterations, HashAlgorithmName.SHA256);
        var computedHash = algorithm.GetBytes(HashSize);
        return CryptographicOperations.FixedTimeEquals(computedHash, passwordHash);
    }
}
