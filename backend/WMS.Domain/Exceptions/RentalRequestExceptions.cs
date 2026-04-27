namespace WMS.Domain.Exceptions;

public class InvalidWarehouseStateException : Exception
{
    public InvalidWarehouseStateException(string message) : base(message) { }
}

public class NotEnoughAreaException : Exception
{
    public NotEnoughAreaException(string message) : base(message) { }
}

public class DuplicateRequestException : Exception
{
    public DuplicateRequestException(string message) : base(message) { }
}

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
}

public class InvalidStateException : Exception
{
    public InvalidStateException(string message) : base(message) { }
}
