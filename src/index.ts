#!/usr/bin/env node

import { OFS } from "@ofs-users/proxy";
import {
    existsSync,
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
} from "fs";
import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import { PluginDescription } from "./descriptor.js";

type Options = {
    label: string;
    filename: string | undefined;
    credentials: string;
};

const y = yargs(hideBin(process.argv));

y.command({
    command: "upload <label>",
    describe: "Upload plugin",
    builder: {
        filename: {
            type: "string",
            default: "plugin.zip",
        },
        save: {
            type: "boolean",
            default: false,
        },
        test: {
            type: "boolean",
            default: false,
        },
        savefile: {
            type: "string",
            default: "plugin.xml",
        },
        credentials: {
            type: "string",
            default: "credentials.json",
        },
    },
    handler: (argv: ArgumentsCamelCase<Options>): void => {
        if (argv.filename && existsSync(argv.filename)) {
            process.stdout.write(`Uploading ${argv.filename}`);
            readFile(argv.filename, function (err, data) {
                const pluginObj: PluginDescription = new PluginDescription();
                pluginObj.content = data;
                pluginObj.label = argv.label;
                if (!argv.test) {
                    var myOFS = new OFS(
                        JSON.parse(readFileSync(argv.credentials).toString())
                    );
                    myOFS
                        .importPlugins(undefined, pluginObj.xml)
                        .then((result) => {
                            process.stdout.write(JSON.stringify(result));
                        });
                }
                if (argv.save && argv.savefile) {
                    writeFileSync(argv.savefile as string, pluginObj.xml);
                }
            });
        } else {
            process.stderr.write(`${argv.filename} not found`);
        }
    },
});

y.parse(process.argv.slice(2));
