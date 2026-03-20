using Hangfire.Dashboard;

namespace WMS.API.Filters;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // For development: allow all
        // For production: check if user is authenticated and has Admin role
        var httpContext = context.GetHttpContext();

        // Allow in development
        if (httpContext.Request.Host.Host == "localhost")
            return true;

        // In production: check authentication
        // return httpContext.User.Identity?.IsAuthenticated == true
        //        && httpContext.User.IsInRole("ADMIN");

        return true; // For now, allow all (change in production)
    }
}
