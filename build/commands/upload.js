import { PluginDescription } from "../descriptor";
import { readFile, existsSync, readFileSync } from "fs";
import { OFS } from "@ofs-users/proxy";
export const command = "upload <label>";
export const desc = "Upload plugin";
export const builder = (yargs) => yargs.positional("label", { type: "string", demandOption: true }).options({
    filename: {
        type: "string",
        default: "plugin.zip",
    },
    credentials: {
        type: "string",
        default: "credentials.json",
    },
});
export const handler = (argv) => {
    process.stdout.write(JSON.stringify(argv));
    if (argv.filename && existsSync(argv.filename)) {
        process.stdout.write(argv.filename);
        readFile(argv.filename, function (err, data) {
            const jsonObj = new PluginDescription();
            jsonObj.content = data;
            jsonObj.label = argv.label;
            var myOFS = new OFS(JSON.parse(readFileSync(argv.credentials).toString()));
            //process.stdout.write(jsonObj.xml);
        });
    }
    else {
        process.stderr.write(`${argv.filename} not found`);
    }
};
