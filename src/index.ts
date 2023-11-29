#!/usr/bin/env node

import { OFS } from "@ofs-users/proxy";
import {
    exists,
    existsSync,
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
} from "fs";
import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import { DescriptorJSON, DescriptorXML } from "./converter.js";
import { OFSEntity, Plugin } from "./plugin.js";
import { PluginDescription, PropertyDetails } from "./descriptor.js";
import { defaultLogger } from "./logging.js";

type Options = {
    label: string;
    filename: string | undefined;
    credentials: string;
};

const y = yargs(hideBin(process.argv));
var myOFS: OFS;
y.command({
    command: "upload <label>",
    describe:
        "Utilitiy to upload a plugin to an OFS instance with the label <label>",
    builder: {
        filename: {
            type: "string",
            default: "plugin.zip",
            describe: "Plugin file",
        },
        save: {
            type: "boolean",
            default: false,
            describe: "Save the plugin description to a file",
        },
        test: {
            type: "boolean",
            default: false,
            describe: "Do not upload the plugin",
        },
        savefile: {
            type: "string",
            default: "plugin.xml",
            describe: "Save the plugin description to a file",
        },
        credentials: {
            type: "string",
            default: "credentials.json",
            describe: "Credentials file",
        },
        descriptorFile: {
            type: "string",
            default: "descriptor.json",
            describe: "Descriptor file",
        },
        validate: {
            type: "boolean",
            default: false,
            describe: "Validate the descriptor file",
        },
        createProperties: {
            type: "boolean",
            default: false,
            describe: "Create properties in the instance",
        },
        verbose: {
            type: "boolean",
            default: false,
            describe: "Verbose output",
        },
        debug: {
            type: "boolean",
            default: false,
            describe: "Debug output",
        },
    },
    handler: async (argv: ArgumentsCamelCase<any>): Promise<void> => {
        let logger = defaultLogger;
        if (argv.verbose) {
            logger.level = "info";
        }
        if (argv.debug) {
            logger.level = "debug";
        }
        // Check if there is a credentials file
        if (existsSync(argv.credentials)) {
            myOFS = new OFS(
                JSON.parse(readFileSync(argv.credentials).toString())
            );
        } else {
            console.error(`Credentials file ${argv.credentials} not found`);
            process.exit(1);
        }
        // Check if there is a descriptor file
        var descriptor: PluginDescription;
        if (existsSync(argv.descriptorFile)) {
            descriptor = PluginDescription.load(argv.descriptorFile);
            descriptor.instance = myOFS;
            if (argv.validate || argv.createProperties) {
                //
                let result = await descriptor
                    .validate(argv.createProperties)
                    .then((result) => {
                        if (!result) {
                            logger.error("Validation failed");
                            process.exit(1);
                        } else {
                            logger.info(`Validation OK ${result}`);
                        }
                    });
            }
        } else {
            console.error(`Descriptor file ${argv.descriptorFile} not found`);
            process.exit(1);
        }

        if (argv.filename && existsSync(argv.filename)) {
            console.info(`Uploading ${argv.filename}`);
            readFile(argv.filename, function (err, data) {
                const pluginObj: Plugin = new Plugin(descriptor);
                pluginObj.content = data;
                pluginObj.label = argv.label;

                if (!argv.test) {
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

y.command({
    command: "json",
    describe: "Convert XM Lplugin description into JSON form",
    builder: {
        filename: {
            type: "string",
            default: "plugin.xml",
        },
        compact: {
            type: "boolean",
            default: true,
        },
    },
    handler: (argv: ArgumentsCamelCase<any>): void => {
        if (argv.filename && existsSync(argv.filename)) {
            process.stderr.write(`Converting ${argv.filename}`);
            readFile(argv.filename, function (err, data) {
                var des = new DescriptorJSON(data, argv.compact);
            });
        } else {
            process.stderr.write(`${argv.filename} not found`);
        }
    },
});

y.command({
    command: "xml",
    describe: "Convert JSON plugin description into XML form",
    builder: {
        filename: {
            type: "string",
            default: "plugin.json",
        },
        compact: {
            type: "boolean",
            default: true,
        },
    },
    handler: (argv: ArgumentsCamelCase<any>): void => {
        if (argv.filename && existsSync(argv.filename)) {
            process.stderr.write(`COnverting ${argv.filename}`);
            readFile(argv.filename, function (err, data) {
                var des = new DescriptorXML(data, argv.compact);
            });
        } else {
            process.stderr.write(`${argv.filename} not found`);
        }
    },
});

y.parse(process.argv.slice(2));
