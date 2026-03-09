namespace WMS.Application.Interfaces
{
    public interface IPasswordGenerator
    {
        /// <summary>
        /// Generates a random password with specified requirements
        /// </summary>
        /// <param name="length">Length of the password (default: 12)</param>
        /// <returns>Generated password string</returns>
        string Generate(int length = 12);
    }
}
