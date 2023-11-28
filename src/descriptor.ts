import { OFSPropertyDetails } from "@ofs-users/proxy";
import { OFSEntity } from "./plugin";
import { readFileSync } from "fs";

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
    propertyValidatorVoid(label: string, entity: OFSEntity) {
        return true;
    }
    properties?: PropertiesDescription;
    securedParams?: SecuredParamsDescription[];
    _propertyValidator?: CallableFunction = this.propertyValidatorVoid;

    set propertyValidator(validator: CallableFunction) {
        this._propertyValidator = validator;
    }

    get propertyValidator(): CallableFunction {
        if (this._propertyValidator) return this._propertyValidator;
        else return this.propertyValidatorVoid;
    }

    static load(descriptorFile: string): PluginDescription {
        let obj = JSON.parse(readFileSync(descriptorFile).toString());
        return Object.assign(new PluginDescription(), obj);
    }
}
