namespace WMS.Application.Common;

/// <summary>
/// Kiểu dữ liệu response thống nhất cho toàn bộ API
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string message = "Thành công.")
        => new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}

/// <summary>
/// Kết quả phân trang cho danh sách
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

/// <summary>
/// Tham số phân trang, sắp xếp, tìm kiếm chung
/// </summary>
public class PaginationParams
{
    private int _page = 1;
    private int _pageSize = 10;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value < 1 ? 10 : (value > 50 ? 50 : value);
    }

    public string? SortBy { get; set; }
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
}
