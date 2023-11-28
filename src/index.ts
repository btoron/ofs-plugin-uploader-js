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
import { DescriptorJSON, DescriptorXML } from "./converter.js";
import { OFSEntity, Plugin, PluginDescription } from "./descriptor.js";

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
        descriptorFile: {
            type: "string",
            default: "descriptor.json",
        },
        validate: {
            type: "boolean",
            default: false,
        },
    },
    handler: (argv: ArgumentsCamelCase<any>): void => {
        // Check if there is a descriptor file
        var descriptor: PluginDescription = {};
        if (existsSync(argv.descriptorFile)) {
            descriptor = JSON.parse(
                readFileSync(argv.descriptorFile).toString()
            );
        }
        if (argv.filename && existsSync(argv.filename)) {
            process.stderr.write(`Uploading ${argv.filename}\n`);
            readFile(argv.filename, function (err, data) {
                const pluginObj: Plugin = new Plugin(descriptor);
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
