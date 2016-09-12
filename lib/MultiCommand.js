'use strict';

//// MODULES //////////////////////////////////////////////////////////////////

var minimist = require("minimist");
var optionhelp = require("option-help");
var NamedCommand = require('./NamedCommand');
var errors = require('./errors');

//// CONSTANTS ////////////////////////////////////////////////////////////////

var DEFAULT_WRAP_WIDTH = 80; // default with at char which to wrap help output

/******************************************************************************
MultiCommand is a class that implements a command line, taking arguments and performing a command. The class supports naming a command as the first argument. Different named commands are implemented via subclasses of NamedCommand. When no command name argument occurs, the class performs a default command.
******************************************************************************/
/** @class MultiCommand */

class MultiCommand
{
    //// CONFIGURATION ////////////////////////////////////////////////////////
    
    // commandInfoArray - array of info about the commands available, at most one of which runs
    // helpWrapWidth - width in characters at which to wrap help output
    
    //// CONSTRUCTION /////////////////////////////////////////////////////////
    
    /**
     * MultiCommand is the base class for tools that implement CLIs supporting multiple commands. The `options` configuration parameter accepts the following properties:
     *
     * - `helpWrapWidth`: Width in characters at which to wrap help output. Defaults to 80.
     *
     * @param options The configuration options
     */
    
    constructor(options) {
        options = options || {};
        this.helpWrapWidth = options.helpWrapWidth || DEFAULT_WRAP_WIDTH;
        this.commandInfoArray = [];
    }
    
    //// PUBLIC METHODS ///////////////////////////////////////////////////////
    
    /**
     * Adds named commands, which are subclasses of NamedCommand. May be called multiple times. If the first argument of the command line is the name of one of these added commands, that named command is performed instead of the default command, calling `doCommand()` on the NamedCommand rather than `doDefaultCommand()` on this MultiCommand.
     *
     * @param commandClasses Array of NamedCommand subclasses to add
     */
    
    addCommands(commandClasses) {
        let self = this;
        let firstOfGroup = true;
        commandClasses.forEach(function(commandClass) {
            let commandInfo = commandClass.getInfo();
            let matches = commandInfo.syntax.match(/[^ ]+/);
            commandInfo.name = matches[0];
            commandInfo.normName = commandInfo.name.toLowerCase();
            commandInfo.commandClass = commandClass;
            self.commandInfoArray.forEach(priorCmdInfo => {
                if (commandInfo.normName === priorCmdInfo.normName) {
                    throw new Error("duplicate command name '"+
                            commandInfo.normName +"'");
                }
            });
            commandInfo.firstOfGroup = firstOfGroup;
            firstOfGroup = false;
            self.commandInfoArray.push(commandInfo);
        });
    }
    
    /**
     * Run the command line, including processing command line arguments. One of the methods MultiCommand::doDefaultCommand() and NamedCommand::doCommand() is responsible for performing the command after arguments have been processed. See NamedCommand for an explanation of how named commands are processed.
     *
     * @param argv An array of command line arguments to process. This array must exclude the arguments for executing the command. For example, if "node filename" executes the command, the caller can provide process.argv.slice(2).
     * @param next The next `function (err)` to call. The caller should handle the error if it is an instance of CommandError.
     */
    
    run(argv, next) {
    
        // Create basic minimist configuration options for all commands.
        
        let configOptions = { boolean: ['h'], alias: { h: 'help' } };
        configOptions.add = addConfigOptions;
        let args; // argument output of minimist, then further processed
        let parseArgs; // function to call to parse arguments
        let doCommand; // function to call to perform command
        let getHelp; // function to call to get help string
        
        // Load a named command. The command must be the first argument.
        
        if (argv.length > 0 && argv[0][0] !== '-') {
            let commandInfo = null;
            let commandName = String(argv[0]).toLowerCase();
            this.commandInfoArray.forEach(function (infoToCheck) {
                if (infoToCheck.normName === commandName)
                    commandInfo = infoToCheck;
            });
            if (commandInfo === null) {
                return next(new errors.CommandUsageError(
                        "unrecognized command '"+ commandName +"'"));
            }
            let command = new commandInfo.commandClass();
            command._init(this, commandInfo);
            command.addOptions(configOptions);
            args = minimist(argv.slice(1), configOptions);
            parseArgs = command.parseArgs.bind(command);
            doCommand = command.doCommand.bind(command);
            getHelp = command.getHelp.bind(command);
        }
        
        // Load the default, unnamed command.
        
        else {
            this.addDefaultOptions(configOptions);
            args = minimist(argv, configOptions);
            // allows MultiCommand to have more specific method names
            parseArgs = this.parseDefaultArgs.bind(this);
            doCommand = this.doDefaultCommand.bind(this);
            getHelp = this.getHelp.bind(this);
        }
        
        // Show help if requested. (Additional args likely left out.)
        
        if (args.help) {
            var text = getHelp(this.helpWrapWidth);
            process.stdout.write(
                    optionhelp.wrapText(text, this.helpWrapWidth, true));
            return next();
        }

        // Parse the arguments, throwing CommandUsageError when a problem
        // is found with the user input.
        
        args._ = args._.map(function (arg) {
            return String(arg); // minimist shouldn't decide non-option types
        });
        args.getNext = getNextNonOptionArg;
        try {
            parseArgs(args);
            if (args._.length > 0)
                return next(new errors.UnexpectedArgError(args._[0]));
        }
        catch(err) {
            if (err instanceof CommandError)
                return next(err);
            throw err;
        }
        
        // Perform the command.

        doCommand(args, next);
    }
    
