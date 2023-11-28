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
import { OFSEntity, Plugin } from "./plugin.js";
import { PluginDescription, PropertyDetails } from "./descriptor.js";

type Options = {
    label: string;
    filename: string | undefined;
    credentials: string;
};

const y = yargs(hideBin(process.argv));
var myOFS: OFS;
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
    handler: async (argv: ArgumentsCamelCase<any>): Promise<void> => {
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
            descriptor = JSON.parse(
                readFileSync(argv.descriptorFile).toString()
            );
            descriptor.propertyValidator = validateProperty;
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

async function validateProperty(
    element: string | PropertyDetails,
    entity: OFSEntity
): Promise<boolean> {
    let label: string | undefined = undefined;
    if (typeof element === "string") {
        label = element;
    } else if (typeof element === "object" && element.label) {
        label = element.label;
    }

    if (!label) {
        console.warn(
            `...Properties: Validation..Skipped unknown type ${typeof element}`
        );
        return false;
    } else {
        let result = await myOFS.getPropertyDetails(label);
        if (result.status === 200) {
            console.log(`...Properties: Validation..${label} exists`);
            return true;
        } else if (result.status === 404) {
            console.warn(`...Properties: Validation..${label} does not exist`);
            return false;
        } else {
            console.warn(
                `...Properties: Validation..${label} unknown error: ${result.description}`
            );
            return false;
        }
    }
}
