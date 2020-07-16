import * as globAll from 'glob-all';
import { IOptions } from 'glob';
import * as fsExtra from 'fs-extra';
import { Formatter } from './Formatter';
import { FormattingOptions } from './FormattingOptions';

export class Runner {

    public static run(runnerOptions: RunnerOptions) {
        let runner = new Runner();
        return runner.run(runnerOptions);
    }

    public async run(runnerOptions: RunnerOptions) {
        let args = this.normalizeArgs(runnerOptions);
        let filePaths = globAll.sync(args.files, {
            cwd: args.cwd,
            absolute: true
        } as IOptions);

        let formatter = new Formatter(args);

        //print the list of unformatted files if found (and enabled)
        if (args.check) {
            console.log('Checking formatting...');
        }

        let unformattedFiles = [] as string[];

        await Promise.all(filePaths.map(async filePath => {
            let text = (await fsExtra.readFile(filePath)).toString();
            let formattedText = formatter.format(text);

            //overwrite the file with the formatted version
            if (args.write) {
                await fsExtra.writeFile(filePath, formattedText);
            }

            //if configured, compare formatted file to unformatted file
            //TODO find a more efficient way to do this other than string comparisons (large files could cause performance issues)
            if (args.check && text !== formattedText) {
                unformattedFiles.push(filePath);
            }
        }));

        //print the list of unformatted files if found (and enabled)
        if (args.check) {
            if (unformattedFiles.length > 0) {
                for (let filePath of unformattedFiles) {
                    console.log(filePath);
                }
                throw new Error('Formatting issues found in the above file(s)');
            } else {
                console.log('All matched files are formatted properly!');
            }
        }
    }

    public normalizeArgs(args: RunnerOptions): RunnerOptions {
        args.files = Array.isArray(args.files) ? args.files : [];
        args.cwd = args.cwd ?? process.cwd();
        return args;
    }
}

export interface RunnerOptions extends FormattingOptions {
    /**
     * A list of file paths or globs
     */
    files: string[];
    /**
     * The current working directory that should be used when running this runner
     */
    cwd?: string;
    /**
     * This rewrites all processed in place. It is recommended to commit your files before using this option
     */
    write?: boolean;
    /**
     * Will list any unformatted files and return a nonzero eror code if any were found
     */
    check?: boolean;
    /**
     * If true, absolute paths are printed instead of relative paths
     */
    absolute?: boolean;
}