var ExtendableError = require('es6-error');

///////////////////////////////////////////////////////////////////////////////

/** @class CommandError */

class CommandError extends ExtendableError
{
    /**
     * Error that prevents the command from running.
     *
     * @param message Description of the error.
     */
     
    constructor(message) {
        super(message);
    }
}
exports.CommandError = CommandError;

///////////////////////////////////////////////////////////////////////////////

/** @class CommandUsageError */

class CommandUsageError extends CommandError
{
    /**
     * Command line usage error
     *
     * @param message Description of the usage error.
     */
     
    constructor(message) {
        super(message);
    }
}
exports.CommandUsageError = CommandUsageError;

///////////////////////////////////////////////////////////////////////////////

/** @class UnexpectedArgError */

class UnexpectedArgError extends CommandUsageError
{
    /**
     * Error for providing more non-option arguments than the command accepts.
     *
     * @param arg The unexpected argument
     */
     
    constructor(arg) {
        super('UnexpectedArgument: "'+ arg +'"');
    }
}
exports.UnexpectedArgError = UnexpectedArgError;
