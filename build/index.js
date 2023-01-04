#!/usr/bin/env node
import { OFS } from "@ofs-users/proxy";
import { existsSync, readFile, readFileSync, writeFileSync, } from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { PluginDescription } from "./descriptor.js";
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
            default: true,
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
    handler: (argv) => {
        if (argv.filename && existsSync(argv.filename)) {
            process.stdout.write(`Uploading ${argv.filename}`);
            readFile(argv.filename, function (err, data) {
                const pluginObj = new PluginDescription();
                pluginObj.content = data;
                pluginObj.label = argv.label;
                var myOFS = new OFS(JSON.parse(readFileSync(argv.credentials).toString()));
                myOFS.importPlugins(undefined, pluginObj.xml).then((result) => {
                    process.stdout.write(JSON.stringify(result));
                });
                if (argv.save && argv.savefile) {
                    writeFileSync(argv.savefile, pluginObj.xml);
                }
            });
        }
        else {
            process.stderr.write(`${argv.filename} not found`);
        }
    },
});
y.parse(process.argv.slice(2));
