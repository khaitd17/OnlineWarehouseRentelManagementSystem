using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public class Program 
{
    public static async Task Main() 
    {
        var key = Encoding.UTF8.GetBytes("YourSuperSecretKeyForJWTAuthReplaceThisInProductionMakeItLonger123123");
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "85") }),
            Expires = DateTime.UtcNow.AddMinutes(5),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwt = tokenHandler.WriteToken(token);

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + jwt);
        var content = new StringContent("{\"contractId\": 10, \"paymentType\": \"DEPOSIT\", \"amountOverride\": 7500000}", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("http://localhost:5276/api/payments/create", content);
        
        Console.WriteLine(response.StatusCode);
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}
