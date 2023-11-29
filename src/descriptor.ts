import { OFSPropertyDetails, OFS, OFSTranslation } from "@ofs-users/proxy";
import { OFSEntity } from "./plugin.js";
import { PathOrFileDescriptor, readFileSync } from "fs";
import { defaultLogger } from "./logging.js";

export class PropertyDetails implements OFSPropertyDetails {
    label: string;
    type: string;
    entity: string;
    name: string;
    translations?: OFSTranslation[];
    gui?: string;
    constructor(label: string, type: string, entity: string, name?: string) {
        this.label = label;
        this.type = type;
        this.entity = entity;
        if (name) {
            this.name = name;
        } else {
            this.name = label;
        }
    }
}

const defaultValues: Map<string, OFSPropertyDetails> = new Map();
defaultValues.set("string", { label: "", gui: "text" });

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

    async validate(createProperties: boolean = false): Promise<boolean> {
        let valid = true;
        defaultLogger.info("Validating properties");

        const validateProperties = async (
            properties: (string | PropertyDetails)[],
            entity: OFSEntity
        ) => {
            for (const property of properties) {
                let validationResult = await this.validateProperty(
                    property,
                    entity,
                    createProperties
                );
                defaultLogger.debug(
                    `...Validation: ${validationResult} for ${property}`
                );
                valid = valid && validationResult;
            }
        };

        if (this.properties.activity) {
            await validateProperties(
                this.properties.activity,
                OFSEntity.Activity
            );
        }
        if (this.properties.provider) {
            await validateProperties(
                this.properties.provider,
                OFSEntity.Provider
            );
        }
        if (this.properties.inventory) {
            await validateProperties(
                this.properties.inventory,
                OFSEntity.Inventory
            );
        }
        if (this.properties.request) {
            await validateProperties(
                this.properties.request,
                OFSEntity.Request
            );
        }

        return valid;
    }

    async validateProperty(
        element: string | PropertyDetails,
        entity: OFSEntity,
        create: boolean
    ): Promise<boolean> {
        let property: PropertyDetails;
        if (typeof element === "string") {
            property = new PropertyDetails(element, "", entity);
        } else if (typeof element === "object" && element.label) {
            property = { ...element };
            property.entity = entity;
            if (!property.name) {
                property.name = property.label;
            }
            if (!property.translations) {
                property.translations = [];
                property.translations.push({
                    language: "en",
                    name: property.name,
                    languageISO: "en-US",
                });
            }
            if (!property.gui) {
                property.gui = defaultValues.get(property.type)?.gui;
            }
        } else {
            defaultLogger.warn(
                `...Validation: Properties: Found unknown type: ${entity}.${JSON.stringify(
                    element
                )}}`
            );
            return false;
        }
        if (!property.label) {
            defaultLogger.warn(
                `...Validation: Properties: Skipped property without label`
            );
            return false; // 1: Skipped
        } else {
            let result = await this.instance.getPropertyDetails(property.label);
            if (result.status === 200) {
                defaultLogger.info(
                    `...Validation: Properties: ${entity}.${property.label} exists`
                );
                return true; // 0: OK
            } else if (result.status === 404) {
                defaultLogger.warn(
                    `...Validation: Properties: ${entity}.${property.label} does not exist`
                );
                if (create && typeof element === "object") {
                    let result = await this.createProperty(property);
                    return result;
                } else {
                    return false; // 2: Not found
                }
            } else {
                defaultLogger.warn(
                    `...Validation: Properties: ${property.label} unknown error: ${result.description} ${property}}`
                );
                return false; // 3: Unknown error
            }
        }
    }

    async createProperty(property: PropertyDetails): Promise<boolean> {
        const requiredFields = [
            "entity",
            "label",
            "type",
            "name",
            "translations",
            "gui",
        ];

        const missingFields = requiredFields.filter(
            (field) => !property.hasOwnProperty(field)
        );
        if (missingFields.length === 0) {
            let result = await this.instance.createReplaceProperty(property);
            if (result.status === 201) {
                defaultLogger.warn(
                    `...Validation: Properties: ${property.entity}.${property.label} created`
                );
                return true; // 0: OK
            } else if (result.status === 409) {
                defaultLogger.error(
                    `...Validation: Properties: ${property.entity}.${property.label} already exists`
                );
                return false; // 2: Already exists
            } else {
                defaultLogger.warn(
                    `...Creation: Properties: ${
                        property.label
                    } unknown error: ${JSON.stringify(
                        result
                    )}: ${JSON.stringify(property)}`
                );
                return false; // 3: Unknown error
            }
        } else {
            defaultLogger.warn(
                `...Creation: Properties: ${
                    property.label
                } missing fields: ${missingFields.join(", ")}`
            );
            return false; // 4: Incomplete property
        }
    }
}
