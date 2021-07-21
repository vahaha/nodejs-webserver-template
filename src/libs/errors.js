class ClientError extends Error {
    constructor(message) {
        super(message)
    }
}

class ServerError extends Error {
    constructor(message, code) {
        super(message)
        this.code = code || 500
        this.type = ServerError
    }
}

class ThirdSystemError extends ServerError {
    constructor(message, code) {
        super(message, code)
        this.type = ThirdSystemError
    }
}

class ValidationError extends ClientError {
    constructor(message, code, details) {
        super(message)
        this.type = 'ValidationError'
        this.code = code || 412
        if (details) this.details = details
    }
}

class AuthenticationError extends ClientError {
    constructor(message, code = 401) {
        super(message)
        this.type = 'AuthenticationError'
        this.code = code
    }
}

class UnknownError extends ServerError {
    constructor(error) {
        super(error.message)
        this.type = 'UnknownError'
        this.code = 500
    }
}

class DataError extends ClientError {
    constructor(message, code = 500) {
        super(message, code)
        this.type = 'DataError'
    }
}

class NotFoundError extends Error {
    constructor(message, code = 404) {
        super(message)
        this.type = 'NotFoundError'
        this.code = code
    }
}

class PermissionError extends ClientError {
    constructor(message, code = 403) {
        super(message)
        this.type = 'PermissionError'
        this.code = code
    }
}

class DuplicatedError extends DataError {
    constructor(message, code = 500) {
        super(message, code)
        this.type = 'DuplicatedError'
    }
}

module.exports = {
    AuthenticationError,
    ClientError,
    DataError,
    DuplicatedError,
    NotFoundError,
    PermissionError,
    ServerError,
    ThirdSystemError
    UnknownError,
    ValidationError,
}
