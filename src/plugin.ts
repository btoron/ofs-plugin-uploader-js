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

import {
    PropertiesDescription,
    SecuredParamsDescription,
    PluginDescription,
} from "./descriptor";

export interface PluginDefinition {
    _declaration: { _attributes: { version: string; encoding: string } };
    root: {
        format: {
            _attributes: {
                version: number;
            };
        };
        product: {
            _attributes: {
                version: string;
            };
        };
        plugins: {
            plugin: {
                _attributes: {
                    label: string;
                    action_label: string;
                    action_entity: string;
                    action_type: string;
                    type: string;
                };
                translations: {
                    translation: {
                        _attributes: {
                            lang: string;
                            val: string;
                        };
                    };
                };
                fields: {
                    field?: any;
                };
                secured_params: {
                    secured_param?: any;
                };
                plugin_data: {
                    plugin_data_item: {
                        _attributes: {
                            path: string;
                            post_data: string;
                            width: string;
                            height: string;
                            options: string;
                            user_agent_mask: string;
                            sort_order: number;
                            native_app_label: string;
                            auth_type: string;
                            auth_login: string;
                        };
                        hosted_plugin_data: {
                            _attributes: {
                                name: string;
                                content_hash: string;
                            };
                            content: {
                                _cdata: string;
                            };
                        };
                    };
                };
            };
        };
    };
}

const defaultPluginValues = {
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
                secured_params: {},
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

export class Plugin {
    private _data: PluginDefinition = { ...defaultPluginValues };
    private _properties: PropertiesDescription = {
        activity: ["aid"],
        provider: [],
        inventory: [],
        request: [],
    };
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
            console.warn(
                `...Properties: Skipped ${entity}.${label}. Duplicated`
            );
        } else {
            console.log(`...Properties: Added ${entity}.${label}`);
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
            console.warn(`...Secured Params: Skipped ${param.name}`);
        } else {
            console.log(`...Secured Params: Added ${param.name}`);
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
        if (description) {
            description.properties?.activity?.forEach((element) => {
                if (typeof element === "string") {
                    this.add_property(element, OFSEntity.Activity);
                } else if (typeof element === "object") {
                    if (element.label) {
                        this.add_property(element.label, OFSEntity.Activity);
                    } else {
                        console.warn(
                            "...Properties:..Skipped activity property without label"
                        );
                    }
                } else {
                    console.warn("..Skipped unknown type");
                }
            });
            description.properties?.provider?.forEach((element) => {
                if (typeof element === "string") {
                    this.add_property(element, OFSEntity.Provider);
                } else {
                    console.warn(
                        `Skipped ${element} of type ${typeof element}`
                    );
                }
            });
            description.properties?.inventory?.forEach((element) => {
                if (typeof element === "string") {
                    this.add_property(element, OFSEntity.Inventory);
                }
            });
            if (description.securedParams) {
                description.securedParams?.forEach((element) => {
                    this.add_secured_param(element);
                });
            } else {
                // Remove securedParams section
                this._data.root.plugins.plugin.secured_params = {};
            }
        }
        return this;
    }
}
