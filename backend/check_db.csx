// Quick check script - run via API
using System;
using System.Net.Http;
using System.Threading.Tasks;

var client = new HttpClient();
var response = await client.GetStringAsync("http://localhost:5276/api/RentalRequests/owner?ownerId=1");
Console.WriteLine(response);
