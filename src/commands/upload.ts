import type { Arguments, CommandBuilder } from "yargs";
import { json2xml } from "xml-js";
import { PluginDescription } from "../descriptor";
import { readFile, existsSync, readFileSync } from "fs";
import { createHash } from "crypto";
import { OFS } from "@ofs-users/proxy";

type Options = {
    label: string;
    filename: string | undefined;
    credentials: string;
};

export const command: string = "upload <label>";
export const desc: string = "Upload plugin";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs.positional("label", { type: "string", demandOption: true }).options({
        filename: {
            type: "string",
            default: "plugin.zip",
        },
        credentials: {
            type: "string",
            default: "credentials.json",
        },
    });

export const handler = (argv: Arguments<Options>): void => {
    process.stdout.write(JSON.stringify(argv));
    if (argv.filename && existsSync(argv.filename)) {
        process.stdout.write(argv.filename);
        readFile(argv.filename, function (err, data) {
            const jsonObj: PluginDescription = new PluginDescription();
            jsonObj.content = data;
            jsonObj.label = argv.label;

            var myOFS = new OFS(
                JSON.parse(readFileSync(argv.credentials).toString())
            );
            //process.stdout.write(jsonObj.xml);
        });
    } else {
        process.stderr.write(`${argv.filename} not found`);
    }
};