    //// PROTECTED METHODS ////////////////////////////////////////////////////
    // subclasses may override these methods
    
    /**
     * Adds command line options to the two already supported, `-h` and `--help`, for the case where the command line does not include a command name. Command line options are arguments that begin with one or two dashes. The method receives a minimist configuration options object and optionally extends this object. See NamedCommand::addOptions() for a fuller explanation of the purpose and behavior of this method.
     *
     * `addDefaultOptions()` does nothing by default. A subclass overrides this method to provide support for option arguments (arguments beginning with one or two dashes).
     *
     * @param options A configuration object of options for minimist. Call `options.add(moreOptions)` to define more options.
     */
    
    addDefaultOptions(options) {
        // there are no additional options by default
    }

    /**
     * Parses and validates command line arguments for the case where the command line does not include a command name. The arguments are provided in the form of the output of minimist. The modified arguments subsequently pass to `doDefaultCommand()`. See `NamedCommand#parseArgs` for a fuller explanation of the purpose and behavior of this method.
     *
     * This method should throw CommandUsageError if any arguments are invalid. This method's final value of `args` passes to `doDefaultCommand()`.
     *
     * `parseArgs()` does nothing by default. Override this method in a subclass to preprocess any provided argument options.
     *
     * @param args The command line arguments as output by minimist and processed by `addDefaultOptions()`. Feel free to modify this object or copy values to instance variables of the named command. `args._` will be empty.
     */
    
    parseDefaultArgs(args) {
        // nothing to parse by default
    }
    
    /**
     * Performs the default command. The default command is the command that MultiCommand represents when the first command line argument is not a command name. The method is called with the arguments object that `parseDefaultArgs()` processed. Behavior may be a function of these arguments and a function of any instance variables that `parseDefaultArgs()` established. The method must call the `next()` callback when done and may pass an instance of CommandError to `next()` to report an error to the calling application.
     *
     * @param args An object containing the arguments output of minimist after processing by `parseDefaultArgs()`, including the command line options that `addDefaultOptions()` defined. `args._` is not available to this method.
     * @param next The next `function (err)` to call. The method must call this function when done and must not call it more than once.
     */
    
    doDefaultCommand(args, next) {
        if (this.commandInfoArray.length > 0)
            next(new errors.CommandUsageError("Missing command argument"));
        else
            next(new Error("Default command not implemented"));
    }
    
    /**
     * Returns a help summary of all of the commands. The default implementation prepends the output of `getHelpIntro()`, appends the output of `getHelpSummaryEntry()` for each named command, and finally appends the output of `getHelpTrailer()`. Override any of those methods to refine the default behavior, or override this method to completely replace this behavior. The output gets wrapped at a width configured for MultiCommand.
     *
     * @param rightMargin The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior.
     * @return String providing help output summarizing all of the commands.
     */
         
    getHelp(rightMargin) {
        if (this.commandInfoArray.length === 0)
            return "Help is not available.";
            
        let help = this.getHelpIntro(rightMargin);
        let self = this;
        this.commandInfoArray.forEach(function (commandInfo) {
            if (commandInfo.firstOfGroup)
                help += "\n";
            help += self.getHelpSummaryEntry(commandInfo, rightMargin);
        });
        return help + this.getHelpTrailer(rightMargin);
    }
    
    /**
     * Returns the introduction for the help page that summarizes all of the available commands. A list of the available commands immediately follows this introduction, so the introduction may wish to introduce them.
     *
     * @param rightMargin The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior.
     * @return String introducing the overall help page.
     */
    
    getHelpIntro(rightMargin) {
        return "This tool supports the following commands:\n\n";
    }
    
    /**
     * Returns the summary help for a particular hand as it should appear within the general help page.
     *
     * @param commandInfo An object that characterizes a particular command. This is the object that the command's `getInfo()` class method return. This object also has the `name` property set to the name of the command.
     * @param rightMargin The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior.
     * @return String summarizing the indicated command.
     */
    
    getHelpSummaryEntry(commandInfo, rightMargin) {
        let syntax = commandInfo.syntax.substr(commandInfo.name.length);
        return commandInfo.name.toUpperCase() + syntax +"\n"+
                optionhelp.wrapText('  '+ commandInfo.summary, rightMargin,
                        true) +"\n";        
    }
    
    /**
     * Returns text that should follow the summaries of all of the commands on the general help page. Returns only a blank line by default.
     *
     * @param rightMargin The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior.
     * @return String of text that ends the general help.
     */
    
    getHelpTrailer(rightMargin) {
        return "\n";
    }
}
module.exports.MultiCommand = MultiCommand;

//// SUPPORT FUNCTIONS ////////////////////////////////////////////////////////

function addConfigOptions(moreConfig) {
    for (let key in moreConfig) {
        let value = moreConfig[key];
        switch (key) {
            case 'alias':
                // alias already initialized for --help
                Object.assign(this.alias, value);
                break;
            case 'boolean':
                // boolean already initialized for -h
                if (Array.isArray(value))
                    this.boolean = this.boolean.concat(value);
                else
                    this.boolean.push(value);
                break;
            case 'default':
                if (!this.default)
                    this.default = {};
                Object.assign(this.default, value);
                break;
            case 'string':
                if (!this.string)
                    this.string = [];
                if (typeof value === 'string')
                    this.string.push(value);
                else
                    this.string = this.string.concat(value);
                break;
            default:
                this[key] = value;
        }
    }
}

function getNextNonOptionArg() {
    if (this._.length === 0)
        return null;
    return this._.shift();
}
