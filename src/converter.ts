import { xml2json, json2xml } from "xml-js";

export class DescriptorJSON {
    private _obj: string;
    constructor(text: Buffer, compact: boolean) {
        var options = { compact: compact, spaces: 4 };
        this._obj = xml2json(text.toString(), options);
        process.stdout.write(this._obj);
    }
}

export class DescriptorXML {
    private _obj: string;
    constructor(text: Buffer, compact: boolean) {
        var options = { compact: compact, spaces: 4 };
        this._obj = json2xml(text.toString(), options);
        process.stdout.write(this._obj);
    }
}
