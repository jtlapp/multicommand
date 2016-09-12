'use strict';

//// MODULES //////////////////////////////////////////////////////////////////

var util = require("util");
var prompt = require("prompt");
var errors = require('./errors');

/******************************************************************************
NamedCommand is an abstract class representing a named command. When the first argument of the command line is a non-option argument (i.e. doesn't begin with a dash), this argument is expected to be the name of a named command. The remaining arguments are the arguments of the named command. MultiCommand passes these remaining arguments to the instance of NamedCommand that handles the named command, delegating execution of the command line to the instance.
******************************************************************************/

/**
 * @class NamedCommand
 */
 /*
 * @member {Object} multicommand The calling MultiCommand instance
 * @member {Object} name The name of this command, as appears in the first term of the syntax
 * @member {Object} info The information object that `getInfo()` returns
 */

/*abstract*/ class NamedCommand
{
    //// CONFIGURATION ////////////////////////////////////////////////////////
    
    // multicommand - the calling MultiCommand instance
    // name - the name of this command, as appears in first term of the syntax
    // info - the information object that `getInfo()` returns
    
    //// PUBLIC CLASS METHODS /////////////////////////////////////////////////
    // each concrete subclass must implement this class method
    
    /**
     * Returns information about the named command. Only concrete subclasses of NamedCommand need implement this static class method.
     *
     * @function NamedCommand.getInfo
     * @returns An object containing a `syntax` property illustrating the command's syntax, and a `summary` property briefly describing the command in a single line.
     */
    
    //// PUBLIC INSTANCE METHODS //////////////////////////////////////////////
    // subclasses may override these methods
    
    /**
     * Adds command line options to the two already supported, `-h` and `--help`. Command line options are arguments that begin with one or two dashes. The method receives a minimist configuration options object, as described above, and optionally extends this object. To add options to the configuration, call `options.add(moreOptions)` with a minimist configuration options object `moreOptions` that defines the additional options. `options.add()` may be called any number of times, with each call adding any number of options. This feature is particularly useful for passing `options` up an inheritance tree to allow each ancestor class to separately extend the options.
     *
     * `addOptions()` does nothing by default. A subclass need only override this method to provide support for option arguments, which begin with one or two dashes.
     *
     * @param options A configuration object of options for minimist, as described above. Call `options.add(moreOptions)` to define more options.
     */
    
    addOptions(options) {
        // assume no arguments by default
    }
    
    /**
     * Parses and validates the command line arguments. The arguments are provided in the form of the output of minimist, as described above. The modified arguments subsequently pass to `doDefaultCommand()`.
     *
     * The `args` parameter contains the values of the defined options, and `args._` contains an array of all provided non-option arguments. `parseArgs()` must copy and remove from `args._` all of the non-option arguments it recognizes. MultiCommand will report the presence of unrecognized arguments if `parseArgs()` leaves `args._` non-empty. You may use `args._.shift()` or the convenience method `args.getNext()` to remove arguments, the latter of which returns null when there are no more non-option arguments. You may store the extracted values either as instance variables of `this` object or as additional properties of `args`.
     *
     * This method should throw CommandUsageError if any arguments are invalid. This is also the place where the command should check for the proper presence or absence of arguments. If this method returns without throwing and with `args._` empty, `doCommand()` is called next with this method's final value of `args`.
     *
     * `parseArgs()` does nothing by default.
     *
     * @param args The command line arguments as output by minimist and processed by `addOptions()`. Feel free to modify this object or copy values to instance variables of the named command. `args._` must be empty on return in order for MultiCommand to run the command.
     */
     
    parseArgs(args) {
        // assume no arguments by default
    }
    
    /**
     * Performs the command. The method is called with the arguments object that `parseArgs()` processed. Behavior may be a function of these arguments and a function of any instance variables that `parseArg()` established. The method must call the `next()` callback when done and may pass an instance of CommandError to `next()` to report an error to the calling application.
     *
     * @param args An object containing the arguments output of minimist after processing by `parseArgs()`, including the command line options that `addOptions()` defined. `args._` is not available to this method.
     * @param next The next `function (err)` to call. The method must call this function when done and must not call it more than once.
     */
    
    /*abstract*/ doCommand(args, next) {
        next(new Error("Command '"+ this.name +"' not implemented"));
    }
    
    /**
     * Returns help when `-h` or `--help` follows the command name on the command line. By default, the method returns only the syntax and summary lines that `getInfo()` provides. Override this method to produce more extensive help for the command. The output gets wrapped at a width configured for MultiCommand.
     *
     * @param rightMargin The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior.
     * @return String providing help for this particular command, possibly extensive multiline help.
     */
    
    getHelp(rightMargin) {
        return this.multicommand.getHelpSummaryEntry(this.info, rightMargin);
    }

    //// PROTECTED INSTANCE METHODS ///////////////////////////////////////////
    // subclasses may call these methods
    
    /**
     * Displays the provided message to stdout and waits for the user to respond and hit enter. If the user types "y" or "yes" (in any letter case), the second parameter of `next()` will be true, otherwise false.
     * This is a support method for implementations of `doCommand()`.
     *
     * @param message Message to present to the user.
     * @param next The next `function (err, confirmed)` to call, where `confirmed` is a boolean taking the value `true` when confirmed.
     */
     
    confirm(message, next) {
        prompt.start();
        prompt.get({
            name: 'yesno',
            message: message +" (y/n)",
            default: 'n'
        }, function(err, result) {
            let answer = result.yesno.toLowerCase();
            next(null, (answer === 'y' || answer === 'yes'));
        });
    }
    
    /**
     * Shorthand method for creating CommandError exceptions. The method accepts `util.format()` arguments. That is, the first argument is a string that may contain `%` formatting codes, and the following arguments replace the codes in the string.
     *
     * This is a support method for implementations of `doCommand()`.
     *
     * @param {string} message An error message, optionally using the `%` formatting codes of `util.format()`.
     * @param {...*} substitutions Optional arguments that replace `%` formatting codes in `message`.
     * @return A new instance of CommandError.
     */
    
    error() {
        return new errors.CommandError(
                util.format.apply(this, arguments));
    }
    
    /**
     * Shorthand method for creating CommandUsageError exceptions. The method accepts `util.format()` arguments. That is, the first argument is a string that may contain `%` formatting codes, and the following arguments replace the codes in the string.
     *
     * This is a support method for implementations of `parseArgs()`.
     *
     * @param {string} message An error message, optionally using the `%` formatting codes of `util.format()`.
     * @param {...*} substitutions Optional arguments that replace `%` formatting codes in `message`.
     * @return A new instance of CommandUsageError.
     */
    
    usageError() {
        return new errors.CommandUsageError(
                util.format.apply(this, arguments));
    }
    
    //// RESERVED INSTANCE METHODS ////////////////////////////////////////////
    // these methods are reserved for use by the framework

    _init(multicommand, info) {
        // this prevents subclasses from having to implement constructors
        this.multicommand = multicommand;
        this.name = info.name;
        this.info = info;
    }
}
module.exports = NamedCommand;
