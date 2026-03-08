using System;
using System.Text;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services
{
    public class PasswordGenerator : IPasswordGenerator
    {
        private const string UppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string LowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        private const string DigitChars = "0123456789";
        private const string SpecialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        /// <summary>
        /// Generates a random password with uppercase, lowercase, digit, and special characters
        /// </summary>
        /// <param name="length">Length of the password (default: 12, minimum: 8)</param>
        /// <returns>Generated password string</returns>
        public string Generate(int length = 12)
        {
            if (length < 8)
                length = 8;

            var random = new Random();
            var password = new StringBuilder();

            // Ensure at least one character from each category
            password.Append(UppercaseChars[random.Next(UppercaseChars.Length)]);
            password.Append(LowercaseChars[random.Next(LowercaseChars.Length)]);
            password.Append(DigitChars[random.Next(DigitChars.Length)]);
            password.Append(SpecialChars[random.Next(SpecialChars.Length)]);

            // Fill the rest with random characters from all categories
            var allChars = UppercaseChars + LowercaseChars + DigitChars + SpecialChars;
            for (int i = password.Length; i < length; i++)
            {
                password.Append(allChars[random.Next(allChars.Length)]);
            }

            // Shuffle the password to avoid predictable patterns
            var passwordArray = password.ToString().ToCharArray();
            for (int i = passwordArray.Length - 1; i > 0; i--)
            {
                int randomIndex = random.Next(0, i + 1);
                (passwordArray[i], passwordArray[randomIndex]) = (passwordArray[randomIndex], passwordArray[i]);
            }

            return new string(passwordArray);
        }
    }
}
