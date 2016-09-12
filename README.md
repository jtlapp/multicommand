# multicommand

class framework for CLI tools implementing multiple commands 

## NOTICE

This module requires embellishment for general use. It is missing illustrative examples and a test suite. It is currently functioning in a private system.

## Overview

`multicommand` is an object-oriented class framework for implementing command lines that perform the command named in the first argument. When the command line lacks a command name, a default command runs instead. `multicommand` also provides facilities for outputting help for all of the commands.

Each named command, along with the default command, may have its own set of arguments. Commands can use class inheritance to share common arguments and implementation.

MultiCommand is the base class for the executable command line. NamedCommand is the base class for each supported command. One normally subclasses MultiCommand to provide an introduction for the help page and also NamedCommand for each named command. The named command subclasses are registered with the MultiCommand to make them available to the command line.

## Benefits

MultiCommand is primarily useful for implementating multiple commands that may incrementally build on one another or on common abstract base classes. Command options are configured via [`minimist`](https://github.com/substack/minimist) configuration options, and although each command can independently specify its options, each class in a hierarchy can also incremently add the options it expects and extract the arguments that are specific to the class.

MultiCommand also provides default handling for displaying help. It lists summary information for each command on an overall help page, and it allows each command to provide its own specific help page. Subclass MultiCommand to override the default help page behavior.

## Usage

You may create a command line executable by instantiating MultiCommand, but it's best to subclass MultiCommand and at least override `getHelpIntro()` to provide an introduction for the help man page. In addition, it's probably best to have the subclass constructor add the supported commands to the instance.

Add commands to an instance of MultiCommand by calling its `addCommands()` method, passing the method an array of concrete subclasses of the abstract class NamedCommand. You may call `addCommands()` multiple times. The default implementation of `MultiCommand#getHelp()` separates each set of added commands by a blank line on the help page to visually group related commands together.

Call `run()` on the MultiCommand to perform the requested command, passing in the raw command line arguments and providing a callback. The callback allows the command to report completion after asynchronous processing.

## The Default Command

When the command line does not start with a command name, an unnamed default command runs. MultiCommand implements this default command by performing the following steps:

1. Passes minimist configuration options to `addDefaultOptions()` to allow the command to extend the configuration to support additional options. The initially provided configuration only supports `-h` and `--help`.
2. Passes the arguments output by minimist to `parseDefaultArgs()` for parsing and validation.
3. Calls `doDefaultCommand()` to perform the default command with the parsed and validated arguments.

When the command line includes `-h` or `--help` but no named command, neither `parseDefaultArgs()` nor `doDefaultCommand()` is called, and `getHelp()` is called instead to show general help for all available commands.

## Named Commands

Concrete subclasses of NamedCommand implement named commands. When the first argument of the command line is a non-option argument (i.e. doesn't begin with a dash), this argument is expected to be a command name. The remaining arguments are the arguments of the particular named command. MultiCommand passes these arguments to the instance of NamedCommand that handles the named command, delegating execution of the command line to the instance.

The methods of NamedCommand are designed to allow class inheritance to facilitate sharing code that is common across commands.

### Defining a Named Command

Each concrete subclass of NamedCommand that implements a particular command name implements the static class method `getInfo()` to define the command. This method returns an object having the following two properties:

- `syntax`: A string that illustrates the command's argument syntax. The first term of this string is the command name. The name must neither begin with a dash nor contain spaces. The name may be in any letter case, but a user may provide the name in any letter case to run the command.
- `summary`: A single line that summarizes the command, for display when providing help for all of the commands.

The following example illustrates `getInfo()`:

```js
static getInfo() {
    return {
        syntax: "dequeue [<job-number>] [--all]",
        summary: "Removes pending job(s) from the job queue"
    };
}
```

### Named Command Execution

Upon recognizing the command on the command line, MultiCommand creates an instance of the named command subclass and performs the following steps:

1. Passes minimist configuration options to `addOptions()` to allow the command to extend the configuration to support additional options. The initially provided configuration only supports `-h` and `--help`.
2. Passes the arguments output by minimist to `parseArgs()` for parsing and validation.
3. Calls `doCommand()` to perform the named command with the parsed and validated arguments.

These are each separate methods so that an inheritance tree may selectively override them. When the command line includes `-h` or `--help`, neither `parseArgs()` nor `doCommand()` is called, and `getHelp()` is called instead.

## Minimist Options and Arguments

`multicommand` uses the [`minimist`](https://github.com/substack/minimist) module to define and read command line options. The `minimist` configuration options passed to `parseArgs()` and `parseDefaultArgs()` support the following properties, all of which are optional:

| Property | Description |
| -- | -- |
| `boolean` | An array of strings, each of which names a command line option that serves as a boolean switch. For example, `['x', 'recurse']` define the boolean switchs `-x` and `--recurse`. Single-letter switches are indicated on the command line with a single dash, while multi-letter switches are indicated via double-dashes. The `args` provided to subsequent methods includes a boolean of this name. This boolean is `true` when the command line includes the switch and false otherwise. If the command line includes `-xN` or `--recurse=N`, where `N` is a number, then the value of the switch in `args` is instead this number. |
| `string` | An array of strings, each of which names a command line option that expects a string value to follow. For example, `['file']` indicates that the `file` option must take either of the forms `--file <string>` or `--file=<string>`. The `args` of subsequent methods includes a string of this name having this value. For example, `args.file` would have value `<string>`. |
| `default` | An object that provides default values for options named in `boolean` and `string`. The keys of this object are the names of options in `boolean` and `string`. The value at a key is the default value of the option. It is not necessary to provide default values for the named `boolean` and `string` options, as booleans are `false` by default and strings are empty by default. |
| `alias` | An object that defines aliases for options named in `boolean` and `string`. The keys of this object are new names for options otherwise defined, and the value of each key names the already-defined option to which the alias is equivalent. The alias and the option it aliases will both have the same value in the `args` passed to subsequent methods. |

When the command line includes an option multiple times, the values of options are collected into an array ordered as they occur on the command line, and the option assumes the value of this array in the `args` parameter that gets passed to subsequent methods.

In addition to including the values of the options provided on the command line, as defined by the minimist configuration options, the `args` parameter passed to `parseArgs()` also has a `_` property (that's an underscore). This is an array of all of non-option parameters that occur on the command line following the command name. The array may be empty. `parseArgs()` may access this array directly or pull arguments out of the array sequentially via `args.getNext()`, which returns null when there are no more arguments. `parseArgs()` must empty the `args._` array before returning, as otherwise MultiCommand will error out reporting that the command did not recognize all of the arguments. `args._` is not available to `doCommand()`, so `parseArgs()` must extract any needed non-option argument values.

## API Reference

The `multicommand` module makes the following classes available as properties. The module is here assumed to be loaded in the variable `multicmd`.  

* **multicmd**

    * [.**MultiCommand**](#MultiCommand)

    * [.**NamedCommand**](#NamedCommand)

    * [.**CommandError**](#CommandError)

    * [.**CommandUsageError**](#CommandUsageError)

    * [.**UnexpectedArgError**](#UnexpectedArgError)


* [MultiCommand](#MultiCommand)

    * [new MultiCommand(options)](#new_MultiCommand_new)

    * [.addCommands(commandClasses)](#MultiCommand+addCommands)

    * [.run(argv, next)](#MultiCommand+run)

    * [.addDefaultOptions(options)](#MultiCommand+addDefaultOptions)

    * [.parseDefaultArgs(args)](#MultiCommand+parseDefaultArgs)

    * [.doDefaultCommand(args, next)](#MultiCommand+doDefaultCommand)

    * [.getHelp(rightMargin)](#MultiCommand+getHelp)

    * [.getHelpIntro(rightMargin)](#MultiCommand+getHelpIntro)

    * [.getHelpSummaryEntry(commandInfo, rightMargin)](#MultiCommand+getHelpSummaryEntry)

    * [.getHelpTrailer(rightMargin)](#MultiCommand+getHelpTrailer)



* [NamedCommand](#NamedCommand)

    * [.addOptions(options)](#NamedCommand+addOptions)

    * [.parseArgs(args)](#NamedCommand+parseArgs)

    * [.doCommand(args, next)](#NamedCommand+doCommand)

    * [.getHelp(rightMargin)](#NamedCommand+getHelp)

    * [.confirm(message, next)](#NamedCommand+confirm)

    * [.error(message, ...substitutions)](#NamedCommand+error)

    * [.usageError(message, ...substitutions)](#NamedCommand+usageError)



<a name="new_MultiCommand_new"></a>

### new MultiCommand(options)

| Param | Description |
| --- | --- |
| options | The configuration options |

Construct an instance of MultiCommand. Accepts the following configuration options:

- `helpWrapWidth`: Width in characters at which to wrap help output. Defaults to 80.

<a name="MultiCommand+addCommands"></a>

### *multiCommand*.addCommands(commandClasses)

| Param | Description |
| --- | --- |
| commandClasses | Array of NamedCommand subclasses to add |

Adds named commands, which are subclasses of NamedCommand. May be called multiple times. If the first argument of the command line is the name of one of these added commands, that named command is performed instead of the default command, calling `doCommand()` on the NamedCommand rather than `doDefaultCommand()` on this MultiCommand.

<a name="MultiCommand+run"></a>

### *multiCommand*.run(argv, next)

| Param | Description |
| --- | --- |
| argv | An array of command line arguments to process. This array must exclude the arguments for executing the command. For example, if "node filename" executes the command, the caller can provide process.argv.slice(2). |
| next | The next `function (err)` to call. The caller should handle the error if it is an instance of CommandError. |

Run the command line, including processing command line arguments. One of the methods `MultiCommand#doDefaultCommand` and `NamedCommand#doCommand` is responsible for performing the command after arguments have been processed. See NamedCommand for an explanation of how named commands are processed.

<a name="MultiCommand+addDefaultOptions"></a>

### *multiCommand*.addDefaultOptions(options)

| Param | Description |
| --- | --- |
| options | A configuration object of options for minimist. Call `options.add(moreOptions)` to define more options. |

Adds command line options to the two already supported, `-h` and `--help`, for the case where the command line does not include a command name. Command line options are arguments that begin with one or two dashes. The method receives a minimist configuration options object and optionally extends this object. See `NamedCommand#addOptions` for a fuller explanation of the purpose and behavior of this method.

`addDefaultOptions()` does nothing by default. A subclass overrides this method to provide support for option arguments (arguments beginning with one or two dashes).

<a name="MultiCommand+parseDefaultArgs"></a>

### *multiCommand*.parseDefaultArgs(args)

| Param | Description |
| --- | --- |
| args | The command line arguments as output by minimist and processed by `addDefaultOptions()`. Feel free to modify this object or copy values to instance variables of the named command. `args._` will be empty. |

Parses and validates command line arguments for the case where the command line does not include a command name. The arguments are provided in the form of the output of minimist. The modified arguments subsequently pass to `doDefaultCommand()`. See `NamedCommand#parseArgs` for a fuller explanation of the purpose and behavior of this method.

This method should throw CommandUsageError if any arguments are invalid. This method's final value of `args` passes to `doDefaultCommand()`.

`parseArgs()` does nothing by default. Override this method in a subclass to preprocess any provided argument options.

<a name="MultiCommand+doDefaultCommand"></a>

### *multiCommand*.doDefaultCommand(args, next)

| Param | Description |
| --- | --- |
| args | An object containing the arguments output of minimist after processing by `parseDefaultArgs()`, including the command line options that `addDefaultOptions()` defined. `args._` is not available to this method. |
| next | The next `function (err)` to call. The method must call this function when done and must not call it more than once. |

Performs the default command. The default command is the command that MultiCommand represents when the first command line argument is not a command name. The method is called with the arguments object that `parseDefaultArgs()` processed. Behavior may be a function of these arguments and a function of any instance variables that `parseDefaultArgs()` established. The method must call the `next()` callback when done and may pass an instance of CommandError to `next()` to report an error to the calling application.

<a name="MultiCommand+getHelp"></a>

### *multiCommand*.getHelp(rightMargin)

| Param | Description |
| --- | --- |
| rightMargin | The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior. |

Returns a help summary of all of the commands. The default implementation prepends the output of `getHelpIntro()`, appends the output of `getHelpSummaryEntry()` for each named command, and finally appends the output of `getHelpTrailer()`. Override any of those methods to refine the default behavior, or override this method to completely replace this behavior. The output gets wrapped at a width configured for MultiCommand.

**Returns**: String providing help output summarizing all of the commands.  
<a name="MultiCommand+getHelpIntro"></a>

### *multiCommand*.getHelpIntro(rightMargin)

| Param | Description |
| --- | --- |
| rightMargin | The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior. |

Returns the introduction for the help page that summarizes all of the available commands. A list of the available commands immediately follows this introduction, so the introduction may wish to introduce them.

**Returns**: String introducing the overall help page.  
<a name="MultiCommand+getHelpSummaryEntry"></a>

### *multiCommand*.getHelpSummaryEntry(commandInfo, rightMargin)

| Param | Description |
| --- | --- |
| commandInfo | An object that characterizes a particular command. This is the object that the command's `getInfo()` class method return. This object also has the `name` property set to the name of the command. |
| rightMargin | The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior. |

Returns the summary help for a particular hand as it should appear within the general help page.

**Returns**: String summarizing the indicated command.  
<a name="MultiCommand+getHelpTrailer"></a>

### *multiCommand*.getHelpTrailer(rightMargin)

| Param | Description |
| --- | --- |
| rightMargin | The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior. |

Returns text that should follow the summaries of all of the commands on the general help page. Returns only a blank line by default.

**Returns**: String of text that ends the general help.  
<a name="NamedCommand+addOptions"></a>

### *namedCommand*.addOptions(options)

| Param | Description |
| --- | --- |
| options | A configuration object of options for minimist, as described above. Call `options.add(moreOptions)` to define more options. |

Adds command line options to the two already supported, `-h` and `--help`. Command line options are arguments that begin with one or two dashes. The method receives a minimist configuration options object, as described above, and optionally extends this object. To add options to the configuration, call `options.add(moreOptions)` with a minimist configuration options object `moreOptions` that defines the additional options. `options.add()` may be called any number of times, with each call adding any number of options. This feature is particularly useful for passing `options` up an inheritance tree to allow each ancestor class to separately extend the options.

`addOptions()` does nothing by default. A subclass need only override this method to provide support for option arguments, which begin with one or two dashes.

<a name="NamedCommand+parseArgs"></a>

### *namedCommand*.parseArgs(args)

| Param | Description |
| --- | --- |
| args | The command line arguments as output by minimist and processed by `addOptions()`. Feel free to modify this object or copy values to instance variables of the named command. `args._` must be empty on return in order for MultiCommand to run the command. |

Parses and validates the command line arguments. The arguments are provided in the form of the output of minimist, as described above. The modified arguments subsequently pass to `doDefaultCommand()`.

The `args` parameter contains the values of the defined options, and `args._` contains an array of all provided non-option arguments. `parseArgs()` must copy and remove from `args._` all of the non-option arguments it recognizes. MultiCommand will report the presence of unrecognized arguments if `parseArgs()` leaves `args._` non-empty. You may use `args._.shift()` or the convenience method `args.getNext()` to remove arguments, the latter of which returns null when there are no more non-option arguments. You may store the extracted values either as instance variables of `this` object or as additional properties of `args`.

This method should throw CommandUsageError if any arguments are invalid. This is also the place where the command should check for the proper presence or absence of arguments. If this method returns without throwing and with `args._` empty, `doCommand()` is called next with this method's final value of `args`.

`parseArgs()` does nothing by default.

<a name="NamedCommand+doCommand"></a>

### *namedCommand*.doCommand(args, next)

| Param | Description |
| --- | --- |
| args | An object containing the arguments output of minimist after processing by `parseArgs()`, including the command line options that `addOptions()` defined. `args._` is not available to this method. |
| next | The next `function (err)` to call. The method must call this function when done and must not call it more than once. |

Performs the command. The method is called with the arguments object that `parseArgs()` processed. Behavior may be a function of these arguments and a function of any instance variables that `parseArg()` established. The method must call the `next()` callback when done and may pass an instance of CommandError to `next()` to report an error to the calling application.

<a name="NamedCommand+getHelp"></a>

### *namedCommand*.getHelp(rightMargin)

| Param | Description |
| --- | --- |
| rightMargin | The character column after which MultiCommand will wrap the return value. Useful here for overriding default wrapping behavior. |

Returns help when `-h` or `--help` follows the command name on the command line. By default, the method returns only the syntax and summary lines that `getInfo()` provides. Override this method to produce more extensive help for the command. The output gets wrapped at a width configured for MultiCommand.

**Returns**: String providing help for this particular command, possibly extensive multiline help.  
<a name="NamedCommand+confirm"></a>

### *namedCommand*.confirm(message, next)

| Param | Description |
| --- | --- |
| message | Message to present to the user. |
| next | The next `function (err, confirmed)` to call, where `confirmed` is a boolean taking the value `true` when confirmed. |

Displays the provided message to stdout and waits for the user to respond and hit enter. If the user types "y" or "yes" (in any letter case), the second parameter of `next()` will be true, otherwise false.
This is a support method for implementations of `doCommand()`.

<a name="NamedCommand+error"></a>

### *namedCommand*.error(message, ...substitutions)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | An error message, optionally using the `%` formatting codes of `util.format()`. |
| ...substitutions | <code>\*</code> | Optional arguments that replace `%` formatting codes in `message`. |

Shorthand method for creating CommandError exceptions. The method accepts `util.format()` arguments. That is, the first argument is a string that may contain `%` formatting codes, and the following arguments replace the codes in the string.

This is a support method for implementations of `doCommand()`.

**Returns**: A new instance of CommandError.  
<a name="NamedCommand+usageError"></a>

### *namedCommand*.usageError(message, ...substitutions)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | An error message, optionally using the `%` formatting codes of `util.format()`. |
| ...substitutions | <code>\*</code> | Optional arguments that replace `%` formatting codes in `message`. |

Shorthand method for creating CommandUsageError exceptions. The method accepts `util.format()` arguments. That is, the first argument is a string that may contain `%` formatting codes, and the following arguments replace the codes in the string.

This is a support method for implementations of `parseArgs()`.

**Returns**: A new instance of CommandUsageError.  
<a name="new_CommandError_new"></a>

### new CommandError()
Error that prevents the command from running.

<a name="new_CommandUsageError_new"></a>

### new CommandUsageError()
Command line usage error

<a name="new_UnexpectedArgError_new"></a>

### new UnexpectedArgError()
Error for providing more non-option arguments than the command accepts.


## LICENSE

This software is released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Copyright © 2016 Joseph T. Lapp