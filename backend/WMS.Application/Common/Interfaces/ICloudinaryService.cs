using System.IO;
using System.Threading.Tasks;

namespace WMS.Application.Common.Interfaces;

public interface ICloudinaryService
{
    Task<string?> UploadImageAsync(Stream fileStream, string fileName, string folder);
    Task<bool> DeleteImageAsync(string publicId);
}
