import { OFSPropertyDetails, OFS } from "@ofs-users/proxy";
import { OFSEntity } from "./plugin.js";
import { PathOrFileDescriptor, readFileSync } from "fs";
import { type } from "os";
import { defaultLogger } from "./logging.js";

export class PropertyDetails implements OFSPropertyDetails {
    label: string;
    type: string;
    constructor(label: string, type: string) {
        this.label = label;
        this.type = type;
    }
}
export class PropertiesDescription {
    activity: (string | PropertyDetails)[] = [];
    provider: (string | PropertyDetails)[] = [];
    inventory: (string | PropertyDetails)[] = [];
    request: (string | PropertyDetails)[] = [];
}
export interface SecuredParamsDescription {
    name: string;
    value?: any;
}
interface PluginDescriptionInterface {
    properties?: PropertiesDescription;
    securedParams?: SecuredParamsDescription[];
}

export class PluginDescription implements PluginDescriptionInterface {
    private _instance: OFS | undefined;
    properties: PropertiesDescription = new PropertiesDescription();
    securedParams?: SecuredParamsDescription[];

    static load(descriptorFile: PathOrFileDescriptor): PluginDescription {
        let obj = JSON.parse(readFileSync(descriptorFile).toString());
        return Object.assign(new PluginDescription(), obj);
    }

    set instance(myOFS: OFS) {
        this._instance = myOFS;
    }

    get instance(): OFS {
        return this._instance!;
    }

    async validate(): Promise<boolean> {
        let valid = true;
        defaultLogger.info("Validating properties");
        if (this.properties.activity)
            for (const property of this.properties.activity) {
                let validationResult = await this.validateProperty(
                    property,
                    OFSEntity.Activity
                );
                valid = valid && validationResult;
            }
        if (this.properties.provider)
            for (const property of this.properties.provider) {
                let validationResult = await this.validateProperty(
                    property,
                    OFSEntity.Provider
                );
                valid = valid && validationResult;
            }
        if (this.properties.inventory)
            for (const property of this.properties.inventory) {
                let validationResult = await this.validateProperty(
                    property,
                    OFSEntity.Inventory
                );
                valid = valid && validationResult;
            }
        if (this.properties.request)
            for (const property of this.properties.request) {
                let validationResult = await this.validateProperty(
                    property,
                    OFSEntity.Request
                );
                valid = valid && validationResult;
            }
        return valid;
    }

    async validateProperty(
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
            defaultLogger.warn(
                `...Validation: Properties: Skipped property without label`
            );
            return false; // 1: Skipped
        } else {
            let result = await this.instance.getPropertyDetails(label);
            if (result.status === 200) {
                defaultLogger.info(
                    `...Validation: Properties: ${entity}.${label} exists`
                );
                return true; // 0: OK
            } else if (result.status === 404) {
                defaultLogger.error(
                    `...Validation: Properties: ${entity}.${label} does not exist`
                );
                return false; // 2: Not found
            } else {
                defaultLogger.warn(
                    `...Validation: Properties: ${label} unknown error: ${result.description}`
                );
                return false; // 3: Unknown error
            }
        }
    }
}
