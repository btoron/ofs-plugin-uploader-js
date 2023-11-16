import { throws } from "assert";
import { Console } from "console";
import { createHash } from "crypto";
import { json2xml } from "xml-js";
export enum OFSEntity {
    Activity = "activity",
    Inventory = "inventory",
    Request = "request",
    Provider = "provider",
}

class PropertiesDescription {
    activity: string[] = [];
    provider: string[] = [];
    inventory: string[] = [];
    request: string[] = [];
}

interface SecuredParamsDescription {
    name: string;
    value?: any;
}

export interface PluginDescription {
    properties?: PropertiesDescription;
    securedParams?: SecuredParamsDescription[];
}
export class Plugin {
    _data = {
        _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
        root: {
            format: {
                _attributes: {
                    version: 1,
                },
            },
            product: {
                _attributes: {
                    version: "22.11.1",
                },
            },
            plugins: {
                plugin: {
                    _attributes: {
                        label: "label",
                        action_label: "",
                        action_entity: "",
                        action_type: "addon_action",
                        type: "addon",
                    },
                    translations: {
                        translation: {
                            _attributes: {
                                lang: "en",
                                val: "label",
                            },
                        },
                    },
                    fields: {
                        field: [
                            {
                                _attributes: {
                                    label: "aid",
                                    entity: "activity",
                                },
                            },
                        ],
                    },
                    secured_params: {
                        secured_param: [{}],
                    },
                    plugin_data: {
                        plugin_data_item: {
                            _attributes: {
                                path: "",
                                post_data: "",
                                width: "",
                                height: "",
                                options: "32",
                                user_agent_mask: "",
                                sort_order: 0,
                                native_app_label: "",
                                auth_type: "",
                                auth_login: "",
                            },
                            hosted_plugin_data: {
                                _attributes: {
                                    name: "label_name",
                                    content_hash: "hash",
                                },
                                content: {
                                    _cdata: "NONE",
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    private _properties: PropertiesDescription;
    private _secured_params: string[] = [];

    set content(buffer: Buffer) {
        var hash = createHash("sha256");
        hash.update(buffer);
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data.content._cdata =
            buffer.toString("base64");
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.content_hash =
            hash.digest("hex");
    }

    set label(str: string) {
        this._data.root.plugins.plugin._attributes.label = str;
        this._data.root.plugins.plugin.translations.translation._attributes.val =
            str;
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.name =
            str;
    }

    get xml() {
        const json = JSON.stringify(this._data);
        const xml = json2xml(json, { compact: true, spaces: 4 });
        return xml;
    }

    add_property(label: string, entity: OFSEntity) {
        if (this._properties[entity].includes(label)) {
            process.stderr.write(
                `...Properties: Skipped ${entity}.${label}. Duplicated\n`
            );
        } else {
            process.stderr.write(`...Properties: Added ${entity}.${label}\n`);
            this._data.root.plugins.plugin.fields.field.push({
                _attributes: {
                    label: label,
                    entity: entity,
                },
            });
            this._properties[entity].push(label);
        }
    }

    add_secured_param(param: SecuredParamsDescription) {
        if (this._secured_params.includes(param.name)) {
            process.stderr.write(`...Secured Params: Skipped ${param.name}\n`);
        } else {
            process.stderr.write(`...Secured Params: Added ${param.name}\n`);
            if (this._secured_params.length > 0) {
                this._data.root.plugins.plugin.secured_params.secured_param.push(
                    {
                        _attributes: {
                            name: param.name,
                            value: param.value,
                        },
                    }
                );
            } else {
                this._data.root.plugins.plugin.secured_params.secured_param = [
                    {
                        _attributes: {
                            name: param.name,
                            value: param.value,
                        },
                    },
                ];
            }
            this._secured_params.push(param.name);
        }
    }

    constructor(description?: PluginDescription) {
        this._properties = {
            activity: ["aid"],
            provider: [],
            inventory: [],
            request: [],
        };
        if (description) {
            description.properties?.activity?.forEach((element) => {
                this.add_property(element, OFSEntity.Activity);
            });
            description.properties?.provider?.forEach((element) => {
                this.add_property(element, OFSEntity.Provider);
            });
            description.properties?.inventory?.forEach((element) => {
                this.add_property(element, OFSEntity.Inventory);
            });
            description.securedParams?.forEach((element) => {
                this.add_secured_param(element);
            });
        }
    }
}
