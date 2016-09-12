var ExtendableError = require('es6-error');

///////////////////////////////////////////////////////////////////////////////

/**
 * Error that prevents the command from running.
 *
 * @class CommandError
 */

class CommandError extends ExtendableError
{
    constructor(message) {
        super(message);
    }
}
exports.CommandError = CommandError;

///////////////////////////////////////////////////////////////////////////////

/**
 * Command line usage error
 *
 * @class CommandUsageError
 */

class CommandUsageError extends CommandError
{
    constructor(message) {
        super(message);
    }
}
exports.CommandUsageError = CommandUsageError;

///////////////////////////////////////////////////////////////////////////////

/**
 * Error for providing more non-option arguments than the command accepts.
 *
 * @class UnexpectedArgError
 */

class UnexpectedArgError extends CommandUsageError
{
    constructor(arg) {
        super('UnexpectedArgument: "'+ arg +'"');
    }
}
exports.UnexpectedArgError = UnexpectedArgError;
