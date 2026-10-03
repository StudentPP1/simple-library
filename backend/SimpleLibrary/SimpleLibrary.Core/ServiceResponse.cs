using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core
{
    public class ServiceResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ErrorType Error { get; set; }
        public T? Data { get; set; }

        public ServiceResponse() { }

        public ServiceResponse(bool success, string message, ErrorType error, T? data)
        {
            Success = success;
            Message = message;
            Error = error;
            Data = data;
        }

        public static ServiceResponse<T> Ok(T data, string message = "")
        {
            return new ServiceResponse<T>(true, message, ErrorType.None, data);
        }

        public static ServiceResponse<T> Fail(string message, ErrorType error)
        {
            return new ServiceResponse<T>(false, message, error, default);
        }
    }
}
