using BCrypt.Net;
var hash = BCrypt.HashPassword("123456");
Console.WriteLine(hash);
